import { Router } from 'express';
import patternsRouter from './patterns';
import aiRouter from './ai';
import submissionsRouter from './submissions';
import progressRouter from './progress';

const router = Router();

// Mount routes
router.use('/patterns', patternsRouter);
router.use('/ai', aiRouter);
router.use('/submissions', submissionsRouter);
router.use('/progress', progressRouter);

export default router;
