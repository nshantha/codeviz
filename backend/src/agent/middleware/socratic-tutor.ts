/**
 * Socratic Tutor Middleware
 * Provides adaptive hint generation capability
 * Inspired by DeepAgents tool-based middleware pattern
 */

import { AgentMiddleware, AgentState, Tool } from '../types';
import {
  SOCRATIC_SYSTEM_PROMPT,
  buildSocraticHintPrompt,
  hintResponseFormat,
  HintContext,
} from '../../prompts';
import { getOpenAIClient } from '../factory';

const SOCRATIC_HINT_TOOL_DESCRIPTION = `Generate a Socratic hint to guide the user without giving away the solution.

This tool generates progressive hints using the Socratic method - asking questions that lead the user to discover the solution themselves.

**Hint Levels (1-5):**
1. **Clarifying** - Verify problem understanding
   - "What are the inputs and outputs?"
   - "What constraints matter most?"

2. **Probing** - Guide toward pattern recognition
   - "What pattern have you seen in similar problems?"
   - "How does the sorted array help you?"

3. **Implication** - Explore consequences
   - "What happens if you use this approach?"
   - "How does this affect time complexity?"

4. **Viewpoint** - Consider alternatives
   - "Could there be a more efficient way?"
   - "What if you approached it from the end?"

5. **Consequence** - Address edge cases
   - "What about duplicate values?"
   - "How do you handle empty input?"

**Adaptive Difficulty:**
- If user struggles (success rate < 30%) → easier hints
- If user excels (mastery > 70%, success > 70%) → harder hints

**Returns:**
- hintType: Type of Socratic question
- question: The Socratic question to ask
- guidance: Gentle guidance without spoilers
- nextSteps: Suggested next steps (max 3)
- nextLevel: Recommended next hint level
- shouldRevealSolution: Whether to offer full solution`;

export class SocraticTutorMiddleware implements AgentMiddleware {
  name = 'SocraticTutorMiddleware';

  getTools(): Tool[] {
    return [
      {
        name: 'generate_hint',
        description: SOCRATIC_HINT_TOOL_DESCRIPTION,
        parameters: {
          type: 'object',
          properties: {
            problemId: {
              type: 'string',
              description: 'UUID of the problem',
            },
            problemDescription: {
              type: 'string',
              description: 'The problem description',
            },
            hintLevel: {
              type: 'number',
              description: 'Current hint level (1-5)',
              minimum: 1,
              maximum: 5,
            },
            userCode: {
              type: 'string',
              description: 'User\'s current code (optional)',
            },
            hintsGiven: {
              type: 'array',
              items: { type: 'string' },
              description: 'Previous hints given (optional)',
            },
            currentMastery: {
              type: 'number',
              description: 'User\'s mastery level 0.0-1.0 (optional)',
              minimum: 0,
              maximum: 1,
            },
            successRate: {
              type: 'number',
              description: 'User\'s recent success rate 0.0-1.0 (optional)',
              minimum: 0,
              maximum: 1,
            },
          },
          required: ['problemId', 'problemDescription', 'hintLevel'],
        },
        execute: async (args: HintContext, state: AgentState) => {
          const client = getOpenAIClient();

          try {
            const completion = await client.chat.completions.create({
              model: 'gpt-4o',
              max_completion_tokens: 1500,
              messages: [
                {
                  role: 'system',
                  content: SOCRATIC_SYSTEM_PROMPT,
                },
                {
                  role: 'user',
                  content: buildSocraticHintPrompt(args),
                },
              ],
              response_format: hintResponseFormat as any,
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
              throw new Error('No response from AI');
            }

            const result = JSON.parse(content);

            // Track hints in state
            if (!state.hintsGiven) {
              state.hintsGiven = [];
            }
            state.hintsGiven.push({
              problemId: args.problemId,
              level: args.hintLevel,
              hint: result,
              timestamp: new Date().toISOString(),
            });

            return result;
          } catch (error: any) {
            console.error('Hint generation error:', error);

            // Fallback hint based on level
            const fallbackHints = {
              1: {
                hintType: 'clarifying',
                question: 'Can you explain what the problem is asking for in your own words?',
                guidance: 'Understanding the problem clearly is the first step to solving it.',
                nextSteps: ['Identify inputs and outputs', 'List any constraints', 'Try a simple example'],
                nextLevel: 2,
                shouldRevealSolution: false,
              },
              2: {
                hintType: 'probing',
                question: 'Have you seen similar problems before? What patterns might apply here?',
                guidance: 'Think about common algorithmic patterns you\'ve learned.',
                nextSteps: ['Consider array patterns', 'Think about time complexity', 'Try brute force first'],
                nextLevel: 3,
                shouldRevealSolution: false,
              },
              3: {
                hintType: 'implication',
                question: 'What would be the time and space complexity of your current approach?',
                guidance: 'Consider whether there\'s a more efficient solution.',
                nextSteps: ['Analyze complexity', 'Look for optimization opportunities', 'Consider trade-offs'],
                nextLevel: 4,
                shouldRevealSolution: false,
              },
              4: {
                hintType: 'viewpoint',
                question: 'Could you approach this problem from a different angle?',
                guidance: 'Sometimes looking at the problem differently reveals the solution.',
                nextSteps: ['Try working backwards', 'Consider edge cases', 'Sketch out examples'],
                nextLevel: 5,
                shouldRevealSolution: false,
              },
              5: {
                hintType: 'consequence',
                question: 'Have you considered all edge cases? What about duplicates, empty inputs, or boundary conditions?',
                guidance: 'A complete solution handles all possible inputs correctly.',
                nextSteps: ['Test edge cases', 'Verify solution correctness', 'Optimize if needed'],
                nextLevel: 5,
                shouldRevealSolution: true,
              },
            };

            const level = Math.min(5, Math.max(1, args.hintLevel)) as keyof typeof fallbackHints;
            return {
              ...fallbackHints[level],
              error: error.message,
            };
          }
        },
      },
    ];
  }

  getSystemPrompt(): string {
    return `You are a Socratic tutor helping students learn algorithmic problem-solving.

**Your Role:**
- Guide students to discover solutions themselves
- Use the generate_hint tool to create progressive hints
- Never give away the answer directly
- Build confidence through questioning

**When to use generate_hint:**
- Student asks for help
- Student is stuck on a problem
- Student wants to verify their approach
- Student needs guidance on optimization

**Hint Progression:**
Start with level 1 (clarifying) and increase as the student progresses.
The tool will automatically adapt difficulty based on student mastery.`;
  }

  initializeState(state: AgentState): void {
    state.hintsGiven = [];
  }
}
