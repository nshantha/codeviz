/**
 * Simplified Bayesian Knowledge Tracing for pattern mastery.
 * Ported from the archived competition codebase
 * (backend/src/services/learning/knowledge-tracker.ts), decoupled from Supabase.
 *
 * Mastery is a probability estimate P(knows pattern) in [0, 1], updated after
 * each attempt. It is DERIVED from the append-only attempt log — recompute it
 * from scratch after imports/merges rather than trusting cached values.
 */

export const PRIOR = 0.1;

export interface KnowledgeEvidence {
  solved: boolean;
  hintsUsed: number;
  /** active solve time / target time */
  timeRatio: number;
  /** pattern was identified without the label being shown */
  identifiedUnaided: boolean;
}

/**
 * One Bayesian-ish update step. Strong unaided solves move mastery most;
 * failures move it down. Bounded to [0, 1].
 */
export function updateMastery(current: number, e: KnowledgeEvidence): number {
  let next = current;
  if (e.solved && e.hintsUsed === 0 && e.timeRatio <= 1.2 && e.identifiedUnaided) {
    next += 0.25; // strong evidence
  } else if (e.solved && e.hintsUsed === 0) {
    next += 0.18;
  } else if (e.solved && e.hintsUsed <= 2) {
    next += 0.1; // weak evidence
  } else if (e.solved) {
    next += 0.04; // solved but heavily hinted — barely moves
  } else {
    next -= 0.15; // evidence of not-knowing
  }
  return Math.max(0, Math.min(1, next));
}

export type MasteryBand = "unstarted" | "learning" | "practicing" | "strong" | "mastered";

/** Product-facing band for a mastery probability. */
export function masteryBand(m: number, attempted: number): MasteryBand {
  if (attempted === 0) return "unstarted";
  if (m < 0.3) return "learning";
  if (m < 0.55) return "practicing";
  if (m < 0.8) return "strong";
  return "mastered";
}

export const MASTERY_LABELS: Record<MasteryBand, string> = {
  unstarted: "Not started",
  learning: "Learning",
  practicing: "Practicing",
  strong: "Strong",
  mastered: "Mastered",
};

/**
 * Recompute mastery for a pattern from its full attempt history.
 * Used after backup imports/merges so cached values never drift from events.
 */
export function recomputeMastery(
  attempts: { solved: boolean; hintsUsed: number; timeRatio: number; identifiedUnaided: boolean }[],
): number {
  let m = PRIOR;
  for (const a of attempts) m = updateMastery(m, a);
  return m;
}
