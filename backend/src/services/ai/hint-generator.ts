import OpenAI from 'openai';
import { AIServiceFactory } from './index';
import type { Stream } from 'openai/streaming';
import {
  SOCRATIC_SYSTEM_PROMPT,
  buildSocraticHintPrompt,
  socraticHintResponseFormat,
  adjustHintDifficulty
} from '../../prompts';

export interface HintContext {
  problemId: string;
  problemDescription: string;
  userCode?: string;
  hintLevel: number; // 1-5
  hintsGiven?: string[];
  problemsSolved?: number;
  currentMastery?: number;
  recentAttempts?: number;
  successRate?: number;
}

export interface HintResponse {
  hintType: string;
  question: string;
  guidance: string;
  nextSteps: string[];
  nextLevel: number;
  shouldRevealSolution: boolean;
}

/**
 * Hint Generator Service
 * Provides Socratic-style progressive hints (inspired by DeepAgents' Socratic pattern)
 * Updated for 2025 - supports streaming responses for real-time feedback
 */
export class HintGeneratorService {
  private client: OpenAI;
  private config: ReturnType<AIServiceFactory['getDefaultModelConfig']>;

  constructor(factory: AIServiceFactory) {
    this.client = factory.getClient();
    this.config = factory.getDefaultModelConfig();
  }

  /**
   * Generate progressive Socratic hint with structured output
   * Uses adaptive difficulty based on student performance
   */
  async generateHint(context: HintContext): Promise<HintResponse> {
    try {
      // Adjust hint level based on student performance (if data available)
      let adjustedLevel = context.hintLevel;
      if (context.currentMastery !== undefined && context.recentAttempts !== undefined && context.successRate !== undefined) {
        adjustedLevel = adjustHintDifficulty({
          currentLevel: context.hintLevel,
          studentMastery: context.currentMastery,
          recentAttempts: context.recentAttempts,
          successRate: context.successRate
        });
      }

      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        max_completion_tokens: 500,
        // GPT-5 only supports temperature=1 (default)
        messages: [
          {
            role: 'system',
            content: SOCRATIC_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: buildSocraticHintPrompt({
              problemDescription: context.problemDescription,
              userCode: context.userCode,
              hintLevel: adjustedLevel,
              hintsGiven: context.hintsGiven || [],
              problemsSolved: context.problemsSolved || 0,
              currentMastery: context.currentMastery || 0.5
            })
          }
        ],
        response_format: socraticHintResponseFormat as any
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      // Parse structured response
      const result = JSON.parse(content);

      return {
        hintType: result.hintType,
        question: result.question,
        guidance: result.guidance,
        nextSteps: result.nextSteps,
        nextLevel: Math.min(adjustedLevel + 1, 5),
        shouldRevealSolution: adjustedLevel >= 4
      };
    } catch (error) {
      console.error('Hint generation error:', error);
      // Return fallback hint
      return {
        hintType: 'clarifying',
        question: 'What are the key constraints of this problem?',
        guidance: 'Think about the problem constraints and what data structure might help.',
        nextSteps: ['Review the problem statement', 'Identify input/output format', 'Consider edge cases'],
        nextLevel: context.hintLevel + 1,
        shouldRevealSolution: false
      };
    }
  }

  /**
   * Generate hint with streaming response (for frontend real-time display)
   * Returns an async iterator that yields text chunks as they arrive
   * Note: Streaming does not support structured outputs, returns plain text
   */
  async generateHintStream(context: HintContext): Promise<Stream<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    // Adjust hint level based on student performance (if data available)
    let adjustedLevel = context.hintLevel;
    if (context.currentMastery !== undefined && context.recentAttempts !== undefined && context.successRate !== undefined) {
      adjustedLevel = adjustHintDifficulty({
        currentLevel: context.hintLevel,
        studentMastery: context.currentMastery,
        recentAttempts: context.recentAttempts,
        successRate: context.successRate
      });
    }

    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      max_completion_tokens: 500,
      // GPT-5 only supports temperature=1 (default)
      stream: true,
      messages: [
        {
          role: 'system',
          content: SOCRATIC_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: buildSocraticHintPrompt({
            problemDescription: context.problemDescription,
            userCode: context.userCode,
            hintLevel: adjustedLevel,
            hintsGiven: context.hintsGiven || [],
            problemsSolved: context.problemsSolved || 0,
            currentMastery: context.currentMastery || 0.5
          })
        }
      ],
    });

    return stream;
  }
}
