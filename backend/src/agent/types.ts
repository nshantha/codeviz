/**
 * Core types for the DeepAgents-inspired architecture
 * Translated from Python DeepAgents to TypeScript
 */

import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * Agent State - message history and shared context
 * Equivalent to Python's AgentState TypedDict
 */
export interface AgentState extends Record<string, any> {
  messages: ChatCompletionMessageParam[];
}

/**
 * Tool definition
 * Equivalent to LangChain's BaseTool
 */
export interface Tool {
  name: string;
  description: string;
  parameters: ChatCompletionTool['function']['parameters'];
  execute: (args: any, state: AgentState) => Promise<any>;
}

/**
 * Model request before calling AI
 */
export interface ModelRequest {
  messages: ChatCompletionMessageParam[];
  tools?: ChatCompletionTool[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  [key: string]: any;
}

/**
 * Model response after calling AI
 */
export interface ModelResponse {
  message: ChatCompletionMessageParam;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: any;
  }>;
  finishReason?: string;
}

/**
 * Tool execution context
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: any;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  toolCallId: string;
  result: any;
  error?: string;
}

/**
 * Agent Middleware - composable capabilities
 * Equivalent to Python's AgentMiddleware
 */
export interface AgentMiddleware {
  name: string;

  /**
   * Hook before model call - can modify request
   */
  beforeModelCall?(request: ModelRequest, state: AgentState): Promise<ModelRequest>;

  /**
   * Hook after model call - can modify response
   */
  afterModelCall?(response: ModelResponse, state: AgentState): Promise<ModelResponse>;

  /**
   * Hook before tool execution
   */
  beforeToolCall?(toolCall: ToolCall, state: AgentState): Promise<ToolCall>;

  /**
   * Hook after tool execution
   */
  afterToolCall?(result: ToolResult, state: AgentState): Promise<ToolResult>;

  /**
   * Provide additional tools
   */
  getTools?(): Tool[];

  /**
   * Extend system prompt
   */
  getSystemPrompt?(): string;

  /**
   * Initialize state keys
   */
  initializeState?(state: AgentState): void;

  /**
   * State reducer - merge state updates
   */
  reduceState?(currentState: any, update: any, key: string): any;
}

/**
 * SubAgent specification
 * Equivalent to Python's SubAgent TypedDict
 */
export interface SubAgent {
  name: string;
  description: string;
  systemPrompt: string;
  tools?: Tool[];
  model?: string;
  middleware?: AgentMiddleware[];
}

/**
 * Compiled SubAgent with executor
 */
export interface CompiledSubAgent {
  name: string;
  description: string;
  executor: AgentExecutor;
}

/**
 * Agent configuration
 * Equivalent to create_deep_agent parameters
 */
export interface AgentConfig {
  model?: string;
  tools?: Tool[];
  systemPrompt?: string;
  middleware?: AgentMiddleware[];
  subagents?: (SubAgent | CompiledSubAgent)[];
  maxTokens?: number;
  temperature?: number;
  debug?: boolean;
}

/**
 * Agent executor - runs the agent loop
 */
export interface AgentExecutor {
  invoke(input: { messages: ChatCompletionMessageParam[]; [key: string]: any }): Promise<AgentState>;
  stream(input: { messages: ChatCompletionMessageParam[]; [key: string]: any }): AsyncIterableIterator<any>;
}

/**
 * State reducer function type
 */
export type StateReducer<T = any> = (current: T, update: T) => T;
