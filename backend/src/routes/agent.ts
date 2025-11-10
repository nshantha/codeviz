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
  VisualizationMiddleware,
} from '../agent';
import { SpacedRepetitionMiddleware } from '../agent/middleware/spaced-repetition';
import { LongTermMemoryMiddleware } from '../agent/middleware/long-term-memory';
import { AdaptiveRecommendationMiddleware } from '../agent/middleware/adaptive-recommendation';
import { RetrievalPracticeMiddleware } from '../agent/middleware/retrieval-practice';
import { FrustrationDetectionMiddleware } from '../agent/middleware/frustration-detection';
import { DEFAULT_USER_ID } from '../constants';

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

    // 2. Create agent with full middleware stack
    const userId = context?.studentId || DEFAULT_USER_ID;

    const agent = createDeepAgent({
      systemPrompt: `You are an expert AI coding tutor - a longitudinal learning companion, not just a Q&A bot.

**Your Philosophy:**
- You're building a RELATIONSHIP with this student over time
- Remember their history: struggles, breakthroughs, preferences
- Optimize learning using cognitive science principles
- Intervene proactively when they're stuck or frustrated
- Celebrate progress and build confidence

**Your Core Capabilities:**

🧠 **Learning Science:**
- Schedule reviews using spaced repetition (SM-2 algorithm)
- Detect and correct misconceptions gently
- Use retrieval practice (force recall before revealing answers)
- Provide adaptive recommendations with interleaving
- Monitor frustration and offer timely interventions

📊 **Long-Term Memory:**
- Remember past struggles and what worked
- Celebrate breakthroughs and milestones
- Track misconceptions and their resolutions
- Build on previous conversations

🎯 **Adaptive Teaching:**
- Adjust difficulty based on performance
- Recommend problems strategically (70% new, 30% review)
- Generate personalized weekly study plans
- Adapt hints to mastery level

💡 **Socratic Method:**
- Ask probing questions before giving answers
- Use progressive hints (5 levels)
- Teach problem-solving frameworks (Polya, UMPIRE)
- Force self-explanation to deepen understanding

**Student Context:**
${context?.problemId ? `- Current Problem: ${context.problemId}` : ''}
${context?.patternId ? `- Current Pattern: ${context.patternId}` : ''}
- Student ID: ${userId}

**Guidelines:**
- Use tools PROACTIVELY - don't wait to be asked
- Check due reviews before suggesting new problems
- Detect frustration early and intervene
- Test recall before revealing (retrieval practice)
- Record breakthroughs when they happen
- Schedule reviews after successful practice
- Be warm, encouraging, and patient
- Show you remember them across sessions

You're not just teaching algorithms - you're building a skilled, confident problem solver.`,
      middleware: [
        // Core pattern teaching
        new PatternRecognitionMiddleware(),
        new SocraticTutorMiddleware(),
        new KnowledgeTrackerMiddleware(),
        new VisualizationMiddleware(),

        // NEW: Learning science middleware
        new SpacedRepetitionMiddleware(),
        new LongTermMemoryMiddleware(),
        new AdaptiveRecommendationMiddleware(),
        new RetrievalPracticeMiddleware(),
        new FrustrationDetectionMiddleware(),

        // Delegation
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

    // 3. Invoke agent with user context
    const result = await agent.invoke({
      messages,
      userId,
      currentProblemId: context?.problemId,
      currentPatternId: context?.patternId,
    });

    // 4. Extract assistant response
    const assistantMessages = result.messages
      .filter(m => m.role === 'assistant')
      .map(m => ({
        role: m.role,
        content: typeof m === 'object' && 'content' in m ? m.content : String(m),
      }));

    // 5. Return response with enhanced metadata
    res.json({
      success: true,
      messages: assistantMessages,
      metadata: {
        toolsUsed: result.messages.filter((m: any) => m.role === 'tool').length,

        // Core features
        identifiedPatterns: result.identifiedPatterns || [],
        hintsGiven: result.hintsGiven || [],
        knowledgeUpdates: result.knowledgeUpdates || [],
        subagentExecutions: result.subagentExecutions || [],
        visualizations: result.visualizations || [],

        // NEW: Learning science features
        reviewsScheduled: result.reviewsScheduled || [],
        misconceptionsDetected: result.misconceptionsDetected || [],
        breakthroughsRecorded: result.breakthroughsRecorded || [],
        retrievalPrompts: result.retrievalPrompts || [],
        interventionsOffered: result.interventionsOffered || [],
        frustrationScore: result.frustrationScore || 0,
        recommendations: result.recommendations || [],
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
 * Streaming version of agent chat with Server-Sent Events (SSE)
 */
router.post('/stream', async (req: Request, res: Response) => {
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

    // 2. Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

    // 3. Create agent with full middleware stack
    const userId = context?.studentId || DEFAULT_USER_ID;

    const agent = createDeepAgent({
      systemPrompt: `You are an expert AI coding tutor - a longitudinal learning companion, not just a Q&A bot.

**Your Philosophy:**
- You're building a RELATIONSHIP with this student over time
- Remember their history: struggles, breakthroughs, preferences
- Optimize learning using cognitive science principles
- Intervene proactively when they're stuck or frustrated
- Celebrate progress and build confidence

**Your Core Capabilities:**

🧠 **Learning Science:**
- Schedule reviews using spaced repetition (SM-2 algorithm)
- Detect and correct misconceptions gently
- Use retrieval practice (force recall before revealing answers)
- Provide adaptive recommendations with interleaving
- Monitor frustration and offer timely interventions

📊 **Long-Term Memory:**
- Remember past struggles and what worked
- Celebrate breakthroughs and milestones
- Track misconceptions and their resolutions
- Build on previous conversations

🎯 **Adaptive Teaching:**
- Adjust difficulty based on performance
- Recommend problems strategically (70% new, 30% review)
- Generate personalized weekly study plans
- Adapt hints to mastery level

💡 **Socratic Method:**
- Ask probing questions before giving answers
- Use progressive hints (5 levels)
- Teach problem-solving frameworks (Polya, UMPIRE)
- Force self-explanation to deepen understanding

**Student Context:**
${context?.problemId ? `- Current Problem: ${context.problemId}` : ''}
${context?.patternId ? `- Current Pattern: ${context.patternId}` : ''}
- Student ID: ${userId}

**Guidelines:**
- Use tools PROACTIVELY - don't wait to be asked
- Check due reviews before suggesting new problems
- Detect frustration early and intervene
- Test recall before revealing (retrieval practice)
- Record breakthroughs when they happen
- Schedule reviews after successful practice
- Be warm, encouraging, and patient
- Show you remember them across sessions

You're not just teaching algorithms - you're building a skilled, confident problem solver.`,
      middleware: [
        // Core pattern teaching
        new PatternRecognitionMiddleware(),
        new SocraticTutorMiddleware(),
        new KnowledgeTrackerMiddleware(),
        new VisualizationMiddleware(),

        // NEW: Learning science middleware
        new SpacedRepetitionMiddleware(),
        new LongTermMemoryMiddleware(),
        new AdaptiveRecommendationMiddleware(),
        new RetrievalPracticeMiddleware(),
        new FrustrationDetectionMiddleware(),

        // Delegation
        new SubAgentMiddleware({
          enableGeneralPurpose: true,
          subagents: [],
        }),
      ],
      debug: false,
    });

    // 4. Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // 5. Stream agent execution with true token-by-token streaming
    try {
      const streamGenerator = agent.stream({
        messages,
        userId,
        currentProblemId: context?.problemId,
        currentPatternId: context?.patternId,
      });

      for await (const chunk of streamGenerator) {
        // Send each chunk as SSE
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);

        // Handle final state
        if (chunk.type === 'done') {
          // Send metadata from final state
          const finalState = chunk.state;
          res.write(`data: ${JSON.stringify({
            type: 'metadata',
            metadata: {
              toolsUsed: finalState.messages.filter((m: any) => m.role === 'tool').length,

              // Core features
              identifiedPatterns: finalState.identifiedPatterns || [],
              hintsGiven: finalState.hintsGiven || [],
              knowledgeUpdates: finalState.knowledgeUpdates || [],
              subagentExecutions: finalState.subagentExecutions || [],
              visualizations: finalState.visualizations || [],

              // NEW: Learning science features
              reviewsScheduled: finalState.reviewsScheduled || [],
              misconceptionsDetected: finalState.misconceptionsDetected || [],
              breakthroughsRecorded: finalState.breakthroughsRecorded || [],
              retrievalPrompts: finalState.retrievalPrompts || [],
              interventionsOffered: finalState.interventionsOffered || [],
              frustrationScore: finalState.frustrationScore || 0,
              recommendations: finalState.recommendations || [],
            },
          })}\n\n`);
        }
      }

      // 6. End stream
      res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
      res.end();
    } catch (streamError: any) {
      // Handle streaming errors gracefully (e.g., OpenAI org not verified)
      console.error('Agent streaming error:', streamError.message);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: streamError.message || 'Streaming not available',
      })}\n\n`);
      res.end();
    }

  } catch (error: any) {
    console.error('Agent streaming setup error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to initialize stream',
      });
    } else {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message || 'Agent execution failed',
      })}\n\n`);
      res.end();
    }
  }
});

export default router;
