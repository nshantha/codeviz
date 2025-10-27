import OpenAI from 'openai';
import { AIServiceFactory } from './index';
import type { Stream } from 'openai/streaming';
import {
  PATTERN_RECOGNITION_SYSTEM_PROMPT,
  buildPatternRecognitionPrompt,
  patternRecognitionResponseFormat
} from '../../prompts';

export interface PatternRecognitionResult {
  primaryPattern: string;
  secondaryPatterns: string[];
  confidence: number;
  reasoning: string;
  keyIndicators?: string[];
}

/**
 * Pattern Recognition Service
 * Uses OpenAI GPT-5 to identify which algorithmic pattern(s) apply to a problem
 * Updated for 2025 - supports streaming responses
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
   * Non-streaming version with structured output using JSON schema
   */
  async identifyPattern(problemDescription: string): Promise<PatternRecognitionResult> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        max_completion_tokens: 1000,
        // GPT-5 only supports temperature=1 (default)
        messages: [
          {
            role: 'system',
            content: PATTERN_RECOGNITION_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: buildPatternRecognitionPrompt(problemDescription)
          }
        ],
        response_format: patternRecognitionResponseFormat as any
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      // With structured outputs, response is guaranteed to match schema
      const result = JSON.parse(content);
      return result;
    } catch (error) {
      console.error('Pattern recognition error:', error);
      // Return fallback response
      return {
        primaryPattern: 'Unknown',
        secondaryPatterns: [],
        confidence: 0.5,
        reasoning: 'Unable to identify pattern automatically',
        keyIndicators: []
      };
    }
  }

  /**
   * Identify pattern with streaming response (for frontend)
   * Returns an async iterator that yields text chunks
   * Note: Streaming does not support structured outputs, so we use regular prompting
   */
  async identifyPatternStream(problemDescription: string): Promise<Stream<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      max_completion_tokens: 1000,
      // GPT-5 only supports temperature=1 (default)
      stream: true,
      messages: [
        {
          role: 'system',
          content: PATTERN_RECOGNITION_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: buildPatternRecognitionPrompt(problemDescription)
        }
      ],
    });

    return stream;
  }
}
