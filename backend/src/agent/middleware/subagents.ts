/**
 * SubAgent Middleware
 * Provides task delegation capability via `task` tool
 * Direct translation from DeepAgents subagents.py
 */

import { AgentMiddleware, AgentState, Tool, SubAgent, CompiledSubAgent } from '../types';
import { createDeepAgent } from '../factory';

const TASK_TOOL_DESCRIPTION = `Launch an ephemeral subagent to handle complex, multi-step independent tasks with isolated context windows.

Available agent types and the tools they have access to:
{available_agents}

When using the Task tool, you must specify a subagent_type parameter to select which agent type to use.

## Usage notes:
1. Launch multiple agents concurrently whenever possible, to maximize performance; to do that, use a single message with multiple tool uses
2. When the agent is done, it will return a single message back to you. The result returned by the agent is not visible to the user. To show the user the result, you should send a text message back to the user with a concise summary of the result.
3. Each agent invocation is stateless. You will not be able to send additional messages to the agent, nor will the agent be able to communicate with you outside of its final report. Therefore, your prompt should contain a highly detailed task description for the agent to perform autonomously and you should specify exactly what information the agent should return back to you in its final and only message to you.
4. The agent's outputs should generally be trusted
5. Clearly tell the agent whether you expect it to create content, perform analysis, or just do research, since it is not aware of the user's intent
6. If the agent description mentions that it should be used proactively, then you should try your best to use it without the user having to ask for it first. Use your judgement.

### Example usage:

<example>
User: "I want to practice the Two Pointers pattern and also learn about Sliding Window."
Assistant: *Uses the task tool in parallel to create separate learning sessions for each pattern*
Assistant: *Synthesizes the results and responds to the User*
<commentary>
Each pattern requires focused practice with specific problems and hints.
The assistant uses the task tool to create isolated learning contexts.
Each subagent can deeply explore one pattern without context contamination.
</commentary>
</example>`;

export interface SubAgentMiddlewareConfig {
  subagents?: (SubAgent | CompiledSubAgent)[];
  defaultMiddleware?: AgentMiddleware[];
  enableGeneralPurpose?: boolean;
}

export class SubAgentMiddleware implements AgentMiddleware {
  name = 'SubAgentMiddleware';
  private subagents: Map<string, CompiledSubAgent> = new Map();
  private defaultMiddleware: AgentMiddleware[];

  constructor(config: SubAgentMiddlewareConfig = {}) {
    this.defaultMiddleware = config.defaultMiddleware || [];

    // Compile subagents
    const subagents = config.subagents || [];
    subagents.forEach(subagent => {
      if ('runnable' in subagent) {
        // Pre-compiled
        this.subagents.set(subagent.name, subagent);
      } else {
        // Need to compile
        const executor = createDeepAgent({
          model: subagent.model,
          systemPrompt: subagent.systemPrompt,
          tools: subagent.tools,
          middleware: [...this.defaultMiddleware, ...(subagent.middleware || [])],
        });

        this.subagents.set(subagent.name, {
          name: subagent.name,
          description: subagent.description,
          executor,
        });
      }
    });

    // Add general-purpose agent if enabled
    if (config.enableGeneralPurpose) {
      const generalPurposeAgent = createDeepAgent({
        systemPrompt: 'You are a general-purpose assistant. Complete the task described by the user.',
        middleware: this.defaultMiddleware,
      });

      this.subagents.set('general-purpose', {
        name: 'general-purpose',
        description: 'General-purpose agent for any task',
        executor: generalPurposeAgent,
      });
    }
  }

  getTools(): Tool[] {
    // Build available agents description
    const availableAgents = Array.from(this.subagents.values())
      .map(sa => `- **${sa.name}**: ${sa.description}`)
      .join('\n');

    const description = TASK_TOOL_DESCRIPTION.replace('{available_agents}', availableAgents);

    return [
      {
        name: 'task',
        description,
        parameters: {
          type: 'object',
          properties: {
            subagent_type: {
              type: 'string',
              description: 'Which subagent to use',
              enum: Array.from(this.subagents.keys()),
            },
            prompt: {
              type: 'string',
              description: 'Detailed task description for the subagent',
            },
          },
          required: ['subagent_type', 'prompt'],
        },
        execute: async (args: { subagent_type: string; prompt: string }, state: AgentState) => {
          const subagent = this.subagents.get(args.subagent_type);

          if (!subagent) {
            return {
              error: `Subagent not found: ${args.subagent_type}`,
              availableSubagents: Array.from(this.subagents.keys()),
            };
          }

          try {
            // Execute subagent with isolated context
            const result = await subagent.executor.invoke({
              messages: [
                {
                  role: 'user',
                  content: args.prompt,
                },
              ],
            });

            // Extract final assistant message
            const finalMessage = result.messages
              .filter(m => m.role === 'assistant')
              .pop();

            // Track subagent execution in state
            if (!state.subagentExecutions) {
              state.subagentExecutions = [];
            }
            state.subagentExecutions.push({
              subagentType: args.subagent_type,
              prompt: args.prompt,
              result: finalMessage,
              timestamp: new Date().toISOString(),
            });

            return {
              success: true,
              subagentType: args.subagent_type,
              result: typeof finalMessage === 'object' && 'content' in finalMessage
                ? finalMessage.content
                : String(finalMessage),
            };
          } catch (error: any) {
            console.error(`Subagent execution error (${args.subagent_type}):`, error);
            return {
              success: false,
              error: error.message,
              subagentType: args.subagent_type,
            };
          }
        },
      },
    ];
  }

  getSystemPrompt(): string {
    return `You have access to specialized subagents via the 'task' tool.

**When to use subagents:**
- Complex multi-step tasks that need isolation
- Parallel research or analysis
- Tasks requiring focused context
- When you need specialized expertise

**Available subagents:**
${Array.from(this.subagents.values())
  .map(sa => `- ${sa.name}: ${sa.description}`)
  .join('\n')}

Use the task tool to delegate work and get comprehensive results.`;
  }

  initializeState(state: AgentState): void {
    state.subagentExecutions = [];
  }
}
