import { Router } from 'express';
import patternsRouter from './patterns';
import aiRouter from './ai';
import aiStreamRouter from './ai-stream';
import submissionsRouter from './submissions';
import progressRouter from './progress';
import agentRouter from './agent';

const router = Router();

// Mount routes
router.use('/patterns', patternsRouter);
router.use('/ai', aiRouter); // Legacy AI endpoints (deprecated - use /agent instead)
router.use('/ai/stream', aiStreamRouter); // Legacy streaming endpoints
router.use('/submissions', submissionsRouter);
router.use('/progress', progressRouter);
router.use('/agent', agentRouter); // NEW: DeepAgents-based conversational tutor

export default router;
