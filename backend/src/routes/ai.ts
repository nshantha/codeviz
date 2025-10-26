import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getAIServiceFactory } from '../services/ai';
import { PatternRecognitionService } from '../services/ai/pattern-recognition';
import { HintGeneratorService } from '../services/ai/hint-generator';

const router = Router();

// Validation schemas
const IdentifyPatternSchema = z.object({
  problemDescription: z.string().min(10, 'Problem description too short'),
});

const GenerateHintSchema = z.object({
  problemId: z.string().uuid(),
  problemDescription: z.string().min(10),
  userCode: z.string().optional(),
  hintLevel: z.number().int().min(1).max(5).default(1),
  hintsGiven: z.array(z.string()).optional().default([]),
});

/**
 * POST /api/ai/identify-pattern
 * AI identifies which pattern applies to a problem
 */
router.post('/identify-pattern', async (req: Request, res: Response) => {
  try {
    // Validate request
    const { problemDescription } = IdentifyPatternSchema.parse(req.body);

    // Get AI service
    const aiFactory = getAIServiceFactory();
    const patternRecognizer = new PatternRecognitionService(aiFactory);

    // Identify pattern
    const result = await patternRecognizer.identifyPattern(problemDescription);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Error identifying pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to identify pattern'
    });
  }
});

/**
 * POST /api/ai/hint
 * Generate Socratic hint for problem
 */
router.post('/hint', async (req: Request, res: Response) => {
  try {
    // Validate request
    const context = GenerateHintSchema.parse(req.body);

    // Get AI service
    const aiFactory = getAIServiceFactory();
    const hintGenerator = new HintGeneratorService(aiFactory);

    // Generate hint
    const result = await hintGenerator.generateHint(context);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Error generating hint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate hint'
    });
  }
});

export default router;
