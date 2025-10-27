import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';
import { KnowledgeTrackerService } from '../services/learning/knowledge-tracker';

const router = Router();

/**
 * GET /api/patterns
 * List all patterns (coding + system design)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const supabase = getSupabaseClient();

    let query = supabase.from('patterns').select('*');

    if (type && (type === 'coding' || type === 'system_design')) {
      query = query.eq('type', type);
    }

    const { data: patterns, error } = await query.order('difficulty', { ascending: true });

    if (error) {
      throw error;
    }

    // Get knowledge states for each pattern
    const knowledgeTracker = new KnowledgeTrackerService(supabase);
    const knowledgeStates = await knowledgeTracker.getAllKnowledgeStates();

    // Merge knowledge state with patterns
    const patternsWithProgress = patterns?.map(pattern => {
      const knowledge = knowledgeStates.find(k => k.pattern_id === pattern.id);
      return {
        ...pattern,
        mastery: knowledge?.mastery_probability || 0,
        problemsSolved: knowledge?.problems_solved || 0,
        status: knowledge?.status || 'Locked',
      };
    });

    res.json({
      success: true,
      data: patternsWithProgress || [],
    });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patterns'
    });
  }
});

/**
 * GET /api/patterns/:id
 * Get pattern details with code templates
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();

    const { data: pattern, error } = await supabase
      .from('patterns')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !pattern) {
      res.status(404).json({
        success: false,
        error: 'Pattern not found'
      });
      return;
    }

    // Get related problems
    const { data: problemPatterns } = await supabase
      .from('problem_patterns')
      .select('problem_id, is_primary')
      .eq('pattern_id', id);

    const problemIds = problemPatterns?.map(pp => pp.problem_id) || [];

    let problems: any[] = [];
    if (problemIds.length > 0) {
      const { data } = await supabase
        .from('problems')
        .select('id, title, slug, difficulty')
        .in('id', problemIds)
        .limit(10);

      problems = data || [];
    }

    // Get knowledge state
    const knowledgeTracker = new KnowledgeTrackerService(supabase);
    const knowledge = await knowledgeTracker.getPatternKnowledge(id);

    res.json({
      success: true,
      data: {
        ...pattern,
        mastery: knowledge?.mastery_probability || 0,
        problemsSolved: knowledge?.problems_solved || 0,
        status: knowledge?.status || 'Locked',
        problems,
      },
    });
  } catch (error) {
    console.error('Error fetching pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pattern'
    });
  }
});

export default router;
