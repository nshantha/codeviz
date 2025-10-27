/**
 * Agent Executor - Core execution loop
 * Implements the agent reasoning loop with middleware composition
 * Inspired by LangGraph's CompiledStateGraph
 */

import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import {
  AgentState,
  AgentMiddleware,
  Tool,
  ModelRequest,
  ModelResponse,
  ToolCall,
  ToolResult,
  AgentExecutor as IAgentExecutor,
} from './types';

export class AgentExecutor implements IAgentExecutor {
  private client: OpenAI;
  private model: string;
  private systemPrompt: string;
  private tools: Map<string, Tool> = new Map();
  private middleware: AgentMiddleware[] = [];
  private maxTokens: number;
  private temperature: number;
  private debug: boolean;
  private maxIterations: number = 25; // Prevent infinite loops

  constructor(
    client: OpenAI,
    config: {
      model: string;
      systemPrompt: string;
      tools?: Tool[];
      middleware?: AgentMiddleware[];
      maxTokens?: number;
      temperature?: number;
      debug?: boolean;
    }
  ) {
    this.client = client;
    this.model = config.model;
    this.systemPrompt = config.systemPrompt;
    this.maxTokens = config.maxTokens || 4000;
    this.temperature = config.temperature || 1.0;
    this.debug = config.debug || false;

    // Register base tools
    if (config.tools) {
      config.tools.forEach(tool => this.tools.set(tool.name, tool));
    }

    // Register middleware
    if (config.middleware) {
      this.middleware = config.middleware;
    }

    // Collect tools from middleware
    this.middleware.forEach(mw => {
      if (mw.getTools) {
        mw.getTools().forEach(tool => this.tools.set(tool.name, tool));
      }
    });

    this.log('AgentExecutor initialized', {
      model: this.model,
      toolCount: this.tools.size,
      middlewareCount: this.middleware.length,
    });
  }

  /**
   * Main execution method - runs the agent loop
   * Equivalent to graph.invoke() in LangGraph
   */
  async invoke(input: { messages: ChatCompletionMessageParam[] }): Promise<AgentState> {
    const state: AgentState = {
      messages: [...input.messages],
    };

    // Initialize state from middleware
    this.middleware.forEach(mw => {
      if (mw.initializeState) {
        mw.initializeState(state);
      }
    });

    // Prepend system prompt
    const systemMessage: ChatCompletionMessageParam = {
      role: 'system',
      content: this.buildSystemPrompt(),
    };

    state.messages.unshift(systemMessage);

    let iterations = 0;

    // Agent loop - continue until no more tool calls
    while (iterations < this.maxIterations) {
      iterations++;
      this.log(`Iteration ${iterations}/${this.maxIterations}`);

      // 1. Prepare model request
      let modelRequest: ModelRequest = {
        messages: state.messages,
        tools: this.getToolSchemas(),
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      };

      // 2. Run beforeModelCall middleware hooks
      for (const mw of this.middleware) {
        if (mw.beforeModelCall) {
          modelRequest = await mw.beforeModelCall(modelRequest, state);
        }
      }

      // 3. Call the model
      this.log('Calling model...', { messageCount: modelRequest.messages.length });
      const completion = await this.client.chat.completions.create({
        model: modelRequest.model!,
        messages: modelRequest.messages,
        tools: modelRequest.tools,
        temperature: modelRequest.temperature,
        max_completion_tokens: modelRequest.max_tokens,
      });

      const choice = completion.choices[0];
      if (!choice) {
        throw new Error('No response from model');
      }

      // 4. Parse response
      let modelResponse: ModelResponse = {
        message: choice.message,
        finishReason: choice.finish_reason || undefined,
        toolCalls: choice.message.tool_calls?.map(tc => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        })),
      };

      // 5. Run afterModelCall middleware hooks
      for (const mw of this.middleware) {
        if (mw.afterModelCall) {
          modelResponse = await mw.afterModelCall(modelResponse, state);
        }
      }

      // 6. Add assistant message to state
      state.messages.push(modelResponse.message);

      // 7. Check if we're done
      if (!modelResponse.toolCalls || modelResponse.toolCalls.length === 0) {
        this.log('No tool calls - agent finished');
        break;
      }

      // 8. Execute tool calls
      this.log(`Executing ${modelResponse.toolCalls.length} tool calls`);
      const toolResults = await this.executeTools(modelResponse.toolCalls, state);

      // 9. Add tool results to messages
      for (const result of toolResults) {
        const toolMessage: ChatCompletionMessageParam = {
          role: 'tool',
          tool_call_id: result.toolCallId,
          content: result.error || JSON.stringify(result.result),
        };
        state.messages.push(toolMessage);
      }
    }

    if (iterations >= this.maxIterations) {
      this.log('WARNING: Max iterations reached');
    }

    return state;
  }

  /**
   * Execute tool calls with middleware hooks
   */
  private async executeTools(toolCalls: ToolCall[], state: AgentState): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      try {
        // 1. Run beforeToolCall middleware
        let processedToolCall = toolCall;
        for (const mw of this.middleware) {
          if (mw.beforeToolCall) {
            processedToolCall = await mw.beforeToolCall(processedToolCall, state);
          }
        }

        // 2. Execute tool
        const tool = this.tools.get(processedToolCall.name);
        if (!tool) {
          results.push({
            toolCallId: toolCall.id,
            result: null,
            error: `Tool not found: ${processedToolCall.name}`,
          });
          continue;
        }

        this.log(`Executing tool: ${tool.name}`, processedToolCall.arguments);
        const result = await tool.execute(processedToolCall.arguments, state);

        // 3. Create tool result
        let toolResult: ToolResult = {
          toolCallId: toolCall.id,
          result,
        };

        // 4. Run afterToolCall middleware
        for (const mw of this.middleware) {
          if (mw.afterToolCall) {
            toolResult = await mw.afterToolCall(toolResult, state);
          }
        }

        results.push(toolResult);
      } catch (error: any) {
        this.log(`Tool execution error: ${error.message}`);
        results.push({
          toolCallId: toolCall.id,
          result: null,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Build system prompt from base + middleware
   */
  private buildSystemPrompt(): string {
    const parts = [this.systemPrompt];

    this.middleware.forEach(mw => {
      if (mw.getSystemPrompt) {
        parts.push(mw.getSystemPrompt());
      }
    });

    return parts.join('\n\n');
  }

  /**
   * Get OpenAI tool schemas
   */
  private getToolSchemas(): ChatCompletionTool[] {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any) {
    if (this.debug) {
      console.log(`[AgentExecutor] ${message}`, data || '');
    }
  }
}
