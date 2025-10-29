/**
 * Knowledge Tracker Middleware
 * Tracks student mastery using Bayesian Knowledge Tracing
 * Inspired by DeepAgents state management pattern
 */

import { AgentMiddleware, AgentState, Tool } from '../types';
import { getSupabaseClient } from '../../config/supabase';

const KNOWLEDGE_TRACKER_TOOL_DESCRIPTION = `Track student progress and mastery of algorithmic patterns.

This tool manages the student's learning progress using Bayesian Knowledge Tracing.

**Capabilities:**
1. **Update Mastery** - Record problem attempts and update mastery probability
2. **Get Progress** - View overall learning progress
3. **Get Pattern Status** - Check mastery level for specific patterns
4. **Get Recommendations** - Get personalized next problem recommendations

**Mastery States:**
- Locked (< 0.2): Not ready yet
- Introduced (0.2 - 0.5): Learning basics
- Practicing (0.5 - 0.8): Building proficiency
- Mastered (>= 0.8): Ready for interviews

**Bayesian Updates:**
- Solved without hints: +0.2 mastery
- Solved with hints: +0.1 mastery
- Failed attempt: -0.15 mastery
- Capped at [0.0, 1.0]

**Returns:**
Progress data, mastery probabilities, and recommendations.`;

export class KnowledgeTrackerMiddleware implements AgentMiddleware {
  name = 'KnowledgeTrackerMiddleware';

  getTools(): Tool[] {
    return [
      {
        name: 'update_mastery',
        description: 'Update student mastery after a problem attempt',
        parameters: {
          type: 'object',
          properties: {
            patternId: {
              type: 'string',
              description: 'UUID of the pattern',
            },
            problemId: {
              type: 'string',
              description: 'UUID of the problem',
            },
            solved: {
              type: 'boolean',
              description: 'Whether the problem was solved',
            },
            hintsUsed: {
              type: 'number',
              description: 'Number of hints used',
              minimum: 0,
            },
            timeSpent: {
              type: 'number',
              description: 'Time spent in seconds (optional)',
            },
          },
          required: ['patternId', 'problemId', 'solved', 'hintsUsed'],
        },
        execute: async (
          args: {
            patternId: string;
            problemId: string;
            solved: boolean;
            hintsUsed: number;
            timeSpent?: number;
          },
          state: AgentState
        ) => {
          const supabase = getSupabaseClient();

          try {
            // 1. Get current mastery
            const { data: currentState, error: fetchError } = await supabase
              .from('knowledge_state')
              .select('*')
              .eq('pattern_id', args.patternId)
              .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
              throw fetchError;
            }

            // 2. Calculate new mastery (Bayesian update)
            let currentMastery = currentState?.mastery_probability || 0.5;
            let newMastery = currentMastery;

            if (args.solved && args.hintsUsed === 0) {
              newMastery += 0.2; // Strong evidence of mastery
            } else if (args.solved && args.hintsUsed > 0) {
              newMastery += 0.1; // Weak evidence
            } else {
              newMastery -= 0.15; // Evidence of forgetting
            }

            // Cap at [0, 1]
            newMastery = Math.max(0, Math.min(1, newMastery));

            // 3. Determine status
            let status = 'Locked';
            if (newMastery >= 0.8) status = 'Mastered';
            else if (newMastery >= 0.5) status = 'Practicing';
            else if (newMastery >= 0.2) status = 'Introduced';

            // 4. Update database
            const { data: updated, error: updateError } = await supabase
              .from('knowledge_state')
              .upsert({
                pattern_id: args.patternId,
                mastery_probability: newMastery,
                status,
                problems_attempted: (currentState?.problems_attempted || 0) + 1,
                problems_solved: (currentState?.problems_solved || 0) + (args.solved ? 1 : 0),
                last_practiced: new Date().toISOString(),
              })
              .select()
              .single();

            if (updateError) throw updateError;

            // 5. Track in state
            if (!state.knowledgeUpdates) {
              state.knowledgeUpdates = [];
            }
            state.knowledgeUpdates.push({
              patternId: args.patternId,
              problemId: args.problemId,
              oldMastery: currentMastery,
              newMastery,
              status,
              timestamp: new Date().toISOString(),
            });

            return {
              success: true,
              patternId: args.patternId,
              oldMastery: currentMastery,
              newMastery,
              status,
              change: newMastery - currentMastery,
            };
          } catch (error: any) {
            console.error('Knowledge update error:', error);
            return {
              success: false,
              error: error.message,
            };
          }
        },
      },
      {
        name: 'get_progress',
        description: 'Get overall student progress and mastery levels',
        parameters: {
          type: 'object',
          properties: {},
        },
        execute: async (_args: any, state: AgentState) => {
          const supabase = getSupabaseClient();

          try {
            const { data: patterns, error } = await supabase
              .from('patterns')
              .select(
                `
                id,
                name,
                type,
                difficulty,
                knowledge_state (
                  mastery_probability,
                  status,
                  problems_attempted,
                  problems_solved,
                  last_practiced
                )
              `
              )
              .eq('type', 'coding')
              .order('difficulty');

            if (error) throw error;

            // Calculate overall stats
            const totalPatterns = patterns?.length || 0;
            const masteredCount = patterns?.filter(p => p.knowledge_state?.[0]?.status === 'Mastered').length || 0;
            const practicingCount =
              patterns?.filter(p => p.knowledge_state?.[0]?.status === 'Practicing').length || 0;
            const avgMastery =
              patterns?.reduce((sum, p) => sum + (p.knowledge_state?.[0]?.mastery_probability || 0), 0) /
                totalPatterns || 0;

            return {
              success: true,
              summary: {
                totalPatterns,
                masteredCount,
                practicingCount,
                averageMastery: avgMastery,
                readinessScore: (masteredCount / totalPatterns) * 100,
              },
              patterns: patterns?.map(p => ({
                id: p.id,
                name: p.name,
                difficulty: p.difficulty,
                mastery: p.knowledge_state?.[0]?.mastery_probability || 0,
                status: p.knowledge_state?.[0]?.status || 'Locked',
                problemsAttempted: p.knowledge_state?.[0]?.problems_attempted || 0,
                problemsSolved: p.knowledge_state?.[0]?.problems_solved || 0,
              })),
            };
          } catch (error: any) {
            console.error('Progress fetch error:', error);
            return {
              success: false,
              error: error.message,
            };
          }
        },
      },
      {
        name: 'get_recommendations',
        description: 'Get personalized problem recommendations based on mastery',
        parameters: {
          type: 'object',
          properties: {
            count: {
              type: 'number',
              description: 'Number of recommendations to return',
              minimum: 1,
              maximum: 10,
              default: 5,
            },
          },
        },
        execute: async (args: { count?: number }, state: AgentState) => {
          const count = args.count || 5;
          const supabase = getSupabaseClient();

          try {
            // Get patterns in "Practicing" state (optimal learning zone)
            const { data: patterns, error } = await supabase
              .from('knowledge_state')
              .select(
                `
                pattern_id,
                mastery_probability,
                status,
                patterns (
                  id,
                  name,
                  difficulty
                )
              `
              )
              .in('status', ['Introduced', 'Practicing'])
              .order('mastery_probability', { ascending: false })
              .limit(count);

            if (error) throw error;

            return {
              success: true,
              recommendations: patterns?.map(p => {
                const patternData = Array.isArray(p.patterns) ? p.patterns[0] : p.patterns;
                return {
                  patternId: p.pattern_id,
                  patternName: patternData?.name,
                  difficulty: patternData?.difficulty,
                  currentMastery: p.mastery_probability,
                  status: p.status,
                  reason:
                    p.status === 'Practicing'
                      ? 'You\'re making good progress on this pattern'
                      : 'This pattern is ready for practice',
                };
              }),
            };
          } catch (error: any) {
            console.error('Recommendations error:', error);
            return {
              success: false,
              error: error.message,
            };
          }
        },
      },
    ];
  }

  getSystemPrompt(): string {
    return `You have access to knowledge tracking tools that monitor student progress.

**Use these tools to:**
- Update mastery after problem attempts (update_mastery)
- Check overall progress (get_progress)
- Recommend next problems (get_recommendations)

**When to use:**
- After a student completes a problem
- When a student asks about their progress
- When recommending next steps
- To personalize difficulty

The system uses Bayesian Knowledge Tracing to adapt to each student's learning pace.`;
  }

  initializeState(state: AgentState): void {
    state.knowledgeUpdates = [];
  }
}
