/**
 * Agent Routes - DeepAgents-based conversational tutor
 * Replaces individual AI routes with unified agent system
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  createDeepAgent,
  PatternRecognitionMiddleware,
  SocraticTutorMiddleware,
  KnowledgeTrackerMiddleware,
  SubAgentMiddleware,
} from '../agent';

const router = Router();

/**
 * Request schema for agent interactions
 */
const AgentRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  context: z
    .object({
      problemId: z.string().optional(),
      patternId: z.string().optional(),
      studentId: z.string().optional(),
    })
    .optional(),
});

/**
 * POST /api/agent/chat
 * Main agent endpoint - handles all student interactions
 *
 * This replaces:
 * - POST /api/ai/identify-pattern
 * - POST /api/ai/hint
 * - POST /api/submissions (partially)
 * - POST /api/progress (partially)
 *
 * The agent autonomously uses tools based on user needs.
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    // 1. Validate request
    const validation = AgentRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const { messages, context } = validation.data;

    // 2. Create agent with middleware stack
    const agent = createDeepAgent({
      systemPrompt: `You are an expert coding interview tutor for AlgoMentor.

**Your Role:**
- Help students master algorithmic patterns through Socratic questioning
- Identify patterns in coding problems
- Provide progressive hints without giving away solutions
- Track and encourage progress
- Build confidence through guided discovery

**Student Context:**
${context?.problemId ? `- Current Problem: ${context.problemId}` : ''}
${context?.patternId ? `- Current Pattern: ${context.patternId}` : ''}
${context?.studentId ? `- Student ID: ${context.studentId}` : ''}

**Guidelines:**
- Use tools proactively to help students
- Start with identify_pattern when they describe a problem
- Use generate_hint when they're stuck
- Update mastery after problem attempts
- Show progress when they ask
- Be encouraging and patient`,
      middleware: [
        new PatternRecognitionMiddleware(),
        new SocraticTutorMiddleware(),
        new KnowledgeTrackerMiddleware(),
        new SubAgentMiddleware({
          enableGeneralPurpose: true,
          subagents: [
            {
              name: 'pattern-deep-dive',
              description: 'Deep analysis of a specific algorithmic pattern with examples and practice problems',
              systemPrompt: `You are a pattern analysis expert. When given a pattern name, provide:
1. Detailed explanation of how it works
2. Visual examples
3. Time/space complexity analysis
4. Common problem variations
5. Practice problem recommendations`,
            },
            {
              name: 'code-reviewer',
              description: 'Detailed code review with feedback on correctness, efficiency, and style',
              systemPrompt: `You are a code review expert. Analyze code for:
1. Correctness (does it solve the problem?)
2. Efficiency (optimal time/space complexity?)
3. Code quality (readability, style)
4. Edge cases (are they handled?)
5. Suggestions for improvement`,
            },
          ],
        }),
      ],
      debug: process.env.NODE_ENV === 'development',
    });

    // 3. Invoke agent
    const result = await agent.invoke({ messages });

    // 4. Extract assistant response
    const assistantMessages = result.messages
      .filter(m => m.role === 'assistant')
      .map(m => ({
        role: m.role,
        content: typeof m === 'object' && 'content' in m ? m.content : String(m),
      }));

    // 5. Return response
    res.json({
      success: true,
      messages: assistantMessages,
      metadata: {
        toolsUsed: result.messages.filter(m => m.role === 'tool').length,
        identifiedPatterns: result.identifiedPatterns || [],
        hintsGiven: result.hintsGiven || [],
        knowledgeUpdates: result.knowledgeUpdates || [],
        subagentExecutions: result.subagentExecutions || [],
      },
    });
  } catch (error: any) {
    console.error('Agent error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Agent execution failed',
    });
  }
});

/**
 * POST /api/agent/stream
 * Streaming version of agent chat (future implementation)
 */
router.post('/stream', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: 'Streaming not yet implemented for agent system',
    message: 'Use POST /api/agent/chat for now',
  });
});

export default router;
