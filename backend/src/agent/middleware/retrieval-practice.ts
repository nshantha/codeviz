/**
 * Retrieval Practice Middleware
 * Forces active recall before providing answers - enhances learning
 */

import { AgentMiddleware, AgentState, Tool } from '../types';
import { assessSelfExplanation } from '../../utils/text-analysis';
import { PROBLEM_SOLVING_FRAMEWORKS } from '../../constants';

export class RetrievalPracticeMiddleware implements AgentMiddleware {
  name = 'RetrievalPracticeMiddleware';

  getSystemPrompt(): string {
    return `
You have access to retrieval practice tools:

- **prompt_self_explanation**: Ask student to explain their thinking BEFORE giving hints
- **test_pattern_recall**: Test if student can recall pattern concepts without prompting
- **assess_explanation_quality**: Evaluate how well student explained their approach
- **teach_problem_solving_framework**: Teach meta-strategies like Polya's method

Use retrieval practice strategically:
- Before revealing hints, ask student to explain their current approach
- Test recall of patterns they've learned before
- Make them articulate thinking - this strengthens learning
- Don't spoon-feed answers - guided discovery is more effective

Research shows: Retrieval practice (testing) is more effective than re-studying!
`;
  }

  getTools(): Tool[] {
    return [
      {
        name: 'prompt_self_explanation',
        description: 'Ask the student to explain their thinking or approach before giving hints. This retrieval practice strengthens learning.',
        parameters: {
          type: 'object',
          properties: {
            promptType: {
              type: 'string',
              enum: ['approach', 'pattern', 'complexity', 'edge_cases', 'why_works'],
              description: 'What aspect to ask about',
            },
            context: {
              type: 'string',
              description: 'Current problem or situation context',
            },
          },
          required: ['promptType'],
        },
        execute: async (args, state: AgentState) => {
          const prompts = {
            approach: {
              question: 'Before I give you a hint, can you explain your current approach to solving this problem? Walk me through your thinking.',
              expectedElements: ['algorithm', 'data_structure', 'time_complexity'],
              benefit: 'Articulating your approach helps you spot gaps in your logic',
            },
            pattern: {
              question: 'What pattern do you think this problem uses? Why do you think that?',
              expectedElements: ['pattern_name', 'characteristics', 'reasoning'],
              benefit: 'Practicing pattern recognition helps you identify it faster in interviews',
            },
            complexity: {
              question: 'What do you think the time and space complexity of your solution is? Can you explain why?',
              expectedElements: ['time_complexity', 'space_complexity', 'reasoning'],
              benefit: 'Understanding complexity helps you evaluate trade-offs',
            },
            edge_cases: {
              question: 'What edge cases should you consider for this problem? List them.',
              expectedElements: ['empty_input', 'single_element', 'duplicates', 'negatives'],
              benefit: 'Thinking through edge cases prevents bugs',
            },
            why_works: {
              question: 'Can you explain why your solution works? What is the key insight?',
              expectedElements: ['key_insight', 'correctness_reasoning'],
              benefit: 'Understanding WHY builds deeper knowledge than just knowing HOW',
            },
          };

          const prompt = prompts[args.promptType as keyof typeof prompts];

          // Track in state
          if (!state.retrievalPrompts) {
            state.retrievalPrompts = [];
          }
          state.retrievalPrompts.push({
            type: args.promptType,
            question: prompt.question,
            timestamp: new Date(),
          });

          return {
            success: true,
            prompt: prompt.question,
            expectedElements: prompt.expectedElements,
            benefit: prompt.benefit,
            message: 'Prompt student for self-explanation before giving answer',
          };
        },
      },

      {
        name: 'assess_explanation_quality',
        description: 'Assess the quality of student\'s self-explanation. Use this after they respond to a retrieval prompt.',
        parameters: {
          type: 'object',
          properties: {
            studentExplanation: {
              type: 'string',
              description: 'What the student explained',
            },
            expectedElements: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key elements that should be present',
            },
          },
          required: ['studentExplanation', 'expectedElements'],
        },
        execute: async (args, state: AgentState) => {
          const assessment = assessSelfExplanation(
            args.studentExplanation,
            args.expectedElements
          );

          let feedback = '';
          if (assessment.qualityScore >= 0.8) {
            feedback = '✓ Excellent explanation! You understand this well.';
          } else if (assessment.qualityScore >= 0.5) {
            feedback = `Good start! You covered: ${assessment.presentElements.join(', ')}. Consider also: ${assessment.missingElements.join(', ')}.`;
          } else {
            feedback = `Your explanation could be more complete. Focus on: ${assessment.missingElements.join(', ')}.`;
          }

          return {
            success: true,
            qualityScore: Math.round(assessment.qualityScore * 100),
            presentElements: assessment.presentElements,
            missingElements: assessment.missingElements,
            feedback,
            shouldProvideHint: assessment.qualityScore < 0.6,
          };
        },
      },

      {
        name: 'test_pattern_recall',
        description: 'Test if student can recall key concepts about a pattern without prompting.',
        parameters: {
          type: 'object',
          properties: {
            patternId: {
              type: 'string',
              description: 'Pattern to test recall on',
            },
            questionType: {
              type: 'string',
              enum: ['definition', 'use_case', 'complexity', 'template'],
              description: 'What aspect to test',
            },
          },
          required: ['patternId', 'questionType'],
        },
        execute: async (args, state: AgentState) => {
          const patternName = state.patternMap?.get(args.patternId)?.name || 'this pattern';

          const questions = {
            definition: {
              question: `Without looking it up, can you explain what the ${patternName} pattern is?`,
              hint: 'Think about the key characteristics and how it works.',
            },
            use_case: {
              question: `When would you use the ${patternName} pattern? What types of problems is it good for?`,
              hint: 'Think about problem characteristics that make this pattern applicable.',
            },
            complexity: {
              question: `What is the typical time and space complexity when using ${patternName}?`,
              hint: 'Consider both the best and worst cases.',
            },
            template: {
              question: `Can you write pseudocode for the basic ${patternName} template?`,
              hint: 'Just the skeleton - the key steps and structure.',
            },
          };

          const test = questions[args.questionType as keyof typeof questions];

          return {
            success: true,
            pattern: patternName,
            question: test.question,
            hint: test.hint,
            message: 'Testing pattern recall - retrieval strengthens memory',
          };
        },
      },

      {
        name: 'teach_problem_solving_framework',
        description: 'Teach a systematic problem-solving framework (like Polya\'s method or UMPIRE).',
        parameters: {
          type: 'object',
          properties: {
            framework: {
              type: 'string',
              enum: ['POLYA', 'UMPIRE'],
              description: 'Which framework to teach',
            },
          },
          required: ['framework'],
        },
        execute: async (args, state: AgentState) => {
          const framework = PROBLEM_SOLVING_FRAMEWORKS[args.framework];

          return {
            success: true,
            framework: {
              name: framework.name,
              steps: framework.steps,
            },
            message: `Teaching ${framework.name} - a systematic approach to solving any problem`,
            guidance: 'Use this framework consistently to build problem-solving skills',
          };
        },
      },

      {
        name: 'verify_understanding',
        description: 'Quick verification check after explaining a concept. Forces student to paraphrase.',
        parameters: {
          type: 'object',
          properties: {
            conceptExplained: {
              type: 'string',
              description: 'What concept was just explained',
            },
          },
          required: ['conceptExplained'],
        },
        execute: async (args, state: AgentState) => {
          return {
            success: true,
            verificationQuestion: `Can you explain ${args.conceptExplained} back to me in your own words?`,
            purpose: 'Paraphrasing ensures understanding - if you can explain it, you get it!',
            message: 'Verification check requested',
          };
        },
      },
    ];
  }

  initializeState(state: AgentState): void {
    state.retrievalPrompts = [];
    state.explanationAssessments = [];
  }
}
