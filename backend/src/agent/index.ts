/**
 * DeepAgents-inspired Agent System for AlgoMentor
 * Main exports for the agent framework
 */

// Core types
export * from './types';

// Executor
export { AgentExecutor } from './executor';

// Factory
export { createDeepAgent, getAIServiceFactory, AIServiceFactory } from './factory';

// Middleware
export { PatternRecognitionMiddleware } from './middleware/pattern-recognition';
export { SocraticTutorMiddleware } from './middleware/socratic-tutor';
export { KnowledgeTrackerMiddleware } from './middleware/knowledge-tracker';
export { SubAgentMiddleware } from './middleware/subagents';
export { VisualizationMiddleware } from './middleware/visualization';

// Visualization types
export type { VisualizationSpec, VisualizationStep } from './middleware/visualization';
