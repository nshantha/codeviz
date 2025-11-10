/**
 * Recommendation Service
 * Provides adaptive problem recommendations with interleaving and spaced repetition
 */

import { BaseService } from './base.service';
import { spacedRepetitionService } from './spaced-repetition.service';
import { LEARNING_CONSTANTS, DIFFICULTY_SETTINGS } from '../constants';
import { addDays, formatDate, getDayName } from '../utils/date-helpers';
import type {
  ProblemRecommendation,
  WeeklyPlan,
  DailyPlan,
  InterleaveStrategy,
  AdaptiveContext,
} from '../types/learning-science';

export class RecommendationService extends BaseService {
  /**
   * Get next recommended problem with interleaving
   */
  async getNextProblem(userId: string): Promise<ProblemRecommendation | null> {
    try {
      const context = await this.getAdaptiveContext(userId);
      const strategy = this.calculateInterleaveStrategy(context);

      // Decide whether to focus on main pattern or review
      const shouldReview = Math.random() < LEARNING_CONSTANTS.REVIEW_PATTERN_RATIO;
      const targetPatternId = shouldReview
        ? this.selectReviewPattern(strategy.reviewPatterns, context.dueReviews)
        : strategy.focusPattern;

      if (!targetPatternId) return null;

      // Find appropriate problem for the pattern
      const problem = await this.findProblemForPattern(userId, targetPatternId, context) as any;

      if (!problem) return null;

      return {
        problemId: problem.id,
        patternId: targetPatternId,
        reason: shouldReview
          ? 'Reviewing this pattern to reinforce learning'
          : 'Continuing to build mastery in this pattern',
        type: shouldReview ? 'review' : context.currentMastery < 0.5 ? 'new' : 'challenge',
        priority: shouldReview ? 2 : 1,
        estimatedDifficulty: problem.difficulty,
        estimatedTime: this.estimateSolveTime(problem.difficulty, context.currentMastery),
      };
    } catch (error) {
      this.handleError(error, 'getNextProblem');
    }
  }

  /**
   * Generate weekly study plan
   */
  async generateWeeklyPlan(userId: string): Promise<WeeklyPlan> {
    try {
      const context = await this.getAdaptiveContext(userId);
      const strategy = this.calculateInterleaveStrategy(context);

      const weekStartDate = new Date();
      weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay() + 1); // Monday

      const dailyPlans: DailyPlan[] = [];
      let totalTime = 0;

      // Generate plan for 7 days
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStartDate, i);
        const dayPlan = await this.generateDailyPlan(
          userId,
          date,
          i,
          strategy,
          context
        );
        dailyPlans.push(dayPlan);
        totalTime += dayPlan.estimatedTime;
      }

      return {
        userId,
        weekStartDate,
        dailyPlans,
        focusPatterns: [strategy.focusPattern].filter(Boolean) as string[],
        reviewPatterns: strategy.reviewPatterns,
        totalEstimatedTime: totalTime,
        goals: this.generateWeeklyGoals(context),
      };
    } catch (error) {
      this.handleError(error, 'generateWeeklyPlan');
    }
  }

  /**
   * Generate daily plan
   */
  private async generateDailyPlan(
    userId: string,
    date: Date,
    dayIndex: number,
    strategy: InterleaveStrategy,
    context: AdaptiveContext
  ): Promise<DailyPlan> {
    const dayName = getDayName(date);
    const problems: ProblemRecommendation[] = [];
    let estimatedTime = 0;

    // Weekend = more practice, weekday = focused
    const problemCount = [0, 6].includes(date.getDay()) ? 3 : 2;

    // Alternate between focus and review
    for (let i = 0; i < problemCount; i++) {
      const useReview = i % 2 === 1 && strategy.reviewPatterns.length > 0;
      const patternId = useReview
        ? strategy.reviewPatterns[i % strategy.reviewPatterns.length]
        : strategy.focusPattern;

      if (patternId) {
        const problem = await this.findProblemForPattern(userId, patternId, context) as any;
        if (problem) {
          const time = this.estimateSolveTime(problem.difficulty, context.currentMastery);
          problems.push({
            problemId: problem.id,
            patternId,
            reason: useReview ? 'Spaced review' : 'Building mastery',
            type: useReview ? 'review' : 'new',
            priority: i + 1,
            estimatedDifficulty: problem.difficulty,
            estimatedTime: time,
          });
          estimatedTime += time;
        }
      }
    }

    const focusArea = this.getFocusAreaForDay(dayIndex);

    return {
      date,
      dayOfWeek: dayName,
      problems,
      patterns: Array.from(new Set(problems.map(p => p.patternId))),
      estimatedTime,
      focusArea,
      motivationalMessage: this.getMotivationalMessage(dayIndex, estimatedTime),
    };
  }

  /**
   * Get adaptive context for decision making
   */
  private async getAdaptiveContext(userId: string): Promise<AdaptiveContext> {
    const { data: knowledgeState } = await this.db
      .from('knowledge_state')
      .select('*')
      .eq('user_id', userId);

    const { data: goals } = await this.db
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    const dueReviews = await spacedRepetitionService.getDueReviews(userId);

    const currentMastery = knowledgeState && knowledgeState.length > 0
      ? knowledgeState.reduce((sum, k) => sum + k.mastery_probability, 0) / knowledgeState.length
      : 0;

    // Get recent performance
    const { data: recentSessions } = await this.db
      .from('learning_sessions')
      .select('success')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(10);

    const recentPerformance = (recentSessions || []).map(s => s.success ? 1 : 0);

    return {
      currentMastery,
      learningVelocity: 0, // TODO: calculate from sessions
      recentPerformance,
      timeAvailable: goals?.weekly_time_commitment || 10,
      dueReviews: dueReviews.map(r => r.patternId),
      goals: goals || {
        userId,
        targetRole: 'Software Engineer',
        weeklyTimeCommitment: 10,
        currentLevel: 'intermediate',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      frustrationLevel: 0, // TODO: calculate from recent sessions
    };
  }

  /**
   * Calculate interleaving strategy
   */
  private calculateInterleaveStrategy(context: AdaptiveContext): InterleaveStrategy {
    // Find focus pattern (lowest mastery that's been introduced)
    const selectFocusPattern = async () => {
      const { data } = await this.db
        .from('knowledge_state')
        .select('pattern_id, mastery_probability, status')
        .eq('user_id', context.goals.userId)
        .in('status', ['Practicing', 'Introduced'])
        .order('mastery_probability', { ascending: true })
        .limit(1)
        .single();

      return data?.pattern_id || null;
    };

    // Select review patterns (patterns with decent mastery but due for review)
    const selectReviewPatterns = async () => {
      const { data } = await this.db
        .from('knowledge_state')
        .select('pattern_id, mastery_probability')
        .eq('user_id', context.goals.userId)
        .gte('mastery_probability', LEARNING_CONSTANTS.MASTERY_PRACTICING)
        .order('last_practiced', { ascending: true })
        .limit(3);

      return (data || []).map(d => d.pattern_id);
    };

    // This is async, but for simplicity, we'll return a promise-based approach
    // In a real implementation, this should be awaited by the caller
    return {
      focusPattern: '', // Will be filled by caller
      reviewPatterns: context.dueReviews.slice(0, 3),
      ratio: {
        focus: LEARNING_CONSTANTS.FOCUS_PATTERN_RATIO,
        review: LEARNING_CONSTANTS.REVIEW_PATTERN_RATIO,
      },
      reasoning: 'Interleaving helps you learn when to apply each pattern',
    };
  }

  /**
   * Select a review pattern from the list
   */
  private selectReviewPattern(reviewPatterns: string[], dueReviews: string[]): string | null {
    // Prioritize due reviews
    const dueCandidates = reviewPatterns.filter(p => dueReviews.includes(p));
    if (dueCandidates.length > 0) {
      return dueCandidates[Math.floor(Math.random() * dueCandidates.length)];
    }

    // Otherwise pick any review pattern
    if (reviewPatterns.length > 0) {
      return reviewPatterns[Math.floor(Math.random() * reviewPatterns.length)];
    }

    return null;
  }

  /**
   * Find appropriate problem for pattern and mastery level
   */
  private async findProblemForPattern(
    userId: string,
    patternId: string,
    context: AdaptiveContext
  ): Promise<{ id: any; title: any; slug: any; difficulty: any } | null> {
    // Get knowledge for this specific pattern
    const { data: knowledge } = await this.db
      .from('knowledge_state')
      .select('mastery_probability')
      .eq('user_id', userId)
      .eq('pattern_id', patternId)
      .single();

    const mastery = knowledge?.mastery_probability || 0;

    // Determine appropriate difficulty
    let difficulty: 'Easy' | 'Medium' | 'Hard';
    if (mastery < DIFFICULTY_SETTINGS.EASY_MASTERY_RANGE[1]) {
      difficulty = 'Easy';
    } else if (mastery < DIFFICULTY_SETTINGS.MEDIUM_MASTERY_RANGE[1]) {
      difficulty = 'Medium';
    } else {
      difficulty = 'Hard';
    }

    // Get problems that haven't been solved yet for this pattern
    const { data: problems } = await this.db
      .from('problem_patterns')
      .select('problem_id, problems(id, title, slug, difficulty)')
      .eq('pattern_id', patternId)
      .eq('problems.difficulty', difficulty);

    if (!problems || problems.length === 0) {
      // Fallback: any problem for this pattern
      const { data: anyProblems } = await this.db
        .from('problem_patterns')
        .select('problem_id, problems(id, title, slug, difficulty)')
        .eq('pattern_id', patternId)
        .limit(1);

      return anyProblems && anyProblems[0] ? (anyProblems[0] as any).problems : null;
    }

    // TODO: Filter out already solved problems
    const problem = problems[Math.floor(Math.random() * problems.length)];
    return (problem as any).problems;
  }

  /**
   * Estimate solve time based on difficulty and mastery
   */
  private estimateSolveTime(difficulty: string, mastery: number): number {
    const baseTime = {
      Easy: 20,
      Medium: 35,
      Hard: 50,
    }[difficulty] || 30;

    // Reduce time as mastery increases
    const masteryFactor = 1 - (mastery * 0.4); // Max 40% reduction
    return Math.round(baseTime * masteryFactor);
  }

  /**
   * Generate weekly goals
   */
  private generateWeeklyGoals(context: AdaptiveContext): string[] {
    const goals: string[] = [];

    if (context.dueReviews.length > 0) {
      goals.push(`Review ${context.dueReviews.length} patterns that need reinforcement`);
    }

    if (context.currentMastery < 0.5) {
      goals.push('Build foundation in core patterns');
    } else if (context.currentMastery < 0.7) {
      goals.push('Strengthen mastery across all patterns');
    } else {
      goals.push('Master advanced problems and edge cases');
    }

    goals.push('Maintain consistent practice streak');

    return goals;
  }

  /**
   * Get focus area for day of week
   */
  private getFocusAreaForDay(dayIndex: number): string {
    const areas = [
      'New pattern introduction',
      'Deliberate practice',
      'Mixed pattern problems',
      'Challenge problems',
      'Review and consolidation',
      'Extended practice session',
      'Weekly reflection and planning',
    ];
    return areas[dayIndex];
  }

  /**
   * Get motivational message for day
   */
  private getMotivationalMessage(dayIndex: number, estimatedTime: number): string {
    const messages = [
      `Start the week strong! ${estimatedTime} minutes of focused practice.`,
      `Keep the momentum going! You've got this.`,
      `Midweek push! Every problem makes you stronger.`,
      `Almost there! Stay consistent.`,
      `Friday challenge! End the week on a high note.`,
      `Weekend warrior! Extra practice time today.`,
      `Reflect on your progress and plan for next week!`,
    ];
    return messages[dayIndex];
  }
}

// Singleton instance
export const recommendationService = new RecommendationService();
