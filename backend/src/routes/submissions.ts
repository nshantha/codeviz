import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../config/supabase';
import { KnowledgeTrackerService } from '../services/learning/knowledge-tracker';

const router = Router();

// Validation schema
const SubmissionSchema = z.object({
  problemId: z.string().uuid(),
  code: z.string().min(1, 'Code cannot be empty'),
  language: z.enum(['Java', 'Python', 'JavaScript']),
});

/**
 * POST /api/submissions
 * Submit code (mock execution for MVP)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request
    const { problemId, code, language } = SubmissionSchema.parse(req.body);

    const supabase = getSupabaseClient();

    // Mock execution result (always "Accepted" for MVP)
    const mockResult = {
      status: 'Accepted',
      executionTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
      memory: Math.floor(Math.random() * 2048) + 1024, // 1-3MB
      message: 'All test cases passed!',
    };

    // Save submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        problem_id: problemId,
        code,
        language,
        result: mockResult.status,
        execution_time: mockResult.executionTime,
        hints_used: 0, // TODO: Track hints separately
      })
      .select()
      .single();

    if (submissionError) {
      throw submissionError;
    }

    // Get problem's patterns
    const { data: problemPatterns } = await supabase
      .from('problem_patterns')
      .select('pattern_id, is_primary')
      .eq('problem_id', problemId);

    // Update knowledge state for each pattern
    const knowledgeTracker = new KnowledgeTrackerService(supabase);

    if (problemPatterns && mockResult.status === 'Accepted') {
      for (const pp of problemPatterns) {
        await knowledgeTracker.updateKnowledge({
          patternId: pp.pattern_id,
          solved: true,
          hintsUsed: 0,
          timeSpent: mockResult.executionTime,
        });
      }
    }

    res.json({
      success: true,
      data: {
        submission: {
          id: submission.id,
          createdAt: submission.created_at,
        },
        result: mockResult,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Error submitting code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit code'
    });
  }
});

export default router;
