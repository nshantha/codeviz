import OpenAI from 'openai';
import { openaiConfig } from '../../config';

export interface AIServiceConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * AI Service Factory (inspired by DeepAgents' create_deep_agent)
 * Creates configured AI services with shared OpenAI client
 */
export class AIServiceFactory {
  private client: OpenAI;
  private config: Required<AIServiceConfig>;

  constructor(config: AIServiceConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gpt-5',
      maxTokens: config.maxTokens || 4000,
      temperature: config.temperature || 0.7,
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
    });
  }

  /**
   * Get default model configuration (like DeepAgents get_default_model)
   */
  getDefaultModelConfig() {
    return {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };
  }

  /**
   * Get the OpenAI client instance
   */
  getClient(): OpenAI {
    return this.client;
  }

  /**
   * Get model config
   */
  getConfig(): Required<AIServiceConfig> {
    return this.config;
  }
}

// Singleton instance (like DeepAgents default model)
let aiServiceFactory: AIServiceFactory | null = null;

/**
 * Get AI Service Factory singleton
 */
export function getAIServiceFactory(): AIServiceFactory {
  if (!aiServiceFactory) {
    aiServiceFactory = new AIServiceFactory({
      apiKey: openaiConfig.apiKey,
      model: openaiConfig.model,
      maxTokens: openaiConfig.maxTokens,
      temperature: openaiConfig.temperature,
    });
  }
  return aiServiceFactory;
}
