/**
 * Visualization Middleware
 * Generates algorithm visualizations dynamically based on patterns
 * Agent can create step-by-step visual explanations
 */

import { AgentMiddleware, AgentState, Tool } from '../types';
import { VISUALIZATION_TOOL_DESCRIPTION, VISUALIZATION_SYSTEM_PROMPT } from '../../prompts/visualization';

export interface VisualizationStep {
  description: string;
  data?: any;
  pointers?: Record<string, number>;
  highlights?: number[];
  annotation?: string;
  complexity?: string;
}

export interface VisualizationSpec {
  type: 'array' | 'tree' | 'graph' | 'matrix' | 'linked-list';
  pattern: string;
  title: string;
  data: any;
  steps: VisualizationStep[];
  config?: {
    pointers?: Array<{ name: string; color: string }>;
    highlightColor?: string;
  };
}

// Tool description and system prompt are imported from prompts/visualization.ts

export class VisualizationMiddleware implements AgentMiddleware {
  name = 'VisualizationMiddleware';

  getTools(): Tool[] {
    return [
      {
        name: 'create_visualization',
        description: VISUALIZATION_TOOL_DESCRIPTION,
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['array', 'tree', 'graph', 'matrix', 'linked-list'],
              description: 'Type of visualization',
            },
            pattern: {
              type: 'string',
              description: 'The algorithmic pattern being visualized',
            },
            title: {
              type: 'string',
              description: 'Title for the visualization',
            },
            data: {
              description: 'The data structure to visualize (array, tree nodes, etc.)',
            },
            steps: {
              type: 'array',
              description: 'Step-by-step execution of the algorithm',
              items: {
                type: 'object',
                properties: {
                  description: {
                    type: 'string',
                    description: 'What happens in this step',
                  },
                  pointers: {
                    type: 'object',
                    description: 'Pointer positions (e.g., {left: 0, right: 5})',
                  },
                  highlights: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Indices to highlight',
                  },
                  annotation: {
                    type: 'string',
                    description: 'Annotation to show (e.g., "Sum: 17 > 9")',
                  },
                  complexity: {
                    type: 'string',
                    description: 'Time/space complexity note (optional)',
                  },
                },
                required: ['description'],
              },
            },
            config: {
              type: 'object',
              description: 'Visualization configuration',
              properties: {
                pointers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      color: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          required: ['type', 'pattern', 'title', 'data', 'steps'],
        },
        execute: async (args: Partial<VisualizationSpec>, state: AgentState) => {
          // Validate visualization spec
          if (!args.type || !args.pattern || !args.data || !args.steps) {
            return {
              success: false,
              error: 'Missing required fields for visualization',
            };
          }

          const spec: VisualizationSpec = {
            type: args.type,
            pattern: args.pattern,
            title: args.title || args.pattern,
            data: args.data,
            steps: args.steps,
            config: args.config || {},
          };

          // Store in state for tracking
          if (!state.visualizations) {
            state.visualizations = [];
          }
          state.visualizations.push({
            spec,
            timestamp: new Date().toISOString(),
          });

          return {
            success: true,
            visualization: spec,
            message: `Created ${spec.type} visualization for ${spec.pattern} with ${spec.steps.length} steps`,
          };
        },
      },
      {
        name: 'create_code_visualization',
        description: 'Create a visualization synchronized with student code execution',
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The student code to visualize',
            },
            language: {
              type: 'string',
              enum: ['javascript', 'typescript', 'python'],
              description: 'Programming language',
            },
            testCase: {
              type: 'object',
              description: 'Test case to execute (input/output)',
            },
            pattern: {
              type: 'string',
              description: 'Pattern being demonstrated',
            },
          },
          required: ['code', 'testCase', 'pattern'],
        },
        execute: async (
          args: { code: string; language?: string; testCase: any; pattern: string },
          state: AgentState
        ) => {
          // For MVP, return a template for code visualization
          // In production, this would execute code in sandbox and generate steps
          return {
            success: true,
            message: 'Code visualization created (mock)',
            visualization: {
              type: 'code-execution',
              code: args.code,
              language: args.language || 'javascript',
              testCase: args.testCase,
              pattern: args.pattern,
              steps: [
                {
                  line: 1,
                  description: 'Function called with input',
                  variables: args.testCase.input,
                },
                // More steps would be generated by actual execution
              ],
            },
          };
        },
      },
    ];
  }

  getSystemPrompt(): string {
    return VISUALIZATION_SYSTEM_PROMPT;
  }

  initializeState(state: AgentState): void {
    state.visualizations = [];
  }
}
