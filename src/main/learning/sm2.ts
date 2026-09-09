/**
 * SM-2 spaced repetition.
 * Ported from the archived competition codebase (backend/src/utils/spaced-repetition.ts)
 * into the local-first main process. Pure functions, no dependencies.
 */

export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

const INITIAL_INTERVAL = 1;
const INITIAL_EASE = 2.5;
const MIN_EASE = 1.3;

export interface SM2Result {
  nextReview: Date;
  intervalDays: number;
  ease: number;
  reviewCount: number;
}

export function calculateSM2(
  quality: SM2Quality,
  previousInterval: number = INITIAL_INTERVAL,
  previousEase: number = INITIAL_EASE,
  reviewCount: number = 0,
): SM2Result {
  let ease = previousEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < MIN_EASE) ease = MIN_EASE;

  let interval: number;
  let count = reviewCount + 1;

  if (quality < 3) {
    interval = 1;
    count = 0; // failed recall resets the chain
  } else if (reviewCount === 0) {
    interval = 1;
  } else if (reviewCount === 1) {
    interval = 6;
  } else {
    interval = Math.round(previousInterval * ease);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  return { nextReview, intervalDays: interval, ease, reviewCount: count };
}

export interface PerformanceParams {
  solved: boolean;
  hintsUsed: number;
  /** actual active time / target time */
  timeRatio: number;
  previousAttempts: number;
}

/**
 * Convert attempt performance into an SM-2 quality rating (0-5).
 * Interview prep weights unaided, on-time solves highest.
 */
export function performanceToQuality(p: PerformanceParams): SM2Quality {
  const { solved, hintsUsed, timeRatio, previousAttempts } = p;
  if (!solved) return previousAttempts > 0 ? 1 : 0;
  if (hintsUsed === 0 && timeRatio <= 1.0) return 5;
  if (hintsUsed === 0 && timeRatio <= 1.5) return 4;
  if (hintsUsed <= 2 && timeRatio <= 2.0) return 3;
  return 2;
}

export function getOverdueDays(nextReview: Date, now: Date = new Date()): number {
  if (now < nextReview) return 0;
  return Math.floor((now.getTime() - nextReview.getTime()) / 86_400_000);
}

/**
 * Review urgency 0..1: overdue amount, low mastery, and long gaps raise it.
 * Ported from the archived calculateReviewUrgency.
 */
export function calculateReviewUrgency(nextReview: Date, mastery: number, daysSinceLastPractice: number): number {
  const overdueDays = getOverdueDays(nextReview);
  let urgency = Math.min(overdueDays / 7, 1.0);
  urgency += (1 - mastery) * 0.3;
  if (daysSinceLastPractice > 30) urgency += 0.2;
  return Math.min(urgency, 1.0);
}

/** Target solve time by difficulty, used for the timeRatio in quality rating. */
export function targetMsFor(difficulty: "Easy" | "Medium" | "Hard"): number {
  switch (difficulty) {
    case "Easy":
      return 15 * 60_000;
    case "Medium":
      return 25 * 60_000;
    case "Hard":
      return 40 * 60_000;
  }
}
