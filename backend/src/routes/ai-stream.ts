import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getAIServiceFactory } from '../services/ai';
import { PatternRecognitionService } from '../services/ai/pattern-recognition';
import { HintGeneratorService } from '../services/ai/hint-generator';
import { IdentifyPatternSchema, GenerateHintSchema } from './schemas';

const router = Router();

/**
 * Utility: Set SSE headers for streaming responses
 */
const setSSEHeaders = (res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
};

/**
 * POST /api/ai/stream/identify-pattern
 * AI identifies pattern with Server-Sent Events (SSE) streaming
 */
router.post('/identify-pattern', async (req: Request, res: Response) => {
  try {
    // Validate request
    const { problemDescription } = IdentifyPatternSchema.parse(req.body);

    // Set headers for SSE
    setSSEHeaders(res);

    // Get AI service
    const aiFactory = getAIServiceFactory();
    const patternRecognizer = new PatternRecognitionService(aiFactory);

    // Get streaming response
    const stream = await patternRecognizer.identifyPatternStream(problemDescription);

    // Stream chunks to client
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // End stream
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Error streaming pattern recognition:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stream pattern recognition'
    });
  }
});

/**
 * POST /api/ai/stream/hint
 * Generate Socratic hint with SSE streaming
 */
router.post('/hint', async (req: Request, res: Response) => {
  try {
    // Validate request
    const context = GenerateHintSchema.parse(req.body);

    // Set headers for SSE
    setSSEHeaders(res);

    // Get AI service
    const aiFactory = getAIServiceFactory();
    const hintGenerator = new HintGeneratorService(aiFactory);

    // Get streaming response
    const stream = await hintGenerator.generateHintStream(context);

    // Stream chunks to client
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Send metadata about next hint level
    res.write(`data: ${JSON.stringify({
      meta: {
        nextLevel: Math.min(context.hintLevel + 1, 5),
        shouldRevealSolution: context.hintLevel >= 4
      }
    })}\n\n`);

    // End stream
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Error streaming hint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stream hint'
    });
  }
});

export default router;
