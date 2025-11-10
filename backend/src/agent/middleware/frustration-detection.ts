/**
 * Frustration Detection Middleware
 * Monitors student emotional state and intervenes proactively
 */

import { AgentMiddleware, AgentState, Tool, ModelRequest } from '../types';
import { calculateFrustrationScore } from '../../utils/statistics';
import {
  detectFrustrationIndicators,
  detectRepeatedQuestion,
  calculateMessageComplexity,
} from '../../utils/text-analysis';
import { LEARNING_CONSTANTS } from '../../constants';

export class FrustrationDetectionMiddleware implements AgentMiddleware {
  name = 'FrustrationDetectionMiddleware';

  getSystemPrompt(): string {
    return `
You have access to frustration detection tools:

- **detect_frustration**: Analyze signals to detect if student is frustrated
- **offer_intervention**: Proactively offer help when frustration is detected
- **suggest_break**: Suggest a break when student has been working too long
- **simplify_problem**: Offer a simpler version when student is stuck

Monitor for frustration signals:
- Long time on problem (>30 minutes)
- Many attempts without progress
- Repeated same questions
- Short, terse messages
- Phrases like "I don't understand", "This is too hard"

When frustration detected:
- Acknowledge their effort ("This is a tough one!")
- Offer different approaches
- Suggest breaking it down
- Consider offering a simpler version first
- Remind them that struggle is part of learning

IMPORTANT: Intervene BEFORE they give up, not after!
`;
  }

  getTools(): Tool[] {
    return [
      {
        name: 'detect_frustration',
        description: 'Detect if the student is showing signs of frustration. Use this periodically during long sessions.',
        parameters: {
          type: 'object',
          properties: {
            timeOnProblem: {
              type: 'number',
              description: 'Time spent on current problem in minutes',
            },
            attemptCount: {
              type: 'number',
              description: 'Number of solution attempts',
            },
            currentMessage: {
              type: 'string',
              description: 'Student\'s current message',
            },
          },
          required: ['currentMessage'],
        },
        execute: async (args, state: AgentState) => {
          const timeMs = (args.timeOnProblem || 0) * 60 * 1000;
          const attemptCount = args.attemptCount || state.currentAttemptCount || 0;

          // Analyze message for frustration indicators
          const textIndicators = detectFrustrationIndicators(args.currentMessage);

          // Check for repeated questions
          const previousMessages = state.messages
            .filter((m: any) => m.role === 'user')
            .map((m: any) => m.content)
            .slice(-5);

          const repeatedQuestion = detectRepeatedQuestion(
            args.currentMessage,
            previousMessages
          );

          // Analyze message complexity (short messages might indicate frustration)
          const complexity = calculateMessageComplexity(args.currentMessage);

          // Calculate overall frustration score
          const frustrationScore = calculateFrustrationScore({
            timeOnProblem: timeMs,
            attemptCount,
            hintsRequested: state.hintsRequested?.length || 0,
            repeatedQuestions: repeatedQuestion,
            messageLength: [complexity.wordCount],
          });

          // Determine recommendation
          let recommendation: string;
          let message: string;

          if (frustrationScore > 0.7) {
            recommendation = 'suggest_break';
            message = '⚠️ High frustration detected. Consider suggesting a break or switching to a simpler problem.';
          } else if (frustrationScore > 0.5) {
            recommendation = 'offer_hint';
            message = '⚠️ Moderate frustration. Offer a helpful hint or different perspective.';
          } else if (frustrationScore > 0.3) {
            recommendation = 'provide_encouragement';
            message = 'Slight frustration. Provide encouragement and acknowledge difficulty.';
          } else {
            recommendation = 'continue';
            message = '✓ No significant frustration detected. Student is productively struggling.';
          }

          // Track in state
          state.frustrationScore = frustrationScore;
          state.frustrationHistory = state.frustrationHistory || [];
          state.frustrationHistory.push({
            timestamp: new Date(),
            score: frustrationScore,
            recommendation,
          });

          return {
            frustrationScore: Math.round(frustrationScore * 100),
            level: frustrationScore > 0.7 ? 'high' : frustrationScore > 0.5 ? 'medium' : 'low',
            signals: {
              textIndicators: textIndicators.hasFrustrationIndicators,
              repeatedQuestion,
              timeExceeded: timeMs > LEARNING_CONSTANTS.FRUSTRATION_TIME_THRESHOLD,
              manyAttempts: attemptCount > LEARNING_CONSTANTS.FRUSTRATION_ATTEMPT_THRESHOLD,
              shortMessages: complexity.wordCount < 10,
            },
            recommendation,
            message,
          };
        },
      },

      {
        name: 'offer_intervention',
        description: 'Proactively offer help when frustration is detected. Provides supportive, actionable suggestions.',
        parameters: {
          type: 'object',
          properties: {
            frustrationLevel: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Current frustration level',
            },
            problemContext: {
              type: 'string',
              description: 'What problem they\'re working on',
            },
          },
          required: ['frustrationLevel'],
        },
        execute: async (args, state: AgentState) => {
          const interventions = {
            low: {
              message: "You're doing great! This is a challenging problem. Keep going!",
              suggestions: [
                'Try breaking it down into smaller steps',
                'Draw out an example on paper',
                'Think about similar problems you\'ve solved',
              ],
            },
            medium: {
              message: "I notice you've been working on this for a while. That's completely normal for tough problems!",
              suggestions: [
                'Would a hint help at this point?',
                'Should we solve a simpler version first?',
                'Want to discuss your approach so far?',
              ],
            },
            high: {
              message: "This is a tough one! You've put in solid effort. Let's try a different approach.",
              suggestions: [
                'Take a 5-minute break and come back fresh',
                'Try a simpler problem in this pattern first',
                'Let me guide you through this step-by-step',
                'Save this for later and try something else',
              ],
            },
          };

          const intervention = interventions[args.frustrationLevel as keyof typeof interventions];

          // Track intervention
          if (!state.interventionsOffered) {
            state.interventionsOffered = [];
          }
          state.interventionsOffered.push({
            timestamp: new Date(),
            level: args.frustrationLevel,
            offered: true,
          });

          return {
            success: true,
            intervention: {
              message: intervention.message,
              suggestions: intervention.suggestions,
            },
            guidance: 'Deliver this empathetically - acknowledge effort before suggesting change',
          };
        },
      },

      {
        name: 'suggest_break',
        description: 'Suggest the student take a break. Use when they\'ve been working too long or showing high frustration.',
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Why suggesting a break',
            },
            duration: {
              type: 'number',
              description: 'Suggested break duration in minutes',
            },
          },
        },
        execute: async (args, state: AgentState) => {
          const duration = args.duration || 5;

          return {
            success: true,
            suggestion: {
              message: `You've been focused for a while! Taking a ${duration}-minute break can actually help you solve this better.`,
              benefits: [
                'Your brain processes problems subconsciously during breaks',
                'Fresh perspective often leads to breakthroughs',
                'Preventing burnout keeps you motivated long-term',
              ],
              activities: [
                'Take a short walk',
                'Get some water',
                'Stretch or do quick exercise',
                'Just step away from the screen',
              ],
            },
            researchNote: 'Studies show breaks improve problem-solving and reduce errors',
          };
        },
      },

      {
        name: 'simplify_problem',
        description: 'Offer a simpler version of the current problem when student is stuck.',
        parameters: {
          type: 'object',
          properties: {
            currentProblemId: {
              type: 'string',
              description: 'Current problem they\'re stuck on',
            },
            simplificationStrategy: {
              type: 'string',
              enum: ['smaller_input', 'remove_constraints', 'guided_version', 'similar_easier'],
              description: 'How to simplify',
            },
          },
          required: ['simplificationStrategy'],
        },
        execute: async (args, state: AgentState) => {
          const strategies = {
            smaller_input: {
              title: 'Try with smaller input',
              description: 'Solve it for a very small example first (n=2 or n=3)',
              benefit: 'Easier to trace through and understand the pattern',
            },
            remove_constraints: {
              title: 'Ignore some constraints temporarily',
              description: 'Solve a version without the tricky constraints first',
              benefit: 'Build up from simple case to full solution',
            },
            guided_version: {
              title: 'Let me guide you step-by-step',
              description: 'I\'ll break it down and we\'ll solve it together',
              benefit: 'Scaffolded learning - I remove support gradually',
            },
            similar_easier: {
              title: 'Try a similar but easier problem',
              description: 'Practice the same pattern with simpler requirements',
              benefit: 'Build confidence and pattern recognition',
            },
          };

          const strategy = strategies[args.simplificationStrategy as keyof typeof strategies];

          return {
            success: true,
            simplification: {
              strategy: strategy.title,
              description: strategy.description,
              benefit: strategy.benefit,
            },
            message: 'There\'s no shame in simplifying - this is how experts learn too!',
          };
        },
      },

      {
        name: 'celebrate_persistence',
        description: 'Celebrate when student persists through frustration. Positive reinforcement!',
        parameters: {
          type: 'object',
          properties: {
            achievement: {
              type: 'string',
              description: 'What they accomplished',
            },
          },
        },
        execute: async (args, state: AgentState) => {
          return {
            success: true,
            celebration: {
              message: `🎉 ${args.achievement}! You pushed through the frustration - that's real growth!`,
              encouragement: [
                'Persistence is more important than initial ability',
                'Every difficult problem makes you stronger',
                'You\'re building grit - the most important skill',
              ],
            },
          };
        },
      },
    ];
  }

  /**
   * Before model call: Auto-detect frustration from recent messages
   */
  async beforeModelCall(request: ModelRequest, state: AgentState): Promise<ModelRequest> {
    const userMessages = state.messages.filter((m: any) => m.role === 'user');
    if (userMessages.length === 0) return request;

    const lastMessage = userMessages[userMessages.length - 1];
    const lastMessageContent = typeof lastMessage.content === 'string' ? lastMessage.content : '';

    // Quick frustration check
    const indicators = detectFrustrationIndicators(lastMessageContent);

    if (indicators.hasFrustrationIndicators) {
      state.autoDetectedFrustration = true;
      state.frustrationIndicators = indicators.indicators;

      // Add a subtle note in state for agent awareness
      state.contextNote = '[Note: Student may be experiencing frustration - be supportive]';
    }

    return request;
  }

  initializeState(state: AgentState): void {
    state.frustrationHistory = [];
    state.interventionsOffered = [];
    state.frustrationScore = 0;
    state.currentAttemptCount = 0;
  }
}
