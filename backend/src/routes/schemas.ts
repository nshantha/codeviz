/**
 * Shared Validation Schemas
 * Used across multiple route handlers to avoid duplication
 */

import { z } from 'zod';

/**
 * Schema for pattern identification requests
 */
export const IdentifyPatternSchema = z.object({
  problemDescription: z.string().min(10, 'Problem description too short'),
});

/**
 * Schema for hint generation requests
 */
export const GenerateHintSchema = z.object({
  problemId: z.string().uuid(),
  problemDescription: z.string().min(10),
  userCode: z.string().optional(),
  hintLevel: z.number().int().min(1).max(5).default(1),
  hintsGiven: z.array(z.string()).optional().default([]),
});

/**
 * Schema for code submission requests
 */
export const SubmitCodeSchema = z.object({
  problemId: z.string().uuid(),
  code: z.string().min(1, 'Code cannot be empty'),
  language: z.enum(['javascript', 'python', 'java', 'cpp', 'go']),
});
