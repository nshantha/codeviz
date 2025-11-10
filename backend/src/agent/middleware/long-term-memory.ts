/**
 * Long-Term Memory Middleware
 * Remembers student history, breakthroughs, misconceptions, and struggles
 */

import { AgentMiddleware, AgentState, Tool, ModelRequest } from '../types';
import { studentModelService } from '../../services/student-model.service';
import { misconceptionDetectorService } from '../../services/misconception-detector.service';
import { detectBreakthrough } from '../../utils/statistics';
import { DEFAULT_USER_ID } from '../../constants';

export class LongTermMemoryMiddleware implements AgentMiddleware {
  name = 'LongTermMemoryMiddleware';

  getSystemPrompt(): string {
    return `
You have access to long-term memory about this student:

- **recall_student_history**: Retrieve past struggles, breakthroughs, and preferences
- **record_breakthrough**: Capture important learning moments when they happen
- **check_for_misconception**: Analyze student explanations for common misconceptions
- **get_active_misconceptions**: See what misconceptions are currently blocking progress

Use this memory to:
- Personalize your teaching based on their history
- Celebrate breakthroughs and remind them of progress
- Gently correct misconceptions when detected
- Avoid repeating approaches that didn't work
- Connect new concepts to things they already understand

You are building a long-term relationship with this student, not just answering one-off questions.
`;
  }

  getTools(): Tool[] {
    return [
      {
        name: 'recall_student_history',
        description: 'Retrieve the student\'s learning history including past struggles, breakthroughs, and preferences. Use this to personalize your response.',
        parameters: {
          type: 'object',
          properties: {
            includeBreakthroughs: {
              type: 'boolean',
              description: 'Include past breakthrough moments',
            },
            includeMisconceptions: {
              type: 'boolean',
              description: 'Include active misconceptions',
            },
            includePreferences: {
              type: 'boolean',
              description: 'Include learning preferences',
            },
          },
        },
        execute: async (args, state: AgentState) => {
          const userId = state.userId || DEFAULT_USER_ID;

          const model = await studentModelService.getStudentModel(userId);

          const history: any = {
            totalSessions: model.history.totalSessionCount,
            currentStreak: model.history.currentStreak,
            longestStreak: model.history.longestStreak,
            overallMastery: model.knowledgeState.overallMastery,
            strengths: model.knowledgeState.strengths,
            weaknesses: model.knowledgeState.weaknesses,
          };

          if (args.includeBreakthroughs) {
            history.recentBreakthroughs = model.history.breakthroughs.slice(0, 3).map(b => ({
              pattern: state.patternMap?.get(b.patternId)?.name || b.patternId,
              insight: b.insight,
              when: b.timestamp.toISOString(),
            }));
          }

          if (args.includeMisconceptions) {
            history.activeMisconceptions = model.history.misconceptions.map(m => ({
              pattern: state.patternMap?.get(m.patternId)?.name || m.patternId,
              description: m.description,
              occurrences: m.occurrenceCount,
            }));
          }

          if (args.includePreferences) {
            history.preferences = {
              explanationStyle: model.learningProfile.preferences.preferredExplanationStyle,
              pace: model.learningProfile.preferences.pacePreference,
              visualizations: model.learningProfile.preferences.visualizationPreference,
            };
          }

          // Store in state for quick access
          state.studentModel = model;

          return {
            ...history,
            message: 'Student history retrieved',
          };
        },
      },

      {
        name: 'record_breakthrough',
        description: 'Record a breakthrough moment when the student has an important insight. Use this when they show significant understanding improvement.',
        parameters: {
          type: 'object',
          properties: {
            patternId: {
              type: 'string',
              description: 'The pattern where the breakthrough occurred',
            },
            insight: {
              type: 'string',
              description: 'What the student realized or understood',
            },
            description: {
              type: 'string',
              description: 'Description of the breakthrough moment',
            },
            masteryBefore: {
              type: 'number',
              description: 'Mastery level before breakthrough (0-1)',
            },
            masteryAfter: {
              type: 'number',
              description: 'Mastery level after breakthrough (0-1)',
            },
          },
          required: ['patternId', 'insight', 'description', 'masteryBefore', 'masteryAfter'],
        },
        execute: async (args, state: AgentState) => {
          const userId = state.userId || DEFAULT_USER_ID;

          const breakthrough = await studentModelService.recordBreakthrough({
            userId,
            patternId: args.patternId,
            problemId: state.currentProblemId,
            description: args.description,
            insight: args.insight,
            masteryBefore: args.masteryBefore,
            masteryAfter: args.masteryAfter,
            timestamp: new Date(),
          });

          // Track in state
          if (!state.breakthroughsRecorded) {
            state.breakthroughsRecorded = [];
          }
          state.breakthroughsRecorded.push(breakthrough);

          return {
            success: true,
            breakthrough: {
              patternName: state.patternMap?.get(args.patternId)?.name || 'Unknown',
              insight: args.insight,
              improvement: `${Math.round((args.masteryAfter - args.masteryBefore) * 100)}%`,
            },
            message: '🎉 Breakthrough moment recorded! This is a key milestone in your learning journey.',
          };
        },
      },

      {
        name: 'check_for_misconception',
        description: 'Analyze student\'s explanation for common misconceptions. Use this when they explain their approach or understanding.',
        parameters: {
          type: 'object',
          properties: {
            studentExplanation: {
              type: 'string',
              description: 'What the student said or explained',
            },
            patternId: {
              type: 'string',
              description: 'The pattern being discussed',
            },
          },
          required: ['studentExplanation', 'patternId'],
        },
        execute: async (args, state: AgentState) => {
          const userId = state.userId || DEFAULT_USER_ID;
          const patternName = state.patternMap?.get(args.patternId)?.name || 'Unknown';

          const detected = await misconceptionDetectorService.analyzeForMisconceptions(
            userId,
            args.studentExplanation,
            patternName,
            args.patternId
          );

          // Track in state
          if (!state.misconceptionsDetected) {
            state.misconceptionsDetected = [];
          }
          state.misconceptionsDetected.push(...detected);

          if (detected.length > 0) {
            return {
              detected: true,
              misconceptions: detected.map(d => ({
                misconception: d.misconception,
                correction: d.correction,
                confidence: d.confidence,
              })),
              message: `Detected ${detected.length} misconception(s) - address these gently with Socratic questions`,
            };
          }

          return {
            detected: false,
            message: 'No misconceptions detected - understanding looks good!',
          };
        },
      },

      {
        name: 'get_active_misconceptions',
        description: 'Get all active misconceptions for the student. Use this to understand what might be blocking their progress.',
        parameters: {
          type: 'object',
          properties: {
            patternId: {
              type: 'string',
              description: 'Optional: filter by specific pattern',
            },
          },
        },
        execute: async (args, state: AgentState) => {
          const userId = state.userId || DEFAULT_USER_ID;

          const misconceptions = await misconceptionDetectorService.getMisconceptions(
            userId,
            args.patternId
          );

          return {
            count: misconceptions.length,
            misconceptions: misconceptions.map(m => ({
              pattern: state.patternMap?.get(m.patternId)?.name || 'Unknown',
              description: m.description,
              correction: m.correction,
              occurrences: m.occurrenceCount,
              firstSeen: m.firstDetected.toISOString(),
              lastSeen: m.lastObserved.toISOString(),
            })),
            message: misconceptions.length > 0
              ? `${misconceptions.length} active misconception(s) to address`
              : 'No active misconceptions - great conceptual understanding!',
          };
        },
      },

      {
        name: 'mark_misconception_resolved',
        description: 'Mark a misconception as resolved when the student demonstrates correct understanding.',
        parameters: {
          type: 'object',
          properties: {
            misconceptionId: {
              type: 'string',
              description: 'The ID of the misconception to resolve',
            },
          },
          required: ['misconceptionId'],
        },
        execute: async (args, state: AgentState) => {
          await misconceptionDetectorService.resolveMisconception(args.misconceptionId);

          return {
            success: true,
            message: '✓ Misconception resolved! The student now has correct understanding.',
          };
        },
      },
    ];
  }

  /**
   * Before model call: inject relevant student history into context
   */
  async beforeModelCall(request: ModelRequest, state: AgentState): Promise<ModelRequest> {
    const userId = state.userId || DEFAULT_USER_ID;

    // If we don't have student model yet, fetch it
    if (!state.studentModel) {
      try {
        state.studentModel = await studentModelService.getStudentModel(userId);
      } catch (error) {
        console.error('Failed to fetch student model:', error);
        return request;
      }
    }

    const model = state.studentModel;

    // Build context message with relevant history
    const contextParts: string[] = [];

    // Add key metrics
    contextParts.push(`Student Progress: ${Math.round(model.knowledgeState.overallMastery * 100)}% overall mastery`);

    if (model.history.currentStreak > 0) {
      contextParts.push(`Current streak: ${model.history.currentStreak} days`);
    }

    // Add recent breakthroughs
    if (model.history.breakthroughs.length > 0) {
      const recent = model.history.breakthroughs[0];
      contextParts.push(
        `Recent breakthrough: "${recent.insight}" (${recent.timestamp.toLocaleDateString()})`
      );
    }

    // Add active misconceptions
    if (model.history.misconceptions.length > 0) {
      contextParts.push(
        `Active misconceptions (${model.history.misconceptions.length}): Be aware and address gently`
      );
    }

    // Add preferences
    const prefs = model.learningProfile.preferences;
    contextParts.push(
      `Learning style: ${prefs.preferredExplanationStyle}, pace: ${prefs.pacePreference}`
    );

    // Inject as system context (prepend to messages if not already present)
    const contextMessage = `[Student Context]\n${contextParts.join('\n')}\n`;

    // Add to state for tools to use
    state.studentContext = contextMessage;

    return request;
  }

  initializeState(state: AgentState): void {
    state.misconceptionsDetected = [];
    state.breakthroughsRecorded = [];
  }
}
