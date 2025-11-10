/**
 * Adaptive Recommendation Middleware
 * Provides intelligent problem recommendations with interleaving
 */

import { AgentMiddleware, AgentState, Tool } from '../types';
import { recommendationService } from '../../services/recommendation.service';
import { DEFAULT_USER_ID } from '../../constants';

export class AdaptiveRecommendationMiddleware implements AgentMiddleware {
  name = 'AdaptiveRecommendationMiddleware';

  getSystemPrompt(): string {
    return `
You have access to adaptive recommendation tools:

- **get_next_problem**: Get the best next problem based on mastery and spaced repetition
- **get_weekly_plan**: Generate a structured weekly study plan
- **explain_recommendation**: Explain why a particular problem is recommended

Use these to:
- Recommend the right problem at the right time
- Balance new learning with review (interleaving)
- Adapt difficulty based on student performance
- Create structured learning paths

Don't just give random problems - use data-driven recommendations that optimize learning.
`;
  }

  getTools(): Tool[] {
    return [
      {
        name: 'get_next_problem',
        description: 'Get the best next problem recommendation based on mastery, spaced repetition, and interleaving strategy.',
        parameters: {
          type: 'object',
          properties: {},
        },
        execute: async (args, state: AgentState) => {
          const userId = state.userId || DEFAULT_USER_ID;

          const recommendation = await recommendationService.getNextProblem(userId);

          if (!recommendation) {
            return {
              success: false,
              message: 'No problems available. Please add problems to the database.',
            };
          }

          // Get pattern and problem details
          const patternName = state.patternMap?.get(recommendation.patternId)?.name || 'Unknown';

          return {
            success: true,
            recommendation: {
              problemId: recommendation.problemId,
              pattern: patternName,
              difficulty: recommendation.estimatedDifficulty,
              estimatedTime: `${recommendation.estimatedTime} minutes`,
              type: recommendation.type, // 'new', 'review', or 'challenge'
              reason: recommendation.reason,
              priority: recommendation.priority,
            },
            message: `Recommended: ${recommendation.type} problem in ${patternName} pattern`,
          };
        },
      },

      {
        name: 'get_weekly_plan',
        description: 'Generate a structured weekly study plan with daily goals and problem recommendations.',
        parameters: {
          type: 'object',
          properties: {},
        },
        execute: async (args, state: AgentState) => {
          const userId = state.userId || DEFAULT_USER_ID;

          const weeklyPlan = await recommendationService.generateWeeklyPlan(userId);

          // Format for presentation
          const dailyPlans = weeklyPlan.dailyPlans.map(day => ({
            date: day.date.toISOString().split('T')[0],
            dayOfWeek: day.dayOfWeek,
            problemCount: day.problems.length,
            patterns: day.patterns.map(id => state.patternMap?.get(id)?.name || id),
            estimatedTime: `${day.estimatedTime} minutes`,
            focusArea: day.focusArea,
            motivationalMessage: day.motivationalMessage,
          }));

          return {
            success: true,
            weekStart: weeklyPlan.weekStartDate.toISOString().split('T')[0],
            totalTime: `${weeklyPlan.totalEstimatedTime} minutes`,
            focusPatterns: weeklyPlan.focusPatterns.map(id =>
              state.patternMap?.get(id)?.name || id
            ),
            reviewPatterns: weeklyPlan.reviewPatterns.map(id =>
              state.patternMap?.get(id)?.name || id
            ),
            goals: weeklyPlan.goals,
            dailyPlans,
            message: 'Weekly plan generated with balanced focus and review',
          };
        },
      },

      {
        name: 'explain_recommendation',
        description: 'Explain why a particular problem or pattern is being recommended.',
        parameters: {
          type: 'object',
          properties: {
            recommendationType: {
              type: 'string',
              enum: ['problem', 'pattern', 'difficulty'],
              description: 'What aspect of recommendation to explain',
            },
          },
          required: ['recommendationType'],
        },
        execute: async (args, state: AgentState) => {
          const userId = state.userId || DEFAULT_USER_ID;

          // Get current recommendation
          const recommendation = await recommendationService.getNextProblem(userId);
          if (!recommendation) {
            return { message: 'No active recommendation to explain' };
          }

          let explanation = '';

          switch (args.recommendationType) {
            case 'problem':
              explanation = `This problem is recommended because:\n
1. **Type**: It's a ${recommendation.type} problem - ${
                recommendation.type === 'new'
                  ? 'introducing you to new concepts'
                  : recommendation.type === 'review'
                  ? 'reinforcing previous learning through spaced repetition'
                  : 'challenging you to grow your skills'
              }
2. **Pattern**: Focuses on the ${state.patternMap?.get(recommendation.patternId)?.name || 'current'} pattern
3. **Difficulty**: ${recommendation.estimatedDifficulty} difficulty matches your current mastery level
4. **Timing**: ${recommendation.reason}`;
              break;

            case 'pattern':
              explanation = `This pattern is recommended because:
- It aligns with your learning journey
- Balances 70% new learning with 30% review (interleaving)
- Follows spaced repetition schedule
- Builds on patterns you've already learned`;
              break;

            case 'difficulty':
              explanation = `This difficulty level is chosen because:
- It's in your "zone of proximal development" - challenging but achievable
- Too easy would be boring, too hard would be frustrating
- Adapts based on your recent performance
- Estimated solve time: ${recommendation.estimatedTime} minutes`;
              break;
          }

          return {
            success: true,
            explanation,
            message: 'Recommendation explained',
          };
        },
      },

      {
        name: 'adjust_difficulty_preference',
        description: 'Adjust the difficulty preference for future recommendations based on student feedback.',
        parameters: {
          type: 'object',
          properties: {
            adjustment: {
              type: 'string',
              enum: ['easier', 'harder', 'just_right'],
              description: 'How to adjust difficulty',
            },
            reason: {
              type: 'string',
              description: 'Why the adjustment is needed',
            },
          },
          required: ['adjustment'],
        },
        execute: async (args, state: AgentState) => {
          const userId = state.userId || DEFAULT_USER_ID;

          // Update student preferences
          const { studentModelService } = await import('../../services/student-model.service');

          let newPreference: 'easy' | 'comfortable' | 'challenging';
          switch (args.adjustment) {
            case 'easier':
              newPreference = 'easy';
              break;
            case 'harder':
              newPreference = 'challenging';
              break;
            default:
              newPreference = 'comfortable';
          }

          await studentModelService.updatePreferences(userId, {
            difficultyPreference: newPreference,
          });

          return {
            success: true,
            newPreference,
            message: `Difficulty preference updated to "${newPreference}". Future recommendations will adjust accordingly.`,
          };
        },
      },
    ];
  }

  initializeState(state: AgentState): void {
    state.recommendations = [];
  }
}
