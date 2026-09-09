import { getDb } from "../db";
import type { NextUpItem, PatternState, Question, ReviewItem } from "../../shared/types";
import { getQuestionInternal, getPatternStateInternal } from "./engine";
import { calculateReviewUrgency, getOverdueDays } from "./sm2";

function rowToReviewItem(r: {
  question_id: number; ease: number; interval_days: number; next_review: string;
  review_count: number; lapses: number; last_outcome: string | null; updated_at: string;
}): ReviewItem {
  return {
    questionId: r.question_id,
    ease: r.ease,
    intervalDays: r.interval_days,
    nextReview: r.next_review,
    reviewCount: r.review_count,
    lapses: r.lapses,
    lastOutcome: r.last_outcome as ReviewItem["lastOutcome"],
    updatedAt: r.updated_at,
  };
}

/** All scheduled reviews, most urgent first. */
export function getReviewQueueInternal(): ReviewItem[] {
  const rows = getDb().prepare("SELECT * FROM review_items").all() as Parameters<typeof rowToReviewItem>[0][];
  const now = new Date();
  const items = rows.map((r) => {
    const item = rowToReviewItem(r);
    const question = getQuestionInternal(item.questionId);
    const ps = question ? getPatternStateInternal(question.pattern) : null;
    const overdueDays = getOverdueDays(new Date(item.nextReview + "T00:00:00"), now);
    const urgency = calculateReviewUrgency(
      new Date(item.nextReview + "T00:00:00"),
      ps?.mastery ?? 0.5,
      0,
    );
    return { ...item, question: question ?? undefined, overdueDays, urgency };
  });
  // Due (or overdue) first, then by urgency, then upcoming
  return items.sort((a, b) => {
    const aDue = (a.overdueDays ?? 0) > 0 || new Date(a.nextReview) <= now;
    const bDue = (b.overdueDays ?? 0) > 0 || new Date(b.nextReview) <= now;
    if (aDue !== bDue) return aDue ? -1 : 1;
    return (b.urgency ?? 0) - (a.urgency ?? 0);
  });
}

export function getPatternStatesInternal(): PatternState[] {
  const rows = getDb().prepare("SELECT * FROM pattern_state ORDER BY mastery ASC").all() as {
    pattern: string; mastery: number; ease: number; interval_days: number; next_review: string | null;
    review_count: number; lapses: number; problems_attempted: number; problems_solved: number; updated_at: string;
  }[];
  return rows.map((r) => ({
    pattern: r.pattern,
    mastery: r.mastery,
    ease: r.ease,
    intervalDays: r.interval_days,
    nextReview: r.next_review,
    reviewCount: r.review_count,
    lapses: r.lapses,
    problemsAttempted: r.problems_attempted,
    problemsSolved: r.problems_solved,
    updatedAt: r.updated_at,
  }));
}

/** Confusable pattern pairs for discrimination drills. */
export function getConfusablePairs(): { a: string; b: string; why: string }[] {
  return [
    {
      a: "Sliding Window",
      b: "Two Pointers",
      why: "Both shrink/grow over arrays. Sliding window maintains a valid window invariant (e.g. at most K distinct); two pointers converge from both ends on sorted input.",
    },
    {
      a: "Tree BFS",
      b: "Tree DFS",
      why: "BFS is level-by-level (shortest path in unweighted trees, level order); DFS goes deep first (path existence, subtree checks).",
    },
    {
      a: "Hash Maps",
      b: "Prefix Sum",
      why: "Prefix sums answer range-sum queries; the hash map of prefix frequencies turns 'subarray equals K' into O(n). Know which half does the work.",
    },
    {
      a: "Binary Search",
      b: "Heap / Top-K",
      why: "Binary search finds positions/thresholds in sorted or monotonic spaces; heaps maintain the K best seen so far in a stream.",
    },
    {
      a: "Backtracking",
      b: "Dynamic Programming",
      why: "Backtracking explores all candidates with pruning; DP memoizes overlapping subproblems. If subproblems repeat, reach for DP.",
    },
    {
      a: "Stack / Monotonic Stack",
      b: "Heap / Top-K",
      why: "Monotonic stacks find next-greater/smaller in one pass; heaps keep order statistics over time. Both answer 'extreme nearby' questions differently.",
    },
    {
      a: "Merge Intervals",
      b: "Sweep Line",
      why: "Overlapping interval problems sort by start and merge; sweep-line tracks concurrent events with start/end markers.",
    },
    {
      a: "Graphs",
      b: "Tree DFS",
      why: "Trees are acyclic — no visited set needed. Graphs need visited tracking and cycle handling; topological sort only exists for DAGs.",
    },
    {
      a: "Greedy",
      b: "Dynamic Programming",
      why: "Greedy commits locally and never looks back; DP keeps options open. Greedy needs a proof (exchange argument); when in doubt, DP is safer.",
    },
  ];
}

/**
 * "What should I practice next?" — ranks due reviews, weak patterns,
 * and fresh questions from the active plan.
 */
export function getNextUpInternal(limit = 8): NextUpItem[] {
  const items: NextUpItem[] = [];
  const now = new Date();

  // 1. Due / overdue reviews (highest priority)
  const queue = getReviewQueueInternal();
  for (const r of queue) {
    if (new Date(r.nextReview) > now && (r.overdueDays ?? 0) <= 0) break;
    if (!r.question) continue;
    items.push({
      kind: "review",
      questionId: r.questionId,
      pattern: r.question.pattern,
      reason:
        (r.overdueDays ?? 0) > 0
          ? `Overdue review (${r.overdueDays}d late) — ${r.question.title}`
          : `Due review — ${r.question.title}`,
      priority: 100 + (r.urgency ?? 0) * 50,
      question: r.question,
    });
    if (items.length >= limit) break;
  }

  // 2. Weak patterns: lowest mastery with attempts
  if (items.length < limit) {
    const states = getPatternStatesInternal().filter((s) => s.problemsAttempted > 0 && s.mastery < 0.55);
    for (const s of states.slice(0, 3)) {
      const q = pickFreshQuestion(s.pattern);
      if (!q) continue;
      items.push({
        kind: "weak-pattern",
        questionId: q.leetcodeId,
        pattern: s.pattern,
        reason: `${s.pattern} is your weakest pattern (mastery ${Math.round(s.mastery * 100)}%) — fresh problem`,
        priority: 70 - s.mastery * 40,
        question: q,
      });
      if (items.length >= limit) break;
    }
  }

  // 3. Fresh questions from the current plan week
  if (items.length < limit) {
    const fresh = pickPlanQuestions(limit - items.length);
    for (const q of fresh) {
      items.push({
        kind: "new",
        questionId: q.leetcodeId,
        pattern: q.pattern,
        reason: `New ${q.pattern} problem from your plan — ${q.title}`,
        priority: 40,
        question: q,
      });
    }
  }

  return items.sort((a, b) => b.priority - a.priority).slice(0, limit);
}

function attemptedIds(): Set<number> {
  const rows = getDb().prepare("SELECT DISTINCT question_id AS id FROM attempts").all() as { id: number }[];
  return new Set(rows.map((r) => r.id));
}

function pickFreshQuestion(pattern: string): Question | null {
  const done = attemptedIds();
  const rows = getDb()
    .prepare("SELECT leetcode_id FROM questions WHERE pattern = ? ORDER BY leetcode_id")
    .all(pattern) as { leetcode_id: number }[];
  for (const r of rows) {
    if (!done.has(r.leetcode_id)) {
      return getQuestionInternal(r.leetcode_id);
    }
  }
  return null;
}

function pickPlanQuestions(n: number): Question[] {
  // Simplest useful heuristic for M1: unattempted questions in plan order
  // (plan generation orders by pattern ladder). Refine with plan awareness later.
  const done = attemptedIds();
  const rows = getDb().prepare("SELECT leetcode_id FROM questions ORDER BY leetcode_id").all() as { leetcode_id: number }[];
  const out: Question[] = [];
  for (const r of rows) {
    if (!done.has(r.leetcode_id)) {
      const q = getQuestionInternal(r.leetcode_id);
      if (q) out.push(q);
      if (out.length >= n) break;
    }
  }
  return out;
}
