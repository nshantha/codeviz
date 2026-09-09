import { randomUUID } from "node:crypto";
import { getDb, getDeviceId } from "../db";
import { appendEvent } from "../sync/events";
import type { Attempt, AttemptInput, PatternState, Question, ReviewItem } from "../../shared/types";
import { calculateSM2, performanceToQuality, targetMsFor, SM2Quality } from "./sm2";
import { updateMastery, PRIOR } from "./knowledge";

const nowIso = () => new Date().toISOString();

function defaultPatternState(pattern: string): PatternState {
  return {
    pattern,
    mastery: PRIOR,
    ease: 2.5,
    intervalDays: 1,
    nextReview: null,
    reviewCount: 0,
    lapses: 0,
    problemsAttempted: 0,
    problemsSolved: 0,
    updatedAt: nowIso(),
  };
}

export function getQuestionInternal(id: number): Question | null {  const row = getDb().prepare("SELECT * FROM questions WHERE leetcode_id = ?").get(id) as
    | { leetcode_id: number; title: string; difficulty: string; pattern: string; leetcode_url: string; neetcode150: number; companies: string }
    | undefined;
  if (!row) return null;
  return {
    leetcodeId: row.leetcode_id,
    title: row.title,
    difficulty: row.difficulty as Question["difficulty"],
    pattern: row.pattern,
    leetcodeUrl: row.leetcode_url,
    neetcode150: row.neetcode150 === 1,
    companies: JSON.parse(row.companies),
  };
}

export function getPatternStateInternal(pattern: string): PatternState {
  const row = getDb().prepare("SELECT * FROM pattern_state WHERE pattern = ?").get(pattern) as
    | { pattern: string; mastery: number; ease: number; interval_days: number; next_review: string | null; review_count: number; lapses: number; problems_attempted: number; problems_solved: number; updated_at: string }
    | undefined;
  if (!row) return defaultPatternState(pattern);
  return {
    pattern: row.pattern,
    mastery: row.mastery,
    ease: row.ease,
    intervalDays: row.interval_days,
    nextReview: row.next_review,
    reviewCount: row.review_count,
    lapses: row.lapses,
    problemsAttempted: row.problems_attempted,
    problemsSolved: row.problems_solved,
    updatedAt: row.updated_at,
  };
}

function savePatternState(s: PatternState): void {
  getDb()
    .prepare(
      `INSERT INTO pattern_state (pattern, mastery, ease, interval_days, next_review, review_count, lapses, problems_attempted, problems_solved, updated_at)
       VALUES (@pattern, @mastery, @ease, @intervalDays, @nextReview, @reviewCount, @lapses, @problemsAttempted, @problemsSolved, @updatedAt)
       ON CONFLICT(pattern) DO UPDATE SET
         mastery=excluded.mastery, ease=excluded.ease, interval_days=excluded.interval_days,
         next_review=excluded.next_review, review_count=excluded.review_count, lapses=excluded.lapses,
         problems_attempted=excluded.problems_attempted, problems_solved=excluded.problems_solved,
         updated_at=excluded.updated_at`,
    )
    .run(s);
}

export function getReviewItemInternal(questionId: number): ReviewItem | null {
  const row = getDb().prepare("SELECT * FROM review_items WHERE question_id = ?").get(questionId) as
    | { question_id: number; ease: number; interval_days: number; next_review: string; review_count: number; lapses: number; last_outcome: string | null; updated_at: string }
    | undefined;
  if (!row) return null;
  return {
    questionId: row.question_id,
    ease: row.ease,
    intervalDays: row.interval_days,
    nextReview: row.next_review,
    reviewCount: row.review_count,
    lapses: row.lapses,
    lastOutcome: row.last_outcome as ReviewItem["lastOutcome"],
    updatedAt: row.updated_at,
  };
}

function saveReviewItem(r: ReviewItem): void {
  getDb()
    .prepare(
      `INSERT INTO review_items (question_id, ease, interval_days, next_review, review_count, lapses, last_outcome, updated_at)
       VALUES (@questionId, @ease, @intervalDays, @nextReview, @reviewCount, @lapses, @lastOutcome, @updatedAt)
       ON CONFLICT(question_id) DO UPDATE SET
         ease=excluded.ease, interval_days=excluded.interval_days, next_review=excluded.next_review,
         review_count=excluded.review_count, lapses=excluded.lapses,
         last_outcome=excluded.last_outcome, updated_at=excluded.updated_at`,
    )
    .run(r);
}

export function countPreviousAttempts(questionId: number): number {
  const row = getDb().prepare("SELECT COUNT(*) AS c FROM attempts WHERE question_id = ?").get(questionId) as { c: number };
  return row.c;
}

/**
 * Record an attempt (append-only), then derive pattern mastery and review
 * scheduling from it. Returns the updated state for immediate UI use.
 */
export function recordAttempt(input: AttemptInput): { attempt: Attempt; patternState: PatternState; reviewItem: ReviewItem } {
  const db = getDb();
  const question = getQuestionInternal(input.questionId);
  if (!question) throw new Error(`Unknown question ${input.questionId}`);

  const attempt: Attempt = {
    ...input,
    id: randomUUID(),
    deviceId: getDeviceId(),
    createdAt: nowIso(),
  };

  const insert = db.prepare(
    `INSERT INTO attempts (id, device_id, question_id, started_at, ended_at, active_ms, elapsed_ms,
       outcome, hints_used, confidence, pattern_identified_unaided, label_shown, notes, created_at)
     VALUES (@id, @deviceId, @questionId, @startedAt, @endedAt, @activeMs, @elapsedMs,
       @outcome, @hintsUsed, @confidence, @patternIdentifiedUnaided, @labelShown, @notes, @createdAt)`,
  );

  const solved = input.outcome === "solved";
  const timeRatio = input.activeMs / targetMsFor(question.difficulty);
  const prevAttempts = countPreviousAttempts(input.questionId);
  const quality: SM2Quality = performanceToQuality({
    solved,
    hintsUsed: input.hintsUsed,
    timeRatio,
    previousAttempts: prevAttempts,
  });

  // --- pattern state update
  const ps = getPatternStateInternal(question.pattern);
  const mastery = updateMastery(ps.mastery, {
    solved,
    hintsUsed: input.hintsUsed,
    timeRatio,
    identifiedUnaided: input.patternIdentifiedUnaided === true,
  });
  const sm2p = calculateSM2(quality, ps.intervalDays, ps.ease, ps.reviewCount);
  const updatedPs: PatternState = {
    ...ps,
    mastery,
    ease: sm2p.ease,
    intervalDays: sm2p.intervalDays,
    nextReview: sm2p.nextReview.toISOString().slice(0, 10),
    reviewCount: sm2p.reviewCount,
    lapses: ps.lapses + (quality < 3 && ps.reviewCount > 0 ? 1 : 0),
    problemsAttempted: ps.problemsAttempted + 1,
    problemsSolved: ps.problemsSolved + (solved ? 1 : 0),
    updatedAt: nowIso(),
  };

  // --- per-question review item update
  const existing = getReviewItemInternal(input.questionId);
  const sm2q = calculateSM2(
    quality,
    existing?.intervalDays ?? 1,
    existing?.ease ?? 2.5,
    existing?.reviewCount ?? 0,
  );
  const reviewItem: ReviewItem = {
    questionId: input.questionId,
    ease: sm2q.ease,
    intervalDays: sm2q.intervalDays,
    nextReview: sm2q.nextReview.toISOString().slice(0, 10),
    reviewCount: sm2q.reviewCount,
    lapses: (existing?.lapses ?? 0) + (quality < 3 && (existing?.reviewCount ?? 0) > 0 ? 1 : 0),
    lastOutcome: input.outcome,
    updatedAt: nowIso(),
  };

  const tx = db.transaction(() => {
    insert.run({
      ...attempt,
      patternIdentifiedUnaided: attempt.patternIdentifiedUnaided === null ? null : attempt.patternIdentifiedUnaided ? 1 : 0,
      labelShown: attempt.labelShown ? 1 : 0,
    });
    savePatternState(updatedPs);
    saveReviewItem(reviewItem);
  });
  tx();

  // Append to this device's sync log (no-op when sync isn't configured)
  appendEvent("attempt", "upsert", { ...attempt });

  return { attempt, patternState: updatedPs, reviewItem };
}

export function listAttemptsInternal(questionId?: number): Attempt[] {
  const rows = (questionId === undefined
    ? getDb().prepare("SELECT * FROM attempts ORDER BY created_at DESC").all()
    : getDb().prepare("SELECT * FROM attempts WHERE question_id = ? ORDER BY created_at DESC").all(questionId)) as {
    id: string; device_id: string; question_id: number; started_at: string; ended_at: string;
    active_ms: number; elapsed_ms: number; outcome: string; hints_used: number; confidence: number;
    pattern_identified_unaided: number | null; label_shown: number; notes: string; created_at: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    deviceId: r.device_id,
    questionId: r.question_id,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    activeMs: r.active_ms,
    elapsedMs: r.elapsed_ms,
    outcome: r.outcome as Attempt["outcome"],
    hintsUsed: r.hints_used,
    confidence: r.confidence,
    patternIdentifiedUnaided: r.pattern_identified_unaided === null ? null : r.pattern_identified_unaided === 1,
    labelShown: r.label_shown === 1,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

export interface QuestionFilter {
  companies?: string[];
  patterns?: string[];
  section?: string;
}

/** List questions, optionally filtered by company / pattern / bank section. */
export function listQuestionsInternal(filter: QuestionFilter = {}): Question[] {
  const rows = getDb().prepare("SELECT * FROM questions ORDER BY leetcode_id").all() as {
    leetcode_id: number; title: string; difficulty: string; pattern: string;
    leetcode_url: string; neetcode150: number; companies: string;
  }[];
  return rows
    .map((row) => ({
      leetcodeId: row.leetcode_id,
      title: row.title,
      difficulty: row.difficulty as Question["difficulty"],
      pattern: row.pattern,
      leetcodeUrl: row.leetcode_url,
      neetcode150: row.neetcode150 === 1,
      companies: JSON.parse(row.companies) as Question["companies"],
    }))
    .filter((q) => {
      if (filter.patterns?.length && !filter.patterns.includes(q.pattern)) return false;
      if (filter.companies?.length || filter.section) {
        const tags = q.companies.filter(
          (t) =>
            (!filter.companies?.length || filter.companies.includes(t.company)) &&
            (!filter.section || t.section === filter.section),
        );
        if (!tags.length) return false;
      }
      return true;
    });
}
