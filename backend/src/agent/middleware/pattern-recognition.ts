/**
 * Pattern Recognition Middleware
 * Provides pattern identification capability as a tool
 * Inspired by DeepAgents FilesystemMiddleware pattern
 */

import { AgentMiddleware, AgentState, Tool } from '../types';
import {
  PATTERN_RECOGNITION_SYSTEM_PROMPT,
  buildPatternRecognitionPrompt,
  patternRecognitionResponseFormat,
} from '../../prompts';
import { getOpenAIClient } from '../factory';

const PATTERN_RECOGNITION_TOOL_DESCRIPTION = `Identify which algorithmic pattern(s) apply to a coding problem.

This tool analyzes a problem description and identifies the most appropriate algorithmic pattern(s) to solve it.

**When to use:**
- User describes a coding problem
- User asks "what pattern should I use?"
- You need to guide the user toward the right approach

**Patterns available:**
- Two Pointers
- Sliding Window
- Binary Search
- Tree BFS
- Tree DFS
- Fast & Slow Pointers
- Merge Intervals
- Topological Sort
- Cyclic Sort
- Dynamic Programming
- Backtracking
- Union Find

**Returns:**
- Primary pattern (highest confidence)
- Secondary patterns (alternatives)
- Confidence score (0.0 - 1.0)
- Reasoning (why this pattern applies)
- Key indicators (problem characteristics)

**Example:**
Problem: "Find two numbers in a sorted array that sum to a target"
→ Primary Pattern: "Two Pointers" (confidence: 0.95)
→ Key indicators: ["sorted array", "two elements", "target sum"]`;

export class PatternRecognitionMiddleware implements AgentMiddleware {
  name = 'PatternRecognitionMiddleware';

  getTools(): Tool[] {
    return [
      {
        name: 'identify_pattern',
        description: PATTERN_RECOGNITION_TOOL_DESCRIPTION,
        parameters: {
          type: 'object',
          properties: {
            problemDescription: {
              type: 'string',
              description: 'The coding problem description to analyze',
            },
          },
          required: ['problemDescription'],
        },
        execute: async (args: { problemDescription: string }, state: AgentState) => {
          const client = getOpenAIClient();

          try {
            const completion = await client.chat.completions.create({
              model: 'gpt-4o',
              max_completion_tokens: 1000,
              messages: [
                {
                  role: 'system',
                  content: PATTERN_RECOGNITION_SYSTEM_PROMPT,
                },
                {
                  role: 'user',
                  content: buildPatternRecognitionPrompt(args.problemDescription),
                },
              ],
              response_format: patternRecognitionResponseFormat as any,
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
              throw new Error('No response from AI');
            }

            const result = JSON.parse(content);

            // Store in state for tracking
            if (!state.identifiedPatterns) {
              state.identifiedPatterns = [];
            }
            state.identifiedPatterns.push({
              problem: args.problemDescription,
              result,
              timestamp: new Date().toISOString(),
            });

            return result;
          } catch (error: any) {
            console.error('Pattern recognition error:', error);
            return {
              primaryPattern: 'Unknown',
              secondaryPatterns: [],
              confidence: 0.5,
              reasoning: 'Unable to identify pattern automatically',
              keyIndicators: [],
              error: error.message,
            };
          }
        },
      },
    ];
  }

  getSystemPrompt(): string {
    return `You have access to a pattern recognition tool that can identify algorithmic patterns in coding problems.

Use this tool when:
- The user describes a coding problem
- The user asks what approach or pattern to use
- You want to guide the user toward the right solution strategy

The tool will return the most appropriate pattern(s) with confidence scores and reasoning.`;
  }

  initializeState(state: AgentState): void {
    state.identifiedPatterns = [];
  }
}
