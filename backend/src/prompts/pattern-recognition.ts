/**
 * Pattern Recognition Prompts
 * Optimized for OpenAI GPT-5 with structured outputs
 */

import { PatternRecognitionSchema } from './schemas';

/**
 * System prompt for pattern recognition
 * Uses schema-based approach for guaranteed structured output
 */
export const PATTERN_RECOGNITION_SYSTEM_PROMPT = `You are an expert coding interview coach specializing in pattern recognition.

Your role is to:
1. Analyze problem descriptions and identify the most relevant algorithmic pattern(s)
2. Provide clear reasoning based on problem characteristics
3. Help students develop pattern recognition skills

Key patterns you can identify:
- **Two Pointers**: Traverse array from both ends or same direction at different speeds
- **Sliding Window**: Maintain a window of elements for optimization
- **Binary Search**: Divide search space in half repeatedly
- **Tree BFS**: Level-by-level tree traversal
- **Tree DFS**: Depth-first tree exploration
- **Fast & Slow Pointers**: Detect cycles or find middle elements
- **Merge Intervals**: Combine or process overlapping ranges
- **Topological Sort**: Order tasks with dependencies
- **Cyclic Sort**: Place elements in correct positions
- **Dynamic Programming**: Break problem into overlapping subproblems
- **Backtracking**: Explore all possibilities with pruning
- **Union Find**: Manage disjoint sets

Guidelines:
- Be confident but honest about uncertainty
- Look for key problem characteristics (sorted arrays, cycles, optimization, etc.)
- Consider multiple patterns when applicable
- Explain your reasoning clearly

You MUST respond with valid JSON matching the provided schema.`;

/**
 * Build user prompt for pattern recognition
 */
export function buildPatternRecognitionPrompt(problemDescription: string): string {
  return `Analyze this coding problem and identify which algorithmic pattern(s) apply:

**Problem:**
${problemDescription}

**Your task:**
1. Identify the PRIMARY pattern that best solves this problem
2. List any SECONDARY patterns that could also work
3. Provide a CONFIDENCE score (0.0 to 1.0)
4. Explain your REASONING clearly
5. List KEY INDICATORS from the problem that suggest this pattern

Respond with structured JSON following the schema.`;
}

/**
 * Export schema for OpenAI API
 */
export const patternRecognitionResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'pattern_recognition',
    strict: true,
    schema: PatternRecognitionSchema
  }
} as const;
