/**
 * Statistical utilities for learning analytics
 */

import type { LearningSession, PatternKnowledge } from '../types/learning-science';
import { LEARNING_CONSTANTS } from '../constants';

/**
 * Calculate learning velocity (problems solved per week)
 */
export function calculateLearningVelocity(
  sessions: LearningSession[],
  windowDays: number = LEARNING_CONSTANTS.LEARNING_VELOCITY_WINDOW
): number {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - windowDays);

  const recentSessions = sessions.filter(
    s => s.success && new Date(s.startTime) >= windowStart
  );

  const weeksInWindow = windowDays / 7;
  return recentSessions.length / weeksInWindow;
}

/**
 * Calculate overall mastery across patterns
 */
export function calculateOverallMastery(patterns: Map<string, PatternKnowledge>): number {
  if (patterns.size === 0) return 0;

  const totalMastery = Array.from(patterns.values()).reduce(
    (sum, p) => sum + p.mastery,
    0
  );

  return totalMastery / patterns.size;
}

/**
 * Calculate confidence calibration
 * Positive = overconfident, Negative = underconfident, 0 = well-calibrated
 */
export function calculateConfidenceCalibration(
  selfAssessments: Array<{ confidence: number; actualSuccess: boolean }>
): number {
  if (selfAssessments.length === 0) return 0;

  const avgConfidence = selfAssessments.reduce((sum, a) => sum + a.confidence, 0) / selfAssessments.length;
  const actualSuccessRate = selfAssessments.filter(a => a.actualSuccess).length / selfAssessments.length;

  return avgConfidence - actualSuccessRate;
}

/**
 * Calculate consistency score based on practice regularity
 */
export function calculateConsistencyScore(sessions: LearningSession[]): number {
  if (sessions.length < 2) return 0;

  // Group sessions by date
  const sessionsByDate = new Map<string, number>();
  sessions.forEach(s => {
    const dateKey = new Date(s.startTime).toISOString().split('T')[0];
    sessionsByDate.set(dateKey, (sessionsByDate.get(dateKey) || 0) + 1);
  });

  const dates = Array.from(sessionsByDate.keys()).sort();
  if (dates.length < 2) return 0;

  // Calculate variance in gaps between sessions
  const gaps: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const gapDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    gaps.push(gapDays);
  }

  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  const variance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);

  // Lower standard deviation = more consistent
  // Normalize to 0-1 scale (assuming 7 day std dev = 0.5 score)
  const consistencyScore = Math.max(0, 1 - stdDev / 14);

  return consistencyScore;
}

/**
 * Calculate current streak (consecutive days with practice)
 */
export function calculateCurrentStreak(sessions: LearningSession[]): number {
  if (sessions.length === 0) return 0;

  const dates = Array.from(
    new Set(
      sessions.map(s => new Date(s.startTime).toISOString().split('T')[0])
    )
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Streak must include today or yesterday
  if (dates[0] !== today && dates[0] !== yesterdayStr) {
    return 0;
  }

  let currentDate = new Date(dates[0]);
  streak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i]);
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(expectedDate.getDate() - 1);

    if (prevDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest streak
 */
export function calculateLongestStreak(sessions: LearningSession[]): number {
  if (sessions.length === 0) return 0;

  const dates = Array.from(
    new Set(
      sessions.map(s => new Date(s.startTime).toISOString().split('T')[0])
    )
  ).sort();

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Detect breakthrough moment
 * Returns true if recent performance shows significant improvement
 */
export function detectBreakthrough(
  currentMastery: number,
  previousMastery: number,
  recentSuccessRate: number
): boolean {
  const masteryImprovement = currentMastery - previousMastery;
  return (
    masteryImprovement >= LEARNING_CONSTANTS.BREAKTHROUGH_IMPROVEMENT_THRESHOLD &&
    recentSuccessRate >= 0.7
  );
}

/**
 * Calculate frustration score based on session metrics
 */
export function calculateFrustrationScore(params: {
  timeOnProblem: number; // milliseconds
  attemptCount: number;
  hintsRequested: number;
  repeatedQuestions: boolean;
  messageLength: number[];
}): number {
  let score = 0;

  // Time factor
  if (params.timeOnProblem > LEARNING_CONSTANTS.FRUSTRATION_TIME_THRESHOLD) {
    score += 0.3;
  }

  // Attempt factor
  if (params.attemptCount > LEARNING_CONSTANTS.FRUSTRATION_ATTEMPT_THRESHOLD) {
    score += 0.3;
  }

  // Hint factor
  if (params.hintsRequested > 3) {
    score += 0.2;
  }

  // Repeated questions
  if (params.repeatedQuestions) {
    score += 0.2;
  }

  // Message length analysis (short messages might indicate frustration)
  if (params.messageLength.length > 0) {
    const avgLength = params.messageLength.reduce((a, b) => a + b, 0) / params.messageLength.length;
    if (avgLength < 20) {
      score += 0.1;
    }
  }

  return Math.min(score, 1.0);
}

/**
 * Calculate readiness score for interviews (0-100)
 */
export function calculateReadinessScore(params: {
  overallMastery: number;
  patternsLearned: number;
  totalPatterns: number;
  problemsSolved: number;
  averageSolveTime: number;
  targetSolveTime: number;
  mockInterviewScores: number[];
}): number {
  let score = 0;

  // Mastery weight: 40%
  score += params.overallMastery * 40;

  // Pattern coverage weight: 25%
  const patternCoverage = params.patternsLearned / params.totalPatterns;
  score += patternCoverage * 25;

  // Volume weight: 15%
  const volumeScore = Math.min(params.problemsSolved / 100, 1.0);
  score += volumeScore * 15;

  // Speed weight: 10%
  const speedRatio = params.targetSolveTime / params.averageSolveTime;
  const speedScore = Math.min(speedRatio, 1.0);
  score += speedScore * 10;

  // Mock interview weight: 10%
  if (params.mockInterviewScores.length > 0) {
    const avgMockScore = params.mockInterviewScores.reduce((a, b) => a + b, 0) / params.mockInterviewScores.length;
    score += (avgMockScore / 100) * 10;
  }

  return Math.round(score);
}

/**
 * Calculate improvement rate over time
 */
export function calculateImprovementRate(
  masteryHistory: Array<{ date: Date; mastery: number }>
): number {
  if (masteryHistory.length < 2) return 0;

  const sorted = [...masteryHistory].sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const masteryGain = last.mastery - first.mastery;
  const daysDiff = (last.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff === 0) return 0;

  // Return as percentage per week
  return (masteryGain / daysDiff) * 7 * 100;
}

/**
 * Identify strengths and weaknesses
 */
export function identifyStrengthsAndWeaknesses(
  patterns: Map<string, PatternKnowledge>,
  threshold: number = 0.2
): { strengths: string[]; weaknesses: string[] } {
  const patternArray = Array.from(patterns.values());
  const avgMastery = patternArray.reduce((sum, p) => sum + p.mastery, 0) / patternArray.length;

  const strengths = patternArray
    .filter(p => p.mastery >= avgMastery + threshold)
    .map(p => p.patternId);

  const weaknesses = patternArray
    .filter(p => p.mastery <= avgMastery - threshold)
    .map(p => p.patternId);

  return { strengths, weaknesses };
}
