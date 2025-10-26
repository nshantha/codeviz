import OpenAI from 'openai';
import { AIServiceFactory } from './index';

export interface PatternRecognitionResult {
  primaryPattern: string;
  secondaryPatterns: string[];
  confidence: number;
  reasoning: string;
}

/**
 * Pattern Recognition Service
 * Uses GPT-5 to identify which algorithmic pattern(s) apply to a problem
 */
export class PatternRecognitionService {
  private client: OpenAI;
  private config: ReturnType<AIServiceFactory['getDefaultModelConfig']>;

  constructor(factory: AIServiceFactory) {
    this.client = factory.getClient();
    this.config = factory.getDefaultModelConfig();
  }

  /**
   * Identify which pattern(s) apply to a problem description
   */
  async identifyPattern(problemDescription: string): Promise<PatternRecognitionResult> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at identifying algorithmic patterns in coding problems. You analyze problem descriptions and identify which algorithmic patterns apply.'
          },
          {
            role: 'user',
            content: this.buildPrompt(problemDescription)
          }
        ],
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      return this.parseResponse(content);
    } catch (error) {
      console.error('Pattern recognition error:', error);
      // Return fallback response
      return {
        primaryPattern: 'Unknown',
        secondaryPatterns: [],
        confidence: 0.5,
        reasoning: 'Unable to identify pattern automatically'
      };
    }
  }

  private buildPrompt(problemDescription: string): string {
    return `Analyze this coding problem and identify which algorithmic pattern(s) apply.

Problem:
${problemDescription}

Available Patterns:
**Coding Patterns:**
1. Two Pointers
2. Sliding Window
3. Binary Search
4. Tree BFS (Breadth-First Search)
5. Tree DFS (Depth-First Search)
6. Fast & Slow Pointers
7. Merge Intervals
8. Topological Sort
9. Cyclic Sort
10. Dynamic Programming
11. Backtracking
12. Union Find

Return ONLY a valid JSON response with this exact structure:
{
  "primaryPattern": "pattern name",
  "secondaryPatterns": ["pattern name"],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;
  }

  private parseResponse(text: string): PatternRecognitionResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          primaryPattern: parsed.primaryPattern || 'Unknown',
          secondaryPatterns: parsed.secondaryPatterns || [],
          confidence: parsed.confidence || 0.5,
          reasoning: parsed.reasoning || text
        };
      }

      // Fallback if JSON not found
      return {
        primaryPattern: 'Unknown',
        secondaryPatterns: [],
        confidence: 0.5,
        reasoning: text
      };
    } catch (error) {
      // Fallback parsing
      return {
        primaryPattern: 'Unknown',
        secondaryPatterns: [],
        confidence: 0.5,
        reasoning: text
      };
    }
  }
}
