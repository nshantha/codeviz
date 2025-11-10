/**
 * Spaced Repetition Utilities
 * Implements the SM-2 (SuperMemo 2) algorithm
 */

import { SM2_CONSTANTS } from '../constants';
import type { SM2Quality, SM2Result } from '../types/learning-science';

/**
 * Calculate next review using SM-2 algorithm
 *
 * @param quality - Performance quality (0-5)
 *   5: Perfect response
 *   4: Correct after hesitation
 *   3: Correct with difficulty
 *   2: Incorrect but remembered
 *   1: Incorrect, seemed familiar
 *   0: Complete blackout
 *
 * @param previousInterval - Previous interval in days
 * @param previousEaseFactor - Previous ease factor
 * @param reviewCount - Number of times reviewed
 *
 * @returns Next review schedule
 */
export function calculateSM2(
  quality: SM2Quality,
  previousInterval: number = SM2_CONSTANTS.INITIAL_INTERVAL,
  previousEaseFactor: number = SM2_CONSTANTS.INITIAL_EASE_FACTOR,
  reviewCount: number = 0
): SM2Result {
  // Calculate new ease factor
  let newEaseFactor = previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ensure ease factor doesn't go below minimum
  if (newEaseFactor < SM2_CONSTANTS.MIN_EASE_FACTOR) {
    newEaseFactor = SM2_CONSTANTS.MIN_EASE_FACTOR;
  }

  let newInterval: number;
  let newReviewCount = reviewCount + 1;

  // If quality < 3, reset interval (failed recall)
  if (quality < 3) {
    newInterval = 1;
    newReviewCount = 0; // Reset review count on failure
  } else {
    // Calculate new interval based on review count
    if (reviewCount === 0) {
      newInterval = 1;
    } else if (reviewCount === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(previousInterval * newEaseFactor);
    }
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    nextReviewDate,
    intervalDays: newInterval,
    easeFactor: newEaseFactor,
    reviewCount: newReviewCount,
  };
}

/**
 * Convert performance metrics to SM-2 quality rating
 *
 * @param params Performance parameters
 * @returns Quality rating (0-5)
 */
export function performanceToQuality(params: {
  solved: boolean;
  hintsUsed: number;
  timeRatio: number; // actual time / expected time
  previousAttempts: number;
}): SM2Quality {
  const { solved, hintsUsed, timeRatio, previousAttempts } = params;

  if (!solved) {
    // Failed to solve
    if (previousAttempts > 0) {
      return 1; // Seemed familiar but couldn't solve
    }
    return 0; // Complete blackout
  }

  // Solved successfully - evaluate quality
  if (hintsUsed === 0 && timeRatio <= 1.0) {
    return 5; // Perfect response
  }

  if (hintsUsed === 0 && timeRatio <= 1.5) {
    return 4; // Correct after some hesitation
  }

  if (hintsUsed <= 2 && timeRatio <= 2.0) {
    return 3; // Correct with difficulty
  }

  // Solved but with significant help
  return 2;
}

/**
 * Check if a pattern is due for review
 */
export function isDueForReview(nextReviewDate: Date): boolean {
  return new Date() >= nextReviewDate;
}

/**
 * Get overdue amount in days
 */
export function getOverdueDays(nextReviewDate: Date): number {
  const now = new Date();
  if (now < nextReviewDate) return 0;

  const diffMs = now.getTime() - nextReviewDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate urgency score for review (0-1)
 * Higher score = more urgent
 */
export function calculateReviewUrgency(
  nextReviewDate: Date,
  mastery: number,
  daysSinceLastPractice: number
): number {
  const overdueDays = getOverdueDays(nextReviewDate);

  // Base urgency on overdue amount
  let urgency = Math.min(overdueDays / 7, 1.0); // Max at 1 week overdue

  // Increase urgency for lower mastery
  urgency += (1 - mastery) * 0.3;

  // Increase urgency for long gaps
  if (daysSinceLastPractice > 30) {
    urgency += 0.2;
  }

  return Math.min(urgency, 1.0);
}

/**
 * Generate optimal review schedule for multiple patterns
 * Spreads reviews across days to avoid cramming
 */
export function generateReviewSchedule(
  patterns: Array<{
    patternId: string;
    nextReviewDate: Date;
    mastery: number;
  }>,
  daysAhead: number = 7
): Map<string, string[]> {
  // Group by date
  const schedule = new Map<string, string[]>();

  patterns
    .filter(p => isDueForReview(p.nextReviewDate))
    .sort((a, b) => {
      // Sort by urgency
      const urgencyA = calculateReviewUrgency(a.nextReviewDate, a.mastery, 0);
      const urgencyB = calculateReviewUrgency(b.nextReviewDate, b.mastery, 0);
      return urgencyB - urgencyA;
    })
    .forEach(pattern => {
      const dateKey = pattern.nextReviewDate.toISOString().split('T')[0];
      if (!schedule.has(dateKey)) {
        schedule.set(dateKey, []);
      }
      schedule.get(dateKey)!.push(pattern.patternId);
    });

  return schedule;
}
