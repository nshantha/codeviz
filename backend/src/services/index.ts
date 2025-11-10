/**
 * Services index
 * Export all service singletons
 */

export * from './base.service';
export * from './spaced-repetition.service';
export * from './student-model.service';
export * from './misconception-detector.service';
export * from './recommendation.service';

// Re-export existing services for consistency
export * from './pattern-recognition.service';
export * from './hint-generator.service';
export * from './knowledge-tracker.service';
