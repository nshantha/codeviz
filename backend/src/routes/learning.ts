/**
 * Learning Routes
 * Endpoints for spaced repetition, recommendations, and weekly planning
 */

import { Router } from 'express';
import { spacedRepetitionService } from '../services/spaced-repetition.service';
import { recommendationService } from '../services/recommendation.service';
import { DEFAULT_USER_ID } from '../constants';

const router = Router();

/**
 * GET /api/learning/due-reviews
 * Get patterns due for review today
 */
router.get('/due-reviews', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID; // TODO: Get from auth

    const dueReviews = await spacedRepetitionService.getDueReviews(userId);

    res.json({
      success: true,
      count: dueReviews.length,
      reviews: dueReviews.map(review => ({
        patternId: review.patternId,
        nextReviewDate: review.nextReviewDate,
        urgency: review.urgency,
        intervalDays: review.intervalDays,
        reviewCount: review.reviewCount,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/learning/upcoming-reviews
 * Get upcoming reviews in next N days
 */
router.get('/upcoming-reviews', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;
    const daysAhead = parseInt(req.query.days as string) || 7;

    const upcomingReviews = await spacedRepetitionService.getUpcomingReviews(
      userId,
      daysAhead
    );

    res.json({
      success: true,
      daysAhead,
      count: upcomingReviews.length,
      reviews: upcomingReviews.map(review => ({
        patternId: review.patternId,
        nextReviewDate: review.nextReviewDate,
        intervalDays: review.intervalDays,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/learning/next-problem
 * Get next recommended problem
 */
router.get('/next-problem', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;

    const recommendation = await recommendationService.getNextProblem(userId);

    if (!recommendation) {
      return res.json({
        success: false,
        message: 'No problems available',
      });
    }

    res.json({
      success: true,
      recommendation,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/learning/weekly-plan
 * Generate weekly study plan
 */
router.get('/weekly-plan', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;

    const weeklyPlan = await recommendationService.generateWeeklyPlan(userId);

    res.json({
      success: true,
      plan: {
        weekStart: weeklyPlan.weekStartDate,
        totalTime: weeklyPlan.totalEstimatedTime,
        focusPatterns: weeklyPlan.focusPatterns,
        reviewPatterns: weeklyPlan.reviewPatterns,
        goals: weeklyPlan.goals,
        dailyPlans: weeklyPlan.dailyPlans.map(day => ({
          date: day.date,
          dayOfWeek: day.dayOfWeek,
          problemCount: day.problems.length,
          patterns: day.patterns,
          estimatedTime: day.estimatedTime,
          focusArea: day.focusArea,
          motivationalMessage: day.motivationalMessage,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/learning/session
 * Start a new learning session
 */
router.post('/session', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;
    const { problemId, patternId } = req.body;

    // Create session in database
    const { getSupabaseClient } = await import('../config/supabase');
    const db = getSupabaseClient();

    const { data, error } = await db
      .from('learning_sessions')
      .insert({
        user_id: userId,
        problem_id: problemId,
        pattern_id: patternId,
        start_time: new Date().toISOString(),
        attempts_count: 0,
        hints_requested: 0,
        completed: false,
        success: false,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      session: {
        id: data.id,
        startTime: data.start_time,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/learning/session/:sessionId
 * Update learning session
 */
router.put('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;

    const { getSupabaseClient } = await import('../config/supabase');
    const db = getSupabaseClient();

    const dbUpdates: any = {};
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.success !== undefined) dbUpdates.success = updates.success;
    if (updates.attemptsCount !== undefined) dbUpdates.attempts_count = updates.attemptsCount;
    if (updates.hintsRequested !== undefined) dbUpdates.hints_requested = updates.hintsRequested;
    if (updates.frustrationScore !== undefined) dbUpdates.frustration_score = updates.frustrationScore;
    if (updates.endTime) {
      dbUpdates.end_time = updates.endTime;
      const { data: session } = await db
        .from('learning_sessions')
        .select('start_time')
        .eq('id', sessionId)
        .single();

      if (session) {
        const duration = Math.floor(
          (new Date(updates.endTime).getTime() - new Date(session.start_time).getTime()) / 60000
        );
        dbUpdates.duration_minutes = duration;
      }
    }

    const { data, error } = await db
      .from('learning_sessions')
      .update(dbUpdates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      session: data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/learning/history
 * Get learning history
 */
router.get('/history', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;
    const limit = parseInt(req.query.limit as string) || 20;

    const { getSupabaseClient } = await import('../config/supabase');
    const db = getSupabaseClient();

    const { data, error } = await db
      .from('learning_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      sessions: data || [],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
