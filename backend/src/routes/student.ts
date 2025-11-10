/**
 * Student Routes
 * Endpoints for student profile, preferences, and progress narratives
 */

import { Router } from 'express';
import { studentModelService } from '../services/student-model.service';
import { misconceptionDetectorService } from '../services/misconception-detector.service';
import { DEFAULT_USER_ID } from '../constants';
import { getRelativeTime } from '../utils/date-helpers';

const router = Router();

/**
 * GET /api/student/profile
 * Get complete student profile
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;

    const model = await studentModelService.getStudentModel(userId);

    res.json({
      success: true,
      profile: {
        userId: model.userId,
        overallMastery: Math.round(model.knowledgeState.overallMastery * 100),
        strengths: model.knowledgeState.strengths,
        weaknesses: model.knowledgeState.weaknesses,
        currentStreak: model.history.currentStreak,
        longestStreak: model.history.longestStreak,
        totalSessions: model.history.totalSessionCount,
        learningVelocity: model.learningProfile.learningVelocity,
        consistencyScore: Math.round(model.learningProfile.consistencyScore * 100),
        readinessScore: model.readinessScore,
        nextMilestone: model.nextMilestone,
        recommendedPace: model.recommendedPace,
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
 * GET /api/student/preferences
 * Get student preferences
 */
router.get('/preferences', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;

    const preferences = await studentModelService.getPreferences(userId);

    res.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/student/preferences
 * Update student preferences
 */
router.put('/preferences', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;
    const updates = req.body;

    const preferences = await studentModelService.updatePreferences(userId, updates);

    res.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/student/goals
 * Get student goals
 */
router.get('/goals', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;

    const goals = await studentModelService.getGoals(userId);

    res.json({
      success: true,
      goals,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/student/goals
 * Set student goals
 */
router.put('/goals', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;
    const goalsData = req.body;

    const goals = await studentModelService.setGoals(userId, goalsData);

    res.json({
      success: true,
      goals,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/student/breakthroughs
 * Get breakthrough moments
 */
router.get('/breakthroughs', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;
    const limit = parseInt(req.query.limit as string) || 10;

    const breakthroughs = await studentModelService.getBreakthroughs(userId, limit);

    res.json({
      success: true,
      count: breakthroughs.length,
      breakthroughs: breakthroughs.map(b => ({
        id: b.id,
        patternId: b.patternId,
        insight: b.insight,
        description: b.description,
        masteryBefore: b.masteryBefore,
        masteryAfter: b.masteryAfter,
        improvement: Math.round((b.masteryAfter - b.masteryBefore) * 100),
        timestamp: b.timestamp,
        relativeTime: getRelativeTime(b.timestamp),
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
 * GET /api/student/misconceptions
 * Get active misconceptions
 */
router.get('/misconceptions', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;
    const patternId = req.query.patternId as string | undefined;

    const misconceptions = await misconceptionDetectorService.getMisconceptions(
      userId,
      patternId
    );

    res.json({
      success: true,
      count: misconceptions.length,
      misconceptions: misconceptions.map(m => ({
        id: m.id,
        patternId: m.patternId,
        description: m.description,
        correction: m.correction,
        occurrenceCount: m.occurrenceCount,
        firstDetected: m.firstDetected,
        lastObserved: m.lastObserved,
        daysSinceFirst: Math.floor(
          (new Date().getTime() - m.firstDetected.getTime()) / (1000 * 60 * 60 * 24)
        ),
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
 * POST /api/student/misconceptions/:id/resolve
 * Mark misconception as resolved
 */
router.post('/misconceptions/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;

    await misconceptionDetectorService.resolveMisconception(id);

    res.json({
      success: true,
      message: 'Misconception marked as resolved',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/student/misconception-stats
 * Get misconception statistics
 */
router.get('/misconception-stats', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;

    const stats = await misconceptionDetectorService.getMisconceptionStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/student/narrative
 * Generate progress narrative
 */
router.get('/narrative', async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;
    const timeframe = (req.query.timeframe as 'week' | 'month' | 'all-time') || 'all-time';

    const model = await studentModelService.getStudentModel(userId);

    // Generate narrative
    const narrative = {
      timeframe,
      generatedAt: new Date(),

      story: {
        opening: generateOpening(model),
        struggles: generateStruggles(model),
        breakthroughs: generateBreakthroughs(model),
        currentState: generateCurrentState(model),
        encouragement: generateEncouragement(model),
      },

      metrics: {
        problemsSolved: model.knowledgeState.patterns.size,
        patternsLearned: model.knowledgeState.patterns.size,
        currentStreak: model.history.currentStreak,
        averageSolveTime: 0, // TODO: calculate from sessions
        improvementRate: 0, // TODO: calculate
        masteryGrowth: model.knowledgeState.overallMastery,
      },
    };

    res.json({
      success: true,
      narrative,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Helper functions for narrative generation

function generateOpening(model: any): string {
  if (model.history.totalSessionCount === 0) {
    return "Welcome to your learning journey! You're just getting started, and every expert was once a beginner.";
  }

  if (model.history.totalSessionCount < 10) {
    return `You've completed ${model.history.totalSessionCount} practice sessions. You're building momentum!`;
  }

  return `Over ${model.history.totalSessionCount} practice sessions, you've grown from beginner to ${
    model.knowledgeState.overallMastery > 0.7 ? 'advanced' : 'intermediate'
  } level.`;
}

function generateStruggles(model: any): string[] {
  const struggles: string[] = [];

  if (model.history.misconceptions.length > 0) {
    struggles.push(
      `You've worked through ${model.history.misconceptions.length} misconception(s) - these are stepping stones to mastery.`
    );
  }

  if (model.knowledgeState.weaknesses.length > 0) {
    struggles.push(
      `Patterns like ${model.knowledgeState.weaknesses.slice(0, 2).join(' and ')} have been challenging, but you're making progress.`
    );
  }

  return struggles;
}

function generateBreakthroughs(model: any): string[] {
  return model.history.breakthroughs.slice(0, 3).map((b: any) => b.insight);
}

function generateCurrentState(model: any): string {
  const mastery = Math.round(model.knowledgeState.overallMastery * 100);

  if (mastery < 30) {
    return `You're at ${mastery}% mastery. You're in the learning phase - keep practicing consistently.`;
  }

  if (mastery < 70) {
    return `You're at ${mastery}% mastery. You're solidifying your understanding - great progress!`;
  }

  return `You're at ${mastery}% mastery. You're approaching interview readiness - excellent work!`;
}

function generateEncouragement(model: any): string {
  if (model.history.currentStreak > 5) {
    return `Your ${model.history.currentStreak}-day streak shows dedication. Keep it up!`;
  }

  if (model.knowledgeState.overallMastery > 0.7) {
    return "You're in the top tier of learners. Consider scheduling mock interviews!";
  }

  return "Every problem you solve makes you stronger. You've got this!";
}

export default router;
