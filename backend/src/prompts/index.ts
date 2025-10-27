/**
 * Prompts Index
 * Centralized export for all AI prompts with schema-based approach
 */

// Schemas
export * from './schemas';

// Pattern Recognition
export {
  PATTERN_RECOGNITION_SYSTEM_PROMPT,
  buildPatternRecognitionPrompt,
  patternRecognitionResponseFormat
} from './pattern-recognition';

// Socratic Hints
export {
  SOCRATIC_SYSTEM_PROMPT,
  HINT_LEVELS,
  buildSocraticHintPrompt,
  socraticHintResponseFormat,
  adjustHintDifficulty,
  ENCOURAGEMENT_MESSAGES
} from './socratic-hints';

export type { HintLevel } from './socratic-hints';
