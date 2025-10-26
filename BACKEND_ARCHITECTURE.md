# AlgoMentor Backend Architecture
## Inspired by DeepAgents Design Patterns

**Version**: 1.0
**Author**: Nitesh
**Last Updated**: 2025-10-25

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Core Modules](#core-modules)
5. [Middleware System](#middleware-system)
6. [Service Layer](#service-layer)
7. [Data Models](#data-models)
8. [API Layer](#api-layer)
9. [Configuration & Environment](#configuration--environment)
10. [Development Workflow](#development-workflow)

---

## Architecture Overview

### Design Philosophy (Inspired by DeepAgents)

**Key Principles from DeepAgents**:
1. **Middleware-Based Architecture**: Composable, layered functionality
2. **Factory Pattern**: Clean instantiation with sensible defaults
3. **Type Safety First**: Full TypeScript with strict mode
4. **Tool-Based Abstractions**: Each capability is a "tool" with well-defined interface
5. **State Management**: Explicit state handling with reducers
6. **Runtime Context**: Tools receive runtime context for accessing state/services

**AlgoMentor Adaptations**:
- Replace LangGraph's state graph → Express.js with middleware chain
- Replace LangChain tools → Service methods with standardized interfaces
- Keep: Middleware composition, factory patterns, type safety
- Add: REST API layer, WebSocket support, Database ORM

---

## Project Structure

```
algomentor/
├── src/
│   ├── index.ts                       # Application entry point
│   ├── app.ts                         # Express app factory
│   ├── server.ts                      # HTTP server setup
│   │
│   ├── config/
│   │   ├── index.ts                   # Configuration aggregator
│   │   ├── database.ts                # Database configuration
│   │   ├── ai.ts                      # AI/Anthropic config
│   │   ├── judge.ts                   # Judge0 API config
│   │   └── defaults.ts                # Default constants
│   │
│   ├── middleware/                    # Express middleware (DeepAgents-inspired)
│   │   ├── index.ts                   # Middleware exports
│   │   ├── error-handler.ts           # Global error handling
│   │   ├── request-logger.ts          # Request/response logging
│   │   ├── auth.ts                    # JWT authentication
│   │   ├── validation.ts              # Request validation
│   │   ├── rate-limit.ts              # Rate limiting
│   │   └── context.ts                 # Request context injection
│   │
│   ├── services/                      # Business logic (like DeepAgents tools)
│   │   ├── index.ts                   # Service exports
│   │   │
│   │   ├── ai/                        # AI Services
│   │   │   ├── index.ts               # AI service factory
│   │   │   ├── base.ts                # Base AI service
│   │   │   ├── pattern-recognition.ts # Pattern identification
│   │   │   ├── hint-generator.ts      # Socratic hints
│   │   │   ├── code-reviewer.ts       # Code review feedback
│   │   │   ├── interviewer.ts         # Mock interview AI
│   │   │   ├── system-design.ts       # System design feedback
│   │   │   └── prompt-templates.ts    # Centralized prompts
│   │   │
│   │   ├── learning/                  # Learning Science Services
│   │   │   ├── index.ts               # Learning service factory
│   │   │   ├── knowledge-tracer.ts    # Bayesian Knowledge Tracing
│   │   │   ├── spaced-repetition.ts   # SM-2 algorithm
│   │   │   ├── difficulty-adapter.ts  # Adaptive difficulty
│   │   │   ├── pattern-sequencer.ts   # Pattern unlock logic
│   │   │   └── mastery-calculator.ts  # Mastery metrics
│   │   │
│   │   ├── code-execution/            # Code Execution Services
│   │   │   ├── index.ts               # Execution service factory
│   │   │   ├── judge0-client.ts       # Judge0 API client
│   │   │   ├── test-runner.ts         # Test case execution
│   │   │   └── result-parser.ts       # Execution result parsing
│   │   │
│   │   ├── analytics/                 # Analytics Services
│   │   │   ├── index.ts               # Analytics service factory
│   │   │   ├── progress-tracker.ts    # User progress tracking
│   │   │   ├── insights-generator.ts  # AI-generated insights
│   │   │   └── readiness-calculator.ts# Interview readiness score
│   │   │
│   │   └── visualization/             # Visualization Services
│   │       ├── index.ts               # Visualization service factory
│   │       ├── algorithm-animator.ts  # Algorithm step generation
│   │       └── snapshot-generator.ts  # Execution snapshots
│   │
│   ├── repositories/                  # Data access layer (like DeepAgents store)
│   │   ├── index.ts                   # Repository exports
│   │   ├── base.ts                    # Base repository with common methods
│   │   ├── user.ts                    # User repository
│   │   ├── pattern.ts                 # Pattern repository
│   │   ├── problem.ts                 # Problem repository
│   │   ├── submission.ts              # Submission repository
│   │   ├── knowledge-state.ts         # Knowledge state repository
│   │   ├── review-queue.ts            # Review queue repository
│   │   └── system-design.ts           # System design repository
│   │
│   ├── models/                        # Database models (Prisma/TypeORM)
│   │   ├── index.ts                   # Model exports
│   │   ├── User.ts                    # User model
│   │   ├── Pattern.ts                 # Pattern model
│   │   ├── Problem.ts                 # Problem model
│   │   ├── Submission.ts              # Submission model
│   │   ├── KnowledgeState.ts          # Knowledge state model
│   │   ├── ReviewQueue.ts             # Review queue model
│   │   ├── SystemDesign.ts            # System design model
│   │   └── LearningEvent.ts           # Learning event log
│   │
│   ├── controllers/                   # API controllers
│   │   ├── index.ts                   # Controller exports
│   │   ├── auth.controller.ts         # Authentication endpoints
│   │   ├── user.controller.ts         # User management
│   │   ├── pattern.controller.ts      # Pattern endpoints
│   │   ├── problem.controller.ts      # Problem endpoints
│   │   ├── submission.controller.ts   # Code submission endpoints
│   │   ├── review.controller.ts       # Spaced repetition endpoints
│   │   ├── ai.controller.ts           # AI interaction endpoints
│   │   ├── analytics.controller.ts    # Analytics endpoints
│   │   └── system-design.controller.ts# System design endpoints
│   │
│   ├── routes/                        # API routes
│   │   ├── index.ts                   # Route aggregator
│   │   ├── v1/                        # API v1
│   │   │   ├── index.ts               # V1 route aggregator
│   │   │   ├── auth.routes.ts         # /api/v1/auth
│   │   │   ├── users.routes.ts        # /api/v1/users
│   │   │   ├── patterns.routes.ts     # /api/v1/patterns
│   │   │   ├── problems.routes.ts     # /api/v1/problems
│   │   │   ├── submissions.routes.ts  # /api/v1/submissions
│   │   │   ├── reviews.routes.ts      # /api/v1/reviews
│   │   │   ├── ai.routes.ts           # /api/v1/ai
│   │   │   ├── analytics.routes.ts    # /api/v1/analytics
│   │   │   └── system-design.routes.ts# /api/v1/system-design
│   │   └── health.routes.ts           # /health
│   │
│   ├── types/                         # TypeScript types (like DeepAgents TypedDicts)
│   │   ├── index.ts                   # Type exports
│   │   ├── api.types.ts               # API request/response types
│   │   ├── service.types.ts           # Service interface types
│   │   ├── database.types.ts          # Database types
│   │   ├── ai.types.ts                # AI-related types
│   │   └── learning.types.ts          # Learning algorithm types
│   │
│   ├── utils/                         # Utility functions
│   │   ├── index.ts                   # Utility exports
│   │   ├── logger.ts                  # Winston logger
│   │   ├── validators.ts              # Custom validators
│   │   ├── formatters.ts              # Data formatters
│   │   ├── errors.ts                  # Custom error classes
│   │   └── async-handler.ts           # Async error wrapper
│   │
│   └── seeds/                         # Database seeds
│       ├── index.ts                   # Seed runner
│       ├── patterns.seed.ts           # 12 patterns
│       ├── problems.seed.ts           # Initial problems
│       └── system-design.seed.ts      # System design concepts
│
├── prisma/                            # Database schema (or use TypeORM migrations/)
│   ├── schema.prisma                  # Prisma schema
│   ├── migrations/                    # Migration files
│   └── seed.ts                        # Seed script
│
├── tests/                             # Tests (like DeepAgents structure)
│   ├── unit/                          # Unit tests
│   │   ├── services/                  # Service tests
│   │   ├── repositories/              # Repository tests
│   │   └── utils/                     # Utility tests
│   ├── integration/                   # Integration tests
│   │   ├── api/                       # API endpoint tests
│   │   ├── learning/                  # Learning algorithm tests
│   │   └── ai/                        # AI service tests
│   └── helpers/                       # Test utilities
│       ├── setup.ts                   # Test setup
│       ├── teardown.ts                # Test teardown
│       ├── factories.ts               # Test data factories
│       └── mocks.ts                   # Mock services
│
├── scripts/                           # Utility scripts
│   ├── seed-db.ts                     # Database seeding
│   ├── generate-problems.ts           # Problem generation
│   └── migrate.ts                     # Migration runner
│
├── .env.example                       # Environment template
├── .env                               # Environment variables (gitignored)
├── .eslintrc.js                       # ESLint config (like Ruff)
├── .prettierrc                        # Prettier config
├── tsconfig.json                      # TypeScript config (strict mode)
├── package.json                       # Dependencies
├── nodemon.json                       # Dev server config
├── Makefile                           # Dev commands (like DeepAgents)
└── README.md                          # Documentation
```

---

## Technology Stack

### Core Framework
```json
{
  "runtime": "Node.js 20+",
  "language": "TypeScript 5.3+",
  "framework": "Express.js 4.18+",
  "database": "PostgreSQL 15+",
  "orm": "Prisma 5.0+ (or TypeORM 0.3+)"
}
```

### Key Dependencies

#### Production Dependencies
```json
{
  "dependencies": {
    // Core Framework
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",

    // Database
    "@prisma/client": "^5.8.0",
    "pg": "^8.11.0",

    // AI Integration
    "@anthropic-ai/sdk": "^0.30.0",

    // Authentication & Security
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "express-rate-limit": "^7.1.5",

    // Validation
    "zod": "^3.22.4",
    "express-validator": "^7.0.1",

    // Code Execution
    "axios": "^1.6.5",

    // Utilities
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "date-fns": "^3.0.6",
    "lodash": "^4.17.21",

    // Background Jobs
    "node-cron": "^3.0.3",
    "bull": "^4.12.0",

    // WebSocket (optional for Day 1)
    "socket.io": "^4.6.0"
  }
}
```

#### Development Dependencies
```json
{
  "devDependencies": {
    // TypeScript
    "typescript": "^5.3.3",
    "@types/node": "^20.10.0",
    "@types/express": "^4.17.21",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",

    // Testing
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2",

    // Linting & Formatting
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.16.0",
    "@typescript-eslint/eslint-plugin": "^6.16.0",
    "prettier": "^3.1.1",

    // Dev Tools
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2",
    "prisma": "^5.8.0"
  }
}
```

### External Services
- **Anthropic API**: Claude Sonnet 4.5
- **Judge0 API**: Code execution (or self-hosted)
- **PostgreSQL**: Primary database
- **Redis** (optional): Caching & queue management

---

## Core Modules

### 1. App Factory (`src/app.ts`)

**Inspired by**: DeepAgents' `create_deep_agent()` factory

```typescript
// src/app.ts
import express, { Application } from 'express';
import { setupMiddleware } from './middleware';
import { setupRoutes } from './routes';
import { setupErrorHandlers } from './middleware/error-handler';
import { Config } from './config';

export interface AppOptions {
  config?: Partial<Config>;
  middleware?: express.RequestHandler[];
  debug?: boolean;
}

/**
 * Create and configure Express application
 * Factory pattern inspired by DeepAgents' create_deep_agent
 */
export function createApp(options: AppOptions = {}): Application {
  const app = express();

  // 1. Setup core middleware (like DeepAgents middleware stack)
  setupMiddleware(app, options);

  // 2. Setup routes
  setupRoutes(app);

  // 3. Setup error handlers (must be last)
  setupErrorHandlers(app);

  return app;
}
```

### 2. Middleware Setup (`src/middleware/index.ts`)

**Inspired by**: DeepAgents' middleware composition

```typescript
// src/middleware/index.ts
import { Application } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { requestLogger } from './request-logger';
import { contextMiddleware } from './context';
import { AppOptions } from '../app';

/**
 * Setup middleware chain (like DeepAgents middleware stack)
 * Order matters - each middleware builds on previous
 */
export function setupMiddleware(app: Application, options: AppOptions): void {
  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
  }));

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging (like DeepAgents debug mode)
  if (options.debug || process.env.NODE_ENV === 'development') {
    app.use(requestLogger);
  }

  // Request context injection (like DeepAgents ToolRuntime)
  app.use(contextMiddleware);

  // Custom middleware (extensibility like DeepAgents)
  if (options.middleware) {
    options.middleware.forEach(mw => app.use(mw));
  }
}
```

### 3. Request Context (`src/middleware/context.ts`)

**Inspired by**: DeepAgents' ToolRuntime and Runtime context

```typescript
// src/middleware/context.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { createLogger } from '../utils/logger';

/**
 * Request context (like DeepAgents ToolRuntime)
 * Provides access to services, state, and configuration
 */
export interface RequestContext {
  requestId: string;
  userId?: string;
  logger: Logger;
  db: PrismaClient;
  startTime: number;
}

// Extend Express Request to include context
declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

const db = new PrismaClient();

/**
 * Inject context into request (like DeepAgents runtime injection)
 */
export function contextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string ||
                    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  req.context = {
    requestId,
    userId: undefined, // Set by auth middleware
    logger: createLogger(requestId),
    db,
    startTime: Date.now(),
  };

  next();
}
```

---

## Middleware System

### Auth Middleware (`src/middleware/auth.ts`)

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * JWT authentication middleware
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JWTPayload;

    // Inject userId into context (like DeepAgents state updates)
    req.context.userId = decoded.userId;

    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      req.context.userId = decoded.userId;
    }
    next();
  } catch (error) {
    // Silently continue without auth
    next();
  }
}
```

### Validation Middleware (`src/middleware/validation.ts`)

**Inspired by**: DeepAgents' path validation and type safety

```typescript
// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from '../utils/errors';

/**
 * Validate request against Zod schema (like DeepAgents _validate_path)
 */
export function validate(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError('Validation failed', 400, error.errors));
      } else {
        next(error);
      }
    }
  };
}

// Example usage in routes:
// router.post(
//   '/submit',
//   validate({ body: SubmissionSchema }),
//   submissionController.submit
// );
```

---

## Service Layer

### AI Service Factory (`src/services/ai/index.ts`)

**Inspired by**: DeepAgents' tool generation pattern

```typescript
// src/services/ai/index.ts
import Anthropic from '@anthropic-ai/sdk';
import { PatternRecognitionService } from './pattern-recognition';
import { HintGeneratorService } from './hint-generator';
import { CodeReviewerService } from './code-reviewer';
import { InterviewerService } from './interviewer';
import { SystemDesignService } from './system-design';

export interface AIServiceConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * AI Service Factory (like DeepAgents create_deep_agent)
 * Creates configured AI services with shared client
 */
export class AIServiceFactory {
  private client: Anthropic;
  private config: Required<AIServiceConfig>;

  constructor(config: AIServiceConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'claude-sonnet-4-5-20250929',
      maxTokens: config.maxTokens || 20000,
      temperature: config.temperature || 0.7,
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
    });
  }

  /**
   * Get default model configuration (like DeepAgents get_default_model)
   */
  getDefaultModelConfig() {
    return {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };
  }

  /**
   * Create pattern recognition service
   */
  createPatternRecognizer() {
    return new PatternRecognitionService(this.client, this.config);
  }

  /**
   * Create hint generator service
   */
  createHintGenerator() {
    return new HintGeneratorService(this.client, this.config);
  }

  /**
   * Create code reviewer service
   */
  createCodeReviewer() {
    return new CodeReviewerService(this.client, this.config);
  }

  /**
   * Create interviewer service
   */
  createInterviewer() {
    return new InterviewerService(this.client, this.config);
  }

  /**
   * Create system design service
   */
  createSystemDesignService() {
    return new SystemDesignService(this.client, this.config);
  }
}

// Singleton instance (like DeepAgents default model)
let aiServiceFactory: AIServiceFactory | null = null;

export function getAIServiceFactory(): AIServiceFactory {
  if (!aiServiceFactory) {
    aiServiceFactory = new AIServiceFactory({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: process.env.AI_MODEL,
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '20000'),
    });
  }
  return aiServiceFactory;
}
```

### Pattern Recognition Service (`src/services/ai/pattern-recognition.ts`)

```typescript
// src/services/ai/pattern-recognition.ts
import Anthropic from '@anthropic-ai/sdk';
import { AIServiceConfig } from './index';
import { Pattern } from '../../types';

export class PatternRecognitionService {
  constructor(
    private client: Anthropic,
    private config: Required<AIServiceConfig>
  ) {}

  /**
   * Identify which pattern(s) apply to a problem
   */
  async identifyPattern(problemDescription: string): Promise<{
    primaryPattern: string;
    secondaryPatterns: string[];
    confidence: number;
    reasoning: string;
  }> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: this.buildPatternRecognitionPrompt(problemDescription)
      }]
    });

    // Parse structured response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return this.parsePatternResponse(content.text);
  }

  private buildPatternRecognitionPrompt(problemDescription: string): string {
    return `Analyze this coding problem and identify which algorithmic pattern(s) apply.

Problem:
${problemDescription}

Available Patterns:
1. Two Pointers
2. Sliding Window
3. Binary Search
4. Tree BFS
5. Tree DFS
6. Fast & Slow Pointers
7. Merge Intervals
8. Topological Sort
9. Cyclic Sort
10. Dynamic Programming
11. Backtracking
12. Union Find

Return a JSON response with:
{
  "primaryPattern": "pattern name",
  "secondaryPatterns": ["pattern name"],
  "confidence": 0.0-1.0,
  "reasoning": "explanation"
}`;
  }

  private parsePatternResponse(text: string) {
    // Parse AI response (handle both JSON and text formats)
    try {
      return JSON.parse(text);
    } catch {
      // Fallback parsing logic
      return {
        primaryPattern: 'Unknown',
        secondaryPatterns: [],
        confidence: 0.5,
        reasoning: text
      };
    }
  }
}
```

### Hint Generator Service (`src/services/ai/hint-generator.ts`)

**Inspired by**: DeepAgents' Socratic questioning pattern

```typescript
// src/services/ai/hint-generator.ts
import Anthropic from '@anthropic-ai/sdk';
import { AIServiceConfig } from './index';

export interface HintContext {
  problemId: string;
  problemDescription: string;
  userCode: string;
  knownPatterns: string[];
  hintsGiven: string[];
  hintLevel: number; // 1-5
}

export class HintGeneratorService {
  constructor(
    private client: Anthropic,
    private config: Required<AIServiceConfig>
  ) {}

  /**
   * Generate progressive Socratic hint (like DeepAgents subagent pattern)
   */
  async generateHint(context: HintContext): Promise<{
    hint: string;
    nextLevel: number;
    shouldRevealSolution: boolean;
  }> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 500,
      temperature: 0.8, // More creative for hints
      messages: [{
        role: 'user',
        content: this.buildHintPrompt(context)
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return {
      hint: content.text,
      nextLevel: Math.min(context.hintLevel + 1, 5),
      shouldRevealSolution: context.hintLevel >= 4
    };
  }

  private buildHintPrompt(context: HintContext): string {
    const hintLevelGuidance = this.getHintLevelGuidance(context.hintLevel);

    return `You are a patient coding interviewer helping a candidate.

Problem: ${context.problemDescription}

User's current code:
\`\`\`
${context.userCode}
\`\`\`

Patterns user knows: ${context.knownPatterns.join(', ')}
Hints already given: ${context.hintsGiven.join('; ')}

Current hint level: ${context.hintLevel}/5
${hintLevelGuidance}

Rules:
1. NEVER give the full solution directly
2. Ask guiding questions (Socratic method)
3. If they're on the wrong track, gently redirect
4. Encourage small wins ("You're thinking in the right direction...")
5. Match their technical vocabulary level
6. Reference patterns they've already learned

Generate the next hint (1-2 sentences) that moves them closer to the solution.`;
  }

  private getHintLevelGuidance(level: number): string {
    const guidance = {
      1: 'Level 1: Pattern Recognition - Ask what pattern might apply',
      2: 'Level 2: Approach Direction - Guide toward the right approach',
      3: 'Level 3: Algorithm Outline - Describe the high-level algorithm',
      4: 'Level 4: Pseudocode - Provide pseudocode outline',
      5: 'Level 5: Partial Code - Show code structure (only after 3+ attempts)'
    };
    return guidance[level as keyof typeof guidance] || guidance[1];
  }
}
```

### Knowledge Tracer Service (`src/services/learning/knowledge-tracer.ts`)

**Inspired by**: DeepAgents' state management and reducers

```typescript
// src/services/learning/knowledge-tracer.ts
import { PrismaClient } from '@prisma/client';

export interface KnowledgeUpdate {
  userId: string;
  patternId: string;
  solved: boolean;
  hintsUsed: number;
  attemptNumber: number;
  timeSpent: number; // seconds
}

/**
 * Bayesian Knowledge Tracing (simplified)
 * Inspired by DeepAgents' state reducers
 */
export class KnowledgeTracerService {
  constructor(private db: PrismaClient) {}

  /**
   * Update knowledge state (like DeepAgents _file_data_reducer)
   */
  async updateKnowledge(update: KnowledgeUpdate): Promise<{
    masteryProbability: number;
    status: 'Locked' | 'Introduced' | 'Practicing' | 'Mastered' | 'Maintained';
  }> {
    // Get current knowledge state
    const current = await this.db.knowledgeState.findUnique({
      where: {
        userId_patternId: {
          userId: update.userId,
          patternId: update.patternId
        }
      }
    });

    const currentMastery = current?.masteryProbability || 0.1; // P(L0) = 0.1

    // Calculate new mastery probability (Bayesian update)
    let newMastery = currentMastery;

    if (update.solved && update.hintsUsed === 0) {
      // Strong evidence of mastery
      newMastery += 0.2;
    } else if (update.solved && update.hintsUsed > 0) {
      // Weak evidence of mastery
      newMastery += 0.1;
    } else {
      // Evidence of forgetting or never learned
      newMastery -= 0.15;
    }

    // Cap between 0 and 1
    newMastery = Math.max(0, Math.min(1, newMastery));

    // Determine status
    const status = this.calculateStatus(newMastery, update);

    // Update or create knowledge state
    await this.db.knowledgeState.upsert({
      where: {
        userId_patternId: {
          userId: update.userId,
          patternId: update.patternId
        }
      },
      update: {
        masteryProbability: newMastery,
        status,
        problemsAttempted: { increment: 1 },
        problemsSolved: update.solved ? { increment: 1 } : undefined,
        lastPracticed: new Date(),
        averageHintsUsed: this.calculateAverageHints(current, update)
      },
      create: {
        userId: update.userId,
        patternId: update.patternId,
        masteryProbability: newMastery,
        status,
        problemsAttempted: 1,
        problemsSolved: update.solved ? 1 : 0,
        lastPracticed: new Date(),
        averageHintsUsed: update.hintsUsed
      }
    });

    return { masteryProbability: newMastery, status };
  }

  /**
   * Calculate pattern status based on mastery
   */
  private calculateStatus(
    mastery: number,
    update: KnowledgeUpdate
  ): 'Locked' | 'Introduced' | 'Practicing' | 'Mastered' | 'Maintained' {
    if (mastery >= 0.8) return 'Mastered';
    if (mastery >= 0.5) return 'Practicing';
    if (mastery >= 0.2) return 'Introduced';
    return 'Locked';
  }

  /**
   * Calculate rolling average hints used
   */
  private calculateAverageHints(
    current: any,
    update: KnowledgeUpdate
  ): number {
    if (!current) return update.hintsUsed;

    const totalAttempts = current.problemsAttempted + 1;
    const totalHints = (current.averageHintsUsed * current.problemsAttempted) + update.hintsUsed;

    return totalHints / totalAttempts;
  }

  /**
   * Check if pattern is mastered
   */
  async isPatternMastered(userId: string, patternId: string): Promise<boolean> {
    const state = await this.db.knowledgeState.findUnique({
      where: {
        userId_patternId: { userId, patternId }
      }
    });

    return state?.masteryProbability ?? 0 > 0.8;
  }
}
```

### Spaced Repetition Service (`src/services/learning/spaced-repetition.ts`)

**Inspired by**: DeepAgents' scheduling logic

```typescript
// src/services/learning/spaced-repetition.ts
import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';

export interface ReviewResult {
  userId: string;
  problemId: string;
  quality: number; // 0-5 rating
  solved: boolean;
  hintsUsed: number;
  timeSpent: number;
}

/**
 * SM-2 Spaced Repetition Algorithm
 * Inspired by DeepAgents' systematic scheduling
 */
export class SpacedRepetitionService {
  constructor(private db: PrismaClient) {}

  /**
   * Schedule problem for review (after first solve)
   */
  async scheduleReview(userId: string, problemId: string): Promise<void> {
    await this.db.reviewQueue.create({
      data: {
        userId,
        problemId,
        scheduledDate: addDays(new Date(), 1), // First review: 1 day
        interval: 1,
        easeFactor: 2.5, // Default ease factor
        reviewNumber: 1
      }
    });
  }

  /**
   * Update review schedule based on performance
   */
  async updateReviewSchedule(result: ReviewResult): Promise<void> {
    const queueItem = await this.db.reviewQueue.findFirst({
      where: {
        userId: result.userId,
        problemId: result.problemId
      },
      orderBy: { scheduledDate: 'desc' }
    });

    if (!queueItem) {
      // First solve - schedule initial review
      await this.scheduleReview(result.userId, result.problemId);
      return;
    }

    const quality = this.calculateQuality(result);
    const nextInterval = this.calculateNextInterval(
      queueItem.interval,
      quality,
      queueItem.easeFactor
    );
    const newEaseFactor = this.calculateEaseFactor(queueItem.easeFactor, quality);

    // Update existing item
    await this.db.reviewQueue.update({
      where: { id: queueItem.id },
      data: {
        scheduledDate: addDays(new Date(), nextInterval),
        interval: nextInterval,
        easeFactor: newEaseFactor,
        reviewNumber: { increment: 1 }
      }
    });
  }

  /**
   * Calculate quality rating (0-5) from performance
   */
  private calculateQuality(result: ReviewResult): number {
    if (!result.solved) return 0;

    let rating = 5;

    // Deduct for hints used
    rating -= Math.min(result.hintsUsed, 2);

    // Deduct for slow solving (if we track expected time)
    // rating -= timeDeduction;

    return Math.max(0, Math.min(5, rating));
  }

  /**
   * Calculate next review interval (SM-2 algorithm)
   */
  private calculateNextInterval(
    currentInterval: number,
    quality: number,
    easeFactor: number
  ): number {
    if (quality < 3) {
      // Failed recall - reset to 1 day
      return 1;
    }

    // Successful recall - increase interval
    if (currentInterval === 1) {
      return 3; // Second review: 3 days
    } else if (currentInterval === 3) {
      return 7; // Third review: 1 week
    } else {
      // Subsequent reviews: multiply by ease factor
      return Math.round(currentInterval * easeFactor);
    }
  }

  /**
   * Calculate new ease factor based on performance
   */
  private calculateEaseFactor(currentEase: number, quality: number): number {
    const newEase = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    return Math.max(1.3, newEase); // Minimum ease factor
  }

  /**
   * Get problems due for review today
   */
  async getReviewsDue(userId: string): Promise<any[]> {
    return this.db.reviewQueue.findMany({
      where: {
        userId,
        scheduledDate: { lte: new Date() }
      },
      include: {
        problem: true
      },
      orderBy: { scheduledDate: 'asc' }
    });
  }
}
```

---

## Data Models

### Prisma Schema (`prisma/schema.prisma`)

**Inspired by**: DeepAgents' TypedDict structures with proper state management

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  name          String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Settings (JSON)
  currentLevel  String   @default("Easy") // Easy, Medium, Hard
  targetRole    String   @default("SDE2") // SDE2, Senior, Staff
  interviewDate DateTime?
  dailyGoal     Int      @default(3)
  preferredLang String   @default("Java") // Java, Python, JavaScript
  studyTime     Int      @default(60) // minutes per day

  // Relations
  submissions    Submission[]
  knowledgeState KnowledgeState[]
  reviewQueue    ReviewQueue[]
  learningEvents LearningEvent[]
  systemDesigns  SystemDesign[]

  @@map("users")
}

// Pattern model (12 coding patterns + 15 system design concepts)
model Pattern {
  id              String   @id @default(uuid())
  name            String   @unique
  type            String   // "coding" or "system_design"
  difficulty      String   // Beginner, Intermediate, Advanced
  description     String   @db.Text
  visualUrl       String?  // URL to visualization
  timeComplexity  String?
  spaceComplexity String?
  useCases        String[] // Array of use cases
  problemCount    Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Code templates (JSON) - { java: "...", python: "...", javascript: "..." }
  codeTemplates   Json?

  // Prerequisites (many-to-many with self)
  prerequisites   PatternPrerequisite[] @relation("PatternToPrerequisite")
  dependents      PatternPrerequisite[] @relation("PrerequisiteToPattern")

  // Relations
  problems        ProblemPattern[]
  knowledgeState  KnowledgeState[]

  @@map("patterns")
}

// Pattern prerequisites (self-referential many-to-many)
model PatternPrerequisite {
  patternId      String
  prerequisiteId String

  pattern        Pattern @relation("PatternToPrerequisite", fields: [patternId], references: [id], onDelete: Cascade)
  prerequisite   Pattern @relation("PrerequisiteToPattern", fields: [prerequisiteId], references: [id], onDelete: Cascade)

  @@id([patternId, prerequisiteId])
  @@map("pattern_prerequisites")
}

// Problem model
model Problem {
  id          String   @id @default(uuid())
  title       String
  slug        String   @unique
  description String   @db.Text
  difficulty  String   // Easy, Medium, Hard
  companies   String[] // Array of company names
  frequency   Int      @default(5) // 1-10 scale
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Test cases (JSON array)
  testCases   Json     // [{ input: "...", expected: "..." }]

  // Hints (array)
  hints       String[] @db.Text

  // Optimal solution (JSON)
  optimalSolution Json // { code: "...", explanation: "...", timeComplexity: "...", spaceComplexity: "..." }

  // Relations
  patterns    ProblemPattern[]
  submissions Submission[]
  reviewQueue ReviewQueue[]

  @@map("problems")
}

// Many-to-many: Problem <-> Pattern
model ProblemPattern {
  problemId String
  patternId String
  isPrimary Boolean @default(false) // Is this the primary pattern?

  problem   Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  pattern   Pattern @relation(fields: [patternId], references: [id], onDelete: Cascade)

  @@id([problemId, patternId])
  @@map("problem_patterns")
}

// Submission model
model Submission {
  id             String   @id @default(uuid())
  userId         String
  problemId      String
  code           String   @db.Text
  language       String   // Java, Python, JavaScript
  timestamp      DateTime @default(now())
  result         String   // Accepted, Wrong Answer, Time Limit, Runtime Error
  executionTime  Int      // milliseconds
  hintsUsed      Int      @default(0)
  attemptNumber  Int      @default(1)
  isReview       Boolean  @default(false) // Spaced repetition review?

  // Relations
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem        Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@map("submissions")
  @@index([userId, problemId])
  @@index([timestamp])
}

// Knowledge State model (Bayesian Knowledge Tracing)
model KnowledgeState {
  id                   String   @id @default(uuid())
  userId               String
  patternId            String
  masteryProbability   Float    @default(0.1) // 0.0 - 1.0
  lastPracticed        DateTime @default(now())
  problemsSolved       Int      @default(0)
  problemsAttempted    Int      @default(0)
  averageHintsUsed     Float    @default(0)
  status               String   @default("Locked") // Locked, Introduced, Practicing, Mastered, Maintained
  nextReviewDate       DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  // Relations
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  pattern              Pattern  @relation(fields: [patternId], references: [id], onDelete: Cascade)

  @@unique([userId, patternId])
  @@map("knowledge_state")
  @@index([userId])
  @@index([status])
}

// Review Queue model (Spaced Repetition)
model ReviewQueue {
  id            String   @id @default(uuid())
  userId        String
  problemId     String
  scheduledDate DateTime
  interval      Int      // days since last review
  easeFactor    Float    @default(2.5) // SM-2 ease factor
  reviewNumber  Int      @default(1)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem       Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@map("review_queue")
  @@index([userId, scheduledDate])
}

// Learning Event model (Analytics)
model LearningEvent {
  id         String   @id @default(uuid())
  userId     String
  eventType  String   // problem_viewed, hint_requested, solution_submitted, review_completed, etc.
  metadata   Json     // Flexible metadata
  timestamp  DateTime @default(now())

  // Relations
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("learning_events")
  @@index([userId, timestamp])
  @@index([eventType])
}

// System Design model
model SystemDesign {
  id             String   @id @default(uuid())
  userId         String
  problemName    String   // "Design Twitter", "Design Uber", etc.
  canvasData     Json     // Canvas components and connections
  estimations    Json?    // Back-of-envelope calculations
  aiFeedback     String?  @db.Text
  score          Float?   // 0-10
  timestamp      DateTime @default(now())

  // Relations
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("system_designs")
  @@index([userId, timestamp])
}
```

---

## API Layer

### Route Structure (`src/routes/v1/problems.routes.ts`)

```typescript
// src/routes/v1/problems.routes.ts
import { Router } from 'express';
import { ProblemController } from '../../controllers/problem.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { z } from 'zod';

const router = Router();
const controller = new ProblemController();

// Validation schemas
const GetProblemsQuerySchema = z.object({
  pattern: z.string().optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
});

const ProblemIdSchema = z.object({
  id: z.string().uuid(),
});

// Routes
router.get(
  '/',
  authenticate,
  validate({ query: GetProblemsQuerySchema }),
  controller.list
);

router.get(
  '/:id',
  authenticate,
  validate({ params: ProblemIdSchema }),
  controller.get
);

router.get(
  '/recommended',
  authenticate,
  controller.getRecommended
);

export default router;
```

### Controller Example (`src/controllers/problem.controller.ts`)

```typescript
// src/controllers/problem.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ProblemRepository } from '../repositories/problem';
import { DifficultyAdapterService } from '../services/learning/difficulty-adapter';
import { asyncHandler } from '../utils/async-handler';

export class ProblemController {
  private problemRepo: ProblemRepository;
  private difficultyAdapter: DifficultyAdapterService;

  constructor() {
    this.problemRepo = new ProblemRepository();
    this.difficultyAdapter = new DifficultyAdapterService();
  }

  /**
   * List problems with filters
   */
  list = asyncHandler(async (req: Request, res: Response) => {
    const { pattern, difficulty, limit = 20, offset = 0 } = req.query;

    const problems = await this.problemRepo.findMany({
      pattern: pattern as string,
      difficulty: difficulty as string,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      data: problems,
    });
  });

  /**
   * Get single problem
   */
  get = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const problem = await this.problemRepo.findById(id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found',
      });
    }

    res.json({
      success: true,
      data: problem,
    });
  });

  /**
   * Get recommended problem based on user's progress
   * (Like DeepAgents' adaptive agent selection)
   */
  getRecommended = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.context.userId!;

    const recommended = await this.difficultyAdapter.getNextProblem(userId);

    res.json({
      success: true,
      data: recommended,
    });
  });
}
```

---

## Configuration & Environment

### Config Module (`src/config/index.ts`)

**Inspired by**: DeepAgents' configuration management

```typescript
// src/config/index.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Environment validation schema (type safety like DeepAgents)
const EnvSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),

  // Database
  DATABASE_URL: z.string(),

  // AI
  ANTHROPIC_API_KEY: z.string(),
  AI_MODEL: z.string().default('claude-sonnet-4-5-20250929'),
  AI_MAX_TOKENS: z.string().transform(Number).default('20000'),

  // Judge0
  JUDGE0_API_URL: z.string().default('https://judge0-ce.p.rapidapi.com'),
  JUDGE0_API_KEY: z.string(),

  // JWT
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('*'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 min
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
});

export type Config = z.infer<typeof EnvSchema>;

// Validate and export config
export const config = EnvSchema.parse(process.env);
```

### Environment Template (`.env.example`)

```bash
# .env.example

# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/algomentor

# AI (Anthropic)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
AI_MODEL=claude-sonnet-4-5-20250929
AI_MAX_TOKENS=20000

# Code Execution (Judge0)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_judge0_api_key_here

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## Development Workflow

### Makefile (Inspired by DeepAgents)

```makefile
# Makefile

.PHONY: help install dev build start test lint format migrate seed clean

help:
	@echo "AlgoMentor Backend Development Commands"
	@echo ""
	@echo "  make install     - Install dependencies"
	@echo "  make dev         - Run development server"
	@echo "  make build       - Build for production"
	@echo "  make start       - Start production server"
	@echo "  make test        - Run tests"
	@echo "  make lint        - Check code quality"
	@echo "  make format      - Auto-format code"
	@echo "  make migrate     - Run database migrations"
	@echo "  make seed        - Seed database"
	@echo "  make clean       - Clean build artifacts"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

test:
	npm run test

test_watch:
	npm run test:watch

test_coverage:
	npm run test:coverage

lint:
	npm run lint

format:
	npm run format

migrate:
	npx prisma migrate dev

migrate_deploy:
	npx prisma migrate deploy

seed:
	npx prisma db seed

clean:
	rm -rf dist node_modules
```

### Package.json Scripts

```json
{
  "name": "algomentor-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --coverageReporters=text-lcov | coveralls",
    "lint": "eslint 'src/**/*.ts'",
    "lint:fix": "eslint 'src/**/*.ts' --fix",
    "format": "prettier --write 'src/**/*.ts'",
    "migrate": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "seed": "ts-node prisma/seed.ts",
    "studio": "prisma studio"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### TypeScript Config (`tsconfig.json`)

**Strict mode like DeepAgents' mypy**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### ESLint Config (`.eslintrc.js`)

**Like DeepAgents' Ruff configuration**

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

---

## Summary

### Key Architecture Decisions (DeepAgents-Inspired)

✅ **Middleware Composition**: Layered, composable middleware like LangGraph
✅ **Factory Pattern**: Service factories with sensible defaults
✅ **Type Safety**: Strict TypeScript (equivalent to mypy strict mode)
✅ **Service Layer**: Business logic isolated from HTTP layer
✅ **Repository Pattern**: Data access abstraction
✅ **Context Injection**: Runtime context passed to all services
✅ **Error Handling**: Centralized error middleware
✅ **Validation**: Schema-based validation (Zod ≈ Pydantic)
✅ **Testing**: Comprehensive test coverage
✅ **Documentation**: Google-style docstrings in TypeScript

### Next Steps

1. **Day 1**: Implement core structure (app factory, middleware, config)
2. **Day 2**: Build database models, repositories, AI service factory
3. **Day 3**: Implement learning services (knowledge tracer, spaced repetition)
4. **Day 4**: Build API controllers and routes
5. **Day 5**: Add code execution and testing
6. **Day 6**: Polish, optimize, test coverage
7. **Day 7**: Deploy and demo

---

**End of Backend Architecture Document**
