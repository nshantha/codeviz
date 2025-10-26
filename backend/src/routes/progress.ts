import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';
import { KnowledgeTrackerService } from '../services/learning/knowledge-tracker';

const router = Router();

/**
 * GET /api/progress
 * Get knowledge tracking overview
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const knowledgeTracker = new KnowledgeTrackerService(supabase);

    // Get all knowledge states
    const knowledgeStates = await knowledgeTracker.getAllKnowledgeStates();

    // Get all patterns for reference
    const { data: patterns } = await supabase
      .from('patterns')
      .select('id, name, type, difficulty');

    // Calculate overall metrics
    const totalPatterns = patterns?.length || 0;
    const patternsMastered = knowledgeStates.filter(k => k.status === 'Mastered').length;
    const overallMastery = knowledgeStates.length > 0
      ? knowledgeStates.reduce((sum, k) => sum + k.mastery_probability, 0) / knowledgeStates.length
      : 0;

    // Merge pattern details with knowledge state
    const patternsWithProgress = patterns?.map(pattern => {
      const knowledge = knowledgeStates.find(k => k.pattern_id === pattern.id);
      return {
        id: pattern.id,
        name: pattern.name,
        type: pattern.type,
        difficulty: pattern.difficulty,
        mastery: knowledge?.mastery_probability || 0,
        status: knowledge?.status || 'Locked',
        problemsSolved: knowledge?.problems_solved || 0,
        problemsAttempted: knowledge?.problems_attempted || 0,
      };
    }) || [];

    res.json({
      success: true,
      data: {
        overallMastery: Math.round(overallMastery * 100) / 100,
        patternsMastered,
        totalPatterns,
        patterns: patternsWithProgress,
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress'
    });
  }
});

export default router;
