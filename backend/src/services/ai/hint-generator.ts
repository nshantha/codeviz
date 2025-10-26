import OpenAI from 'openai';
import { AIServiceFactory } from './index';

export interface HintContext {
  problemId: string;
  problemDescription: string;
  userCode?: string;
  hintLevel: number; // 1-5
  hintsGiven?: string[];
}

export interface HintResponse {
  hint: string;
  nextLevel: number;
  shouldRevealSolution: boolean;
}

/**
 * Hint Generator Service
 * Provides Socratic-style progressive hints (inspired by DeepAgents' Socratic pattern)
 */
export class HintGeneratorService {
  private client: OpenAI;
  private config: ReturnType<AIServiceFactory['getDefaultModelConfig']>;

  constructor(factory: AIServiceFactory) {
    this.client = factory.getClient();
    this.config = factory.getDefaultModelConfig();
  }

  /**
   * Generate progressive Socratic hint
   */
  async generateHint(context: HintContext): Promise<HintResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        max_tokens: 500,
        temperature: 0.8, // More creative for hints
        messages: [
          {
            role: 'system',
            content: 'You are a patient coding interviewer using the Socratic method. Guide candidates to solutions through questions, never give answers directly.'
          },
          {
            role: 'user',
            content: this.buildHintPrompt(context)
          }
        ],
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      return {
        hint: content.trim(),
        nextLevel: Math.min(context.hintLevel + 1, 5),
        shouldRevealSolution: context.hintLevel >= 4
      };
    } catch (error) {
      console.error('Hint generation error:', error);
      // Return fallback hint
      return {
        hint: 'Think about the problem constraints and what data structure might help.',
        nextLevel: context.hintLevel + 1,
        shouldRevealSolution: false
      };
    }
  }

  private buildHintPrompt(context: HintContext): string {
    const hintLevelGuidance = this.getHintLevelGuidance(context.hintLevel);

    return `You are helping a candidate solve this problem:

Problem: ${context.problemDescription}

${context.userCode ? `User's current code:\n\`\`\`\n${context.userCode}\n\`\`\`` : 'User has not written any code yet.'}

${context.hintsGiven && context.hintsGiven.length > 0 ? `Hints already given:\n${context.hintsGiven.map((h, i) => `${i + 1}. ${h}`).join('\n')}` : 'No hints given yet.'}

Current hint level: ${context.hintLevel}/5
${hintLevelGuidance}

RULES:
1. NEVER give the full solution directly
2. Ask guiding questions (Socratic method)
3. If they're on wrong track, gently redirect
4. Encourage small wins
5. Be concise (1-3 sentences max)

Generate the next hint (1-3 sentences):`;
  }

  private getHintLevelGuidance(level: number): string {
    const guidance: Record<number, string> = {
      1: 'Level 1: Pattern Recognition - Ask what pattern or data structure might apply. Be very subtle.',
      2: 'Level 2: Approach Direction - Guide toward the right approach without being explicit.',
      3: 'Level 3: Algorithm Outline - Describe the high-level algorithm steps.',
      4: 'Level 4: Pseudocode - Provide pseudocode or detailed algorithm structure.',
      5: 'Level 5: Partial Solution - Show key parts of the code (only after multiple attempts).'
    };
    return guidance[level] || guidance[1];
  }
}
