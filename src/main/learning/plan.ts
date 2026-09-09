import { getDb } from "../db";
import type { Company, Profile, Question, StudyPlan, PlanWeek } from "../../shared/types";
import { getQuestionInternal } from "../learning/engine";
import { PATTERN_ORDER } from "../data/patterns";
import { catalogMeta } from "../data/seed";

/**
 * Eight-week pattern-first study plan.
 * Weeks 1-2: basics + foundational patterns. Weeks 3-6: pattern ladder with
 * interleaving. Weeks 7-8: mixed review, company-specific gaps, weak patterns.
 * Question pools come from the user's selected companies' research banks.
 */

const LADDER = PATTERN_ORDER.filter((p) => p !== "Arrays");

const WEEK_PATTERNS: string[][] = [
  ["Two Pointers", "Sliding Window", "Hash Maps"],
  ["Prefix Sum", "Binary Search", "Stack / Monotonic Stack"],
  ["Linked List", "Merge Intervals", "Tree BFS"],
  ["Tree DFS", "Graphs", "Heap / Top-K"],
  ["Tries", "Backtracking", "Dynamic Programming"],
  ["Greedy", "Bit Manipulation", "Math & Geometry"],
  [], // mixed review week
  [], // company focus + mock week
];

const WEEK_TITLES = [
  "Foundations: scanning patterns",
  "Structure patterns",
  "Linked structures & trees",
  "Trees, graphs & heaps",
  "Search spaces & DP",
  "Greedy, bits & math",
  "Mixed review: pattern recognition",
  "Company focus & interview simulation",
];

const WEEK_FOCUS = [
  "Blocked introduction per pattern, then interleave with previous weeks from day 2.",
  "Binary search on the answer; monotonic stacks for next-greater problems.",
  "Draw every pointer step. Tree BFS = levels/shortest path.",
  "DFS contract in one sentence before coding. Graphs need visited sets.",
  "Backtracking = choose/explore/unchoose. DP = define dp[i] in words first.",
  "Greedy needs a proof; bits/math are low-yield — cap time here.",
  "Labels hidden. Every problem starts with: which pattern, and why?",
  "Company gap problems, confusable-pair drills, timed mixed sets.",
];

function bankQuestionIds(companies: Company[]): number[] {
  const { banks } = catalogMeta();
  const ids = new Set<number>();
  for (const c of companies) {
    const b = banks[c];
    if (!b) continue;
    for (const id of [...b.core, ...b.gaps, ...b.breadth]) ids.add(id);
  }
  return [...ids];
}

export function generatePlan(profile: Profile): StudyPlan {
  const db = getDb();
  const poolIds = bankQuestionIds(profile.targetCompanies.length ? profile.targetCompanies : (["meta"] as Company[]));
  const pool: Question[] = poolIds
    .map((id) => getQuestionInternal(id))
    .filter((q): q is Question => q !== null);

  const byPattern = new Map<string, Question[]>();
  for (const q of pool) {
    if (!byPattern.has(q.pattern)) byPattern.set(q.pattern, []);
    byPattern.get(q.pattern)!.push(q);
  }
  // Easiest first within a pattern so the ladder ramps
  const rank: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };
  for (const list of byPattern.values()) {
    list.sort((a, b) => rank[a.difficulty] - rank[b.difficulty] || a.leetcodeId - b.leetcodeId);
  }

  const used = new Set<number>();
  const take = (pattern: string, n: number): number[] => {
    const list = byPattern.get(pattern) ?? [];
    const out: number[] = [];
    for (const q of list) {
      if (out.length >= n) break;
      if (!used.has(q.leetcodeId)) {
        used.add(q.leetcodeId);
        out.push(q.leetcodeId);
      }
    }
    return out;
  };

  const perDay = Math.max(2, Math.round(profile.minutesPerDay / 25));
  const weeks: PlanWeek[] = [];

  for (let w = 0; w < 8; w++) {
    const patterns = WEEK_PATTERNS[w];
    let ids: number[] = [];
    if (patterns.length > 0) {
      const perPattern = Math.max(3, Math.ceil((perDay * 5) / patterns.length));
      for (const p of patterns) ids.push(...take(p, perPattern));
      // interleave: pull 1-2 from earlier patterns
      if (w > 0) {
        for (const p of WEEK_PATTERNS[w - 1].slice(0, 2)) ids.push(...take(p, 2));
      }
    } else if (w === 6) {
      // mixed review: sample across all ladder patterns
      for (const p of LADDER) ids.push(...take(p, 2));
    } else {
      // company focus: gap adds first
      const { banks } = catalogMeta();
      const gapIds: number[] = [];
      for (const c of profile.targetCompanies) {
        for (const id of banks[c]?.gaps ?? []) {
          if (!used.has(id) && poolIds.includes(id)) {
            used.add(id);
            gapIds.push(id);
          }
        }
      }
      ids = gapIds.slice(0, perDay * 5);
      for (const p of LADDER) {
        if (ids.length >= perDay * 5) break;
        ids.push(...take(p, 2));
      }
    }
    weeks.push({
      week: w + 1,
      title: WEEK_TITLES[w],
      patterns,
      questionIds: ids,
      focus: WEEK_FOCUS[w],
    });
  }

  // Persist plan snapshot for the dashboard
  db.prepare(
    `INSERT INTO meta (key, value) VALUES ('study_plan', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(JSON.stringify({ weeks, generatedAt: new Date().toISOString() }));

  return {
    weeks,
    totalQuestions: weeks.reduce((n, w) => n + w.questionIds.length, 0),
    generatedAt: new Date().toISOString(),
  };
}

export function getPlanInternal(): StudyPlan | null {
  const row = getDb().prepare("SELECT value FROM meta WHERE key = 'study_plan'").get() as { value: string } | undefined;
  if (!row) return null;
  const parsed = JSON.parse(row.value) as { weeks: PlanWeek[]; generatedAt: string };
  return {
    weeks: parsed.weeks,
    totalQuestions: parsed.weeks.reduce((n, w) => n + w.questionIds.length, 0),
    generatedAt: parsed.generatedAt,
  };
}
