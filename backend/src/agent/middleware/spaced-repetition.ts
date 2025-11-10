/**
 * Spaced Repetition Middleware
 * Manages review scheduling using SM-2 algorithm
 */

import { AgentMiddleware, AgentState, Tool } from '../types';
import { spacedRepetitionService } from '../../services/spaced-repetition.service';
import { performanceToQuality } from '../../utils/spaced-repetition';
import { DEFAULT_USER_ID } from '../../constants';

export class SpacedRepetitionMiddleware implements AgentMiddleware {
  name = 'SpacedRepetitionMiddleware';

  getSystemPrompt(): string {
    return `
You have access to spaced repetition tools to optimize learning:

- **schedule_review**: After a student practices a pattern, schedule the next review using scientifically proven spaced repetition
- **get_due_reviews**: Check which patterns need review today
- **get_upcoming_reviews**: See what reviews are coming up

Use these proactively:
- When a student successfully solves a problem, schedule the next review
- When planning study sessions, check for due reviews
- Prioritize due reviews before introducing new patterns
`;
  }

  getTools(): Tool[] {
    return [
      {
        name: 'schedule_review',
        description: 'Schedule next review for a pattern using spaced repetition (SM-2 algorithm). Call this after a student practices a pattern.',
        parameters: {
          type: 'object',
          properties: {
            patternId: {
              type: 'string',
              description: 'The pattern ID to schedule review for',
            },
            performance: {
              type: 'object',
              properties: {
                solved: { type: 'boolean', description: 'Whether the student solved the problem' },
                hintsUsed: { type: 'number', description: 'Number of hints used' },
                timeRatio: { type: 'number', description: 'Actual time / expected time (1.0 = perfect)' },
                previousAttempts: { type: 'number', description: 'Number of previous attempts on this problem' },
              },
              required: ['solved', 'hintsUsed', 'timeRatio', 'previousAttempts'],
            },
          },
          required: ['patternId', 'performance'],
        },
        execute: async (args, state: AgentState) => {
          const { patternId, performance } = args;
          const userId = state.userId || DEFAULT_USER_ID;

          // Convert performance to SM-2 quality rating
          const quality = performanceToQuality(performance);

          // Update review schedule
          const schedule = await spacedRepetitionService.updateReviewSchedule(
            userId,
            patternId,
            quality
          );

          // Track in state
          if (!state.reviewsScheduled) {
            state.reviewsScheduled = [];
          }
          state.reviewsScheduled.push({
            patternId,
            nextReviewDate: schedule.nextReviewDate,
            intervalDays: schedule.intervalDays,
          });

          return {
            success: true,
            patternId,
            nextReviewDate: schedule.nextReviewDate.toISOString(),
            intervalDays: schedule.intervalDays,
            message: `Review scheduled for ${schedule.intervalDays} day(s) from now`,
          };
        },
      },

      {
        name: 'get_due_reviews',
        description: 'Get all patterns that are due for review today. Use this to prioritize what to practice.',
        parameters: {
          type: 'object',
          properties: {},
        },
        execute: async (args, state: AgentState) => {
          const userId = state.userId || DEFAULT_USER_ID;

          const dueReviews = await spacedRepetitionService.getDueReviews(userId);

          // Get pattern names
          const patternMap = state.patternMap || new Map();
          const duePatterns = dueReviews.map(review => ({
            patternId: review.patternId,
            patternName: patternMap.get(review.patternId)?.name || 'Unknown',
            urgency: review.urgency,
            lastReviewed: review.lastReviewDate?.toISOString(),
            daysOverdue: Math.floor(
              (new Date().getTime() - review.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24)
            ),
          }));

          return {
            count: duePatterns.length,
            patterns: duePatterns,
            message: duePatterns.length > 0
              ? `${duePatterns.length} pattern(s) due for review`
              : 'No reviews due today - great job staying on track!',
          };
        },
      },

      {
        name: 'get_upcoming_reviews',
        description: 'Get upcoming reviews in the next N days. Use this for planning.',
        parameters: {
          type: 'object',
          properties: {
            daysAhead: {
              type: 'number',
              description: 'Number of days to look ahead (default: 7)',
            },
          },
        },
        execute: async (args, state: AgentState) => {
          const userId = state.userId || DEFAULT_USER_ID;
          const daysAhead = args.daysAhead || 7;

          const upcomingReviews = await spacedRepetitionService.getUpcomingReviews(
            userId,
            daysAhead
          );

          // Group by date
          const byDate = new Map<string, any[]>();
          upcomingReviews.forEach(review => {
            const dateKey = review.nextReviewDate.toISOString().split('T')[0];
            if (!byDate.has(dateKey)) {
              byDate.set(dateKey, []);
            }
            byDate.get(dateKey)!.push({
              patternId: review.patternId,
              patternName: state.patternMap?.get(review.patternId)?.name || 'Unknown',
            });
          });

          const schedule = Array.from(byDate.entries()).map(([date, patterns]) => ({
            date,
            patterns,
            count: patterns.length,
          }));

          return {
            daysAhead,
            totalReviews: upcomingReviews.length,
            schedule,
            message: `${upcomingReviews.length} review(s) scheduled in the next ${daysAhead} days`,
          };
        },
      },
    ];
  }

  initializeState(state: AgentState): void {
    state.reviewsScheduled = [];
  }
}
