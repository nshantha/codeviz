/**
 * Agent Factory - create_deep_agent equivalent
 * Creates configured agents with middleware composition
 * Direct translation from DeepAgents graph.py
 */

import OpenAI from 'openai';
import { AgentConfig, AgentExecutor as IAgentExecutor, AgentMiddleware, Tool } from './types';
import { AgentExecutor } from './executor';
import { openaiConfig } from '../config';

const BASE_AGENT_PROMPT =
  'In order to complete the objective that the user asks of you, you have access to a number of standard tools.';

/**
 * Get default model configuration
 * Equivalent to get_default_model() in DeepAgents
 */
export function getDefaultModel(): string {
  return openaiConfig.model;
}

/**
 * Get OpenAI client singleton
 */
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: openaiConfig.apiKey,
    });
  }
  return openaiClient;
}

/**
 * Create a deep agent with middleware composition
 * Equivalent to create_deep_agent() in DeepAgents graph.py
 *
 * @param config - Agent configuration
 * @returns AgentExecutor that can invoke/stream
 */
export function createDeepAgent(config: AgentConfig = {}): IAgentExecutor {
  const client = getOpenAIClient();

  // 1. Set defaults
  const model = config.model || getDefaultModel();
  const tools = config.tools || [];
  const userSystemPrompt = config.systemPrompt || '';
  const userMiddleware = config.middleware || [];
  const subagents = config.subagents || [];
  const maxTokens = config.maxTokens || openaiConfig.maxTokens;
  const temperature = config.temperature || 1.0; // GPT-5 default
  const debug = config.debug || false;

  // 2. Build default middleware stack (DeepAgents pattern)
  // Equivalent to deepagent_middleware in graph.py:96-128
  const defaultMiddleware: AgentMiddleware[] = [
    // TodoListMiddleware - planning capability
    // FilesystemMiddleware - context storage
    // SubAgentMiddleware - delegation
    // SummarizationMiddleware - context management
    // PatchToolCallsMiddleware - message integrity
  ];

  // Note: For now, we'll implement domain-specific middleware
  // rather than generic filesystem/todo middleware
  // This is more appropriate for the AlgoMentor use case

  // 3. Combine middleware: default + user
  const allMiddleware = [...defaultMiddleware, ...userMiddleware];

  // 4. Build system prompt
  const systemPrompt = userSystemPrompt
    ? `${userSystemPrompt}\n\n${BASE_AGENT_PROMPT}`
    : BASE_AGENT_PROMPT;

  // 5. Create executor
  const executor = new AgentExecutor(client, {
    model,
    systemPrompt,
    tools,
    middleware: allMiddleware,
    maxTokens,
    temperature,
    debug,
  });

  return executor;
}

/**
 * AI Service Factory - singleton for creating agents
 * This replaces the old AIServiceFactory with a true factory pattern
 */
export class AIServiceFactory {
  private static instance: AIServiceFactory | null = null;
  private client: OpenAI;

  private constructor() {
    this.client = getOpenAIClient();
  }

  static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    return AIServiceFactory.instance;
  }

  /**
   * Create an agent with specific configuration
   */
  createAgent(config: AgentConfig): IAgentExecutor {
    return createDeepAgent(config);
  }

  /**
   * Get the underlying OpenAI client for direct API calls
   * (for cases where agent loop is not needed)
   */
  getClient(): OpenAI {
    return this.client;
  }

  /**
   * Get default model config
   */
  getDefaultModelConfig() {
    return {
      model: openaiConfig.model,
      maxTokens: openaiConfig.maxTokens,
      temperature: 1.0, // GPT-5 default
    };
  }
}

/**
 * Get the singleton factory instance
 */
export function getAIServiceFactory(): AIServiceFactory {
  return AIServiceFactory.getInstance();
}
