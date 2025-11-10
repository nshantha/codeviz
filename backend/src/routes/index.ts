import { Router } from 'express';
import patternsRouter from './patterns';
import aiRouter from './ai';
import aiStreamRouter from './ai-stream';
import submissionsRouter from './submissions';
import progressRouter from './progress';
import agentRouter from './agent';
import learningRouter from './learning';
import studentRouter from './student';

const router = Router();

// Mount routes
router.use('/patterns', patternsRouter);
router.use('/ai', aiRouter); // Legacy AI endpoints (deprecated - use /agent instead)
router.use('/ai/stream', aiStreamRouter); // Legacy streaming endpoints
router.use('/submissions', submissionsRouter);
router.use('/progress', progressRouter);
router.use('/agent', agentRouter); // DeepAgents-based conversational tutor

// NEW: Learning science endpoints
router.use('/learning', learningRouter); // Spaced repetition, recommendations, weekly plans
router.use('/student', studentRouter); // Student profile, preferences, progress narratives

export default router;
