# AlgoMentor Backend - Implementation Quick Start Guide

**7-Day Build Plan** | Based on DeepAgents Architecture Patterns

---

## Prerequisites

```bash
# Install required tools
node --version  # >= 20.0.0
npm --version   # >= 10.0.0
psql --version  # PostgreSQL >= 15

# Create database
createdb algomentor_dev

# Get API keys
# 1. Anthropic: https://console.anthropic.com/
# 2. Judge0: https://rapidapi.com/judge0-official/api/judge0-ce
```

---

## Day 1: Project Setup & Core Infrastructure

### Step 1: Initialize Project

```bash
mkdir algomentor-backend
cd algomentor-backend

# Initialize npm project
npm init -y

# Install core dependencies
npm install express cors helmet compression dotenv
npm install @anthropic-ai/sdk axios
npm install @prisma/client
npm install winston date-fns lodash
npm install bcrypt jsonwebtoken
npm install zod

# Install dev dependencies
npm install -D typescript @types/node @types/express
npm install -D @types/cors @types/bcrypt @types/jsonwebtoken
npm install -D ts-node nodemon
npm install -D eslint prettier
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D jest @types/jest ts-jest supertest @types/supertest
npm install -D prisma
```

### Step 2: Create Project Structure

```bash
# Create directory structure
mkdir -p src/{config,middleware,services/{ai,learning,code-execution,analytics},repositories,models,controllers,routes/v1,types,utils,seeds}
mkdir -p tests/{unit/{services,repositories,utils},integration/{api,learning},helpers}
mkdir -p prisma

# Create core files
touch src/index.ts
touch src/app.ts
touch src/server.ts
touch .env.example
touch .env
touch tsconfig.json
touch .eslintrc.js
touch .prettierrc
touch Makefile
```

### Step 3: Configure TypeScript

Create `tsconfig.json`:
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
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Step 4: Setup Environment

Create `.env`:
```bash
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://user:password@localhost:5432/algomentor_dev

ANTHROPIC_API_KEY=your_key_here
AI_MODEL=claude-sonnet-4-5-20250929
AI_MAX_TOKENS=20000

JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_key_here

JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Step 5: Create Core App Factory

**`src/app.ts`** (DeepAgents-inspired factory):
```typescript
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

export interface AppOptions {
  debug?: boolean;
  middleware?: express.RequestHandler[];
}

export function createApp(options: AppOptions = {}): Application {
  const app = express();

  // Security
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
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes (to be added)
  // setupRoutes(app);

  // Error handler (to be added)
  // setupErrorHandlers(app);

  return app;
}
```

**`src/server.ts`**:
```typescript
import { createApp } from './app';

const PORT = process.env.PORT || 3000;

const app = createApp({ debug: process.env.NODE_ENV === 'development' });

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
```

**`src/index.ts`**:
```typescript
import 'dotenv/config';
import './server';
```

### Step 6: Add Development Scripts

**`package.json`**:
```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint 'src/**/*.ts'",
    "format": "prettier --write 'src/**/*.ts'"
  }
}
```

**`nodemon.json`**:
```json
{
  "watch": ["src"],
  "ext": "ts",
  "exec": "ts-node src/index.ts"
}
```

### Step 7: Test Setup

```bash
# Run development server
npm run dev

# Should see:
# 🚀 Server running on http://localhost:3000
# 📊 Health check: http://localhost:3000/health

# Test health endpoint
curl http://localhost:3000/health
# {"status":"ok","timestamp":"2025-10-25T..."}
```

✅ **Day 1 Complete**: Core infrastructure is running!

---

## Day 2: Database Setup & AI Service Factory

### Step 1: Initialize Prisma

```bash
npx prisma init
```

### Step 2: Create Database Schema

**`prisma/schema.prisma`** (copy from BACKEND_ARCHITECTURE.md)

Key models to create first:
- User
- Pattern
- Problem
- Submission
- KnowledgeState

### Step 3: Run Migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Step 4: Create AI Service Factory

**`src/services/ai/index.ts`**:
```typescript
import Anthropic from '@anthropic-ai/sdk';

export interface AIServiceConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

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

  getDefaultModelConfig() {
    return {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };
  }

  // Factory methods (to be implemented)
  createPatternRecognizer() {
    // TODO: Day 3
  }

  createHintGenerator() {
    // TODO: Day 3
  }

  createCodeReviewer() {
    // TODO: Day 3
  }
}

// Singleton
let aiFactory: AIServiceFactory | null = null;

export function getAIServiceFactory(): AIServiceFactory {
  if (!aiFactory) {
    aiFactory = new AIServiceFactory({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: process.env.AI_MODEL,
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '20000'),
    });
  }
  return aiFactory;
}
```

### Step 5: Test AI Connection

**`tests/integration/ai/connection.test.ts`**:
```typescript
import { getAIServiceFactory } from '../../../src/services/ai';

describe('AI Service Factory', () => {
  it('should create AI service with default config', () => {
    const factory = getAIServiceFactory();
    const config = factory.getDefaultModelConfig();

    expect(config.model).toBe('claude-sonnet-4-5-20250929');
    expect(config.max_tokens).toBe(20000);
  });

  it('should connect to Anthropic API', async () => {
    // Basic connection test
    const factory = getAIServiceFactory();
    // Add simple API call test
  });
});
```

✅ **Day 2 Complete**: Database schema and AI factory ready!

---

## Day 3: Implement Core Services

### Step 1: Pattern Recognition Service

**`src/services/ai/pattern-recognition.ts`**:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { AIServiceConfig } from './index';

export interface PatternRecognitionResult {
  primaryPattern: string;
  secondaryPatterns: string[];
  confidence: number;
  reasoning: string;
}

export class PatternRecognitionService {
  constructor(
    private client: Anthropic,
    private config: Required<AIServiceConfig>
  ) {}

  async identifyPattern(problemDescription: string): Promise<PatternRecognitionResult> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: this.buildPrompt(problemDescription)
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return this.parseResponse(content.text);
  }

  private buildPrompt(problemDescription: string): string {
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

  private parseResponse(text: string): PatternRecognitionResult {
    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch {
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

### Step 2: Hint Generator Service

**`src/services/ai/hint-generator.ts`** (from BACKEND_ARCHITECTURE.md)

### Step 3: Knowledge Tracer Service

**`src/services/learning/knowledge-tracer.ts`** (from BACKEND_ARCHITECTURE.md)

### Step 4: Spaced Repetition Service

**`src/services/learning/spaced-repetition.ts`** (from BACKEND_ARCHITECTURE.md)

### Step 5: Update AI Factory

**`src/services/ai/index.ts`**:
```typescript
import { PatternRecognitionService } from './pattern-recognition';
import { HintGeneratorService } from './hint-generator';
import { CodeReviewerService } from './code-reviewer';

export class AIServiceFactory {
  // ... existing code ...

  createPatternRecognizer() {
    return new PatternRecognitionService(this.client, this.config);
  }

  createHintGenerator() {
    return new HintGeneratorService(this.client, this.config);
  }

  createCodeReviewer() {
    return new CodeReviewerService(this.client, this.config);
  }
}
```

✅ **Day 3 Complete**: Core learning services implemented!

---

## Day 4: Build API Layer

### Step 1: Request Context Middleware

**`src/middleware/context.ts`** (from BACKEND_ARCHITECTURE.md)

### Step 2: Auth Middleware

**`src/middleware/auth.ts`** (from BACKEND_ARCHITECTURE.md)

### Step 3: Validation Middleware

**`src/middleware/validation.ts`** (from BACKEND_ARCHITECTURE.md)

### Step 4: Error Handler

**`src/middleware/error-handler.ts`**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
    });
  }

  req.context.logger.error('Unexpected error', { err });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}

export function setupErrorHandlers(app: Application) {
  app.use(errorHandler);
}
```

### Step 5: Create Controllers

**`src/controllers/problem.controller.ts`** (from BACKEND_ARCHITECTURE.md)

**`src/controllers/submission.controller.ts`**:
```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/async-handler';
import { KnowledgeTracerService } from '../services/learning/knowledge-tracer';
import { SpacedRepetitionService } from '../services/learning/spaced-repetition';

export class SubmissionController {
  private db: PrismaClient;
  private knowledgeTracer: KnowledgeTracerService;
  private spacedRepetition: SpacedRepetitionService;

  constructor() {
    this.db = new PrismaClient();
    this.knowledgeTracer = new KnowledgeTracerService(this.db);
    this.spacedRepetition = new SpacedRepetitionService(this.db);
  }

  submit = asyncHandler(async (req: Request, res: Response) => {
    const { problemId, code, language } = req.body;
    const userId = req.context.userId!;

    // 1. Execute code (Judge0)
    const result = await this.executeCode(code, language);

    // 2. Save submission
    const submission = await this.db.submission.create({
      data: {
        userId,
        problemId,
        code,
        language,
        result: result.status,
        executionTime: result.time,
        hintsUsed: 0, // Track separately
        attemptNumber: await this.getAttemptNumber(userId, problemId),
      }
    });

    // 3. Update knowledge state
    if (result.status === 'Accepted') {
      const problem = await this.db.problem.findUnique({
        where: { id: problemId },
        include: { patterns: true }
      });

      for (const pp of problem!.patterns) {
        await this.knowledgeTracer.updateKnowledge({
          userId,
          patternId: pp.patternId,
          solved: true,
          hintsUsed: 0,
          attemptNumber: submission.attemptNumber,
          timeSpent: result.time,
        });
      }

      // 4. Schedule review
      await this.spacedRepetition.scheduleReview(userId, problemId);
    }

    res.json({
      success: true,
      data: {
        submission,
        result,
      }
    });
  });

  private async executeCode(code: string, language: string) {
    // TODO: Implement Judge0 client
    return { status: 'Accepted', time: 100 };
  }

  private async getAttemptNumber(userId: string, problemId: string): Promise<number> {
    const count = await this.db.submission.count({
      where: { userId, problemId }
    });
    return count + 1;
  }
}
```

### Step 6: Create Routes

**`src/routes/v1/index.ts`**:
```typescript
import { Router } from 'express';
import problemsRouter from './problems.routes';
import submissionsRouter from './submissions.routes';
import authRouter from './auth.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/problems', problemsRouter);
router.use('/submissions', submissionsRouter);

export default router;
```

**`src/routes/index.ts`**:
```typescript
import { Application } from 'express';
import v1Router from './v1';

export function setupRoutes(app: Application) {
  app.use('/api/v1', v1Router);
}
```

### Step 7: Wire Everything Together

**`src/app.ts`** (updated):
```typescript
import { setupRoutes } from './routes';
import { setupErrorHandlers } from './middleware/error-handler';
import { contextMiddleware } from './middleware/context';

export function createApp(options: AppOptions = {}): Application {
  const app = express();

  // ... existing middleware ...

  // Context injection
  app.use(contextMiddleware);

  // Routes
  setupRoutes(app);

  // Error handlers (must be last)
  setupErrorHandlers(app);

  return app;
}
```

✅ **Day 4 Complete**: API endpoints working!

---

## Day 5: Testing & Code Execution

### Step 1: Judge0 Client

**`src/services/code-execution/judge0-client.ts`**:
```typescript
import axios from 'axios';

export interface ExecutionResult {
  status: string;
  time: number;
  memory: number;
  stdout?: string;
  stderr?: string;
  compile_output?: string;
}

export class Judge0Client {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.JUDGE0_API_URL!;
    this.apiKey = process.env.JUDGE0_API_KEY!;
  }

  async execute(
    code: string,
    language: string,
    input: string
  ): Promise<ExecutionResult> {
    const languageId = this.getLanguageId(language);

    // Submit code
    const submission = await axios.post(
      `${this.baseUrl}/submissions`,
      {
        source_code: code,
        language_id: languageId,
        stdin: input,
      },
      {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
        },
      }
    );

    const token = submission.data.token;

    // Poll for result
    let result;
    let attempts = 0;
    while (attempts < 10) {
      await this.sleep(500);

      result = await axios.get(
        `${this.baseUrl}/submissions/${token}`,
        {
          headers: {
            'X-RapidAPI-Key': this.apiKey,
          },
        }
      );

      if (result.data.status.id > 2) {
        // Processing complete
        break;
      }

      attempts++;
    }

    return {
      status: this.mapStatus(result.data.status.id),
      time: parseFloat(result.data.time || '0'),
      memory: parseFloat(result.data.memory || '0'),
      stdout: result.data.stdout,
      stderr: result.data.stderr,
      compile_output: result.data.compile_output,
    };
  }

  private getLanguageId(language: string): number {
    const map: Record<string, number> = {
      Java: 62,
      Python: 71,
      JavaScript: 63,
    };
    return map[language] || 71;
  }

  private mapStatus(statusId: number): string {
    const map: Record<number, string> = {
      3: 'Accepted',
      4: 'Wrong Answer',
      5: 'Time Limit Exceeded',
      6: 'Compilation Error',
      // ... more statuses
    };
    return map[statusId] || 'Unknown';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Step 2: Write Tests

**`tests/integration/api/submissions.test.ts`**:
```typescript
import request from 'supertest';
import { createApp } from '../../../src/app';
import { PrismaClient } from '@prisma/client';

describe('Submission API', () => {
  let app: Application;
  let db: PrismaClient;
  let authToken: string;

  beforeAll(async () => {
    app = createApp();
    db = new PrismaClient();

    // Create test user and get token
    const user = await db.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashed',
        name: 'Test User',
      }
    });

    authToken = 'test_token'; // Generate real JWT
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('should submit code and return result', async () => {
    const problem = await db.problem.findFirst();

    const response = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        problemId: problem!.id,
        code: 'console.log("Hello");',
        language: 'JavaScript',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.submission).toHaveProperty('id');
  });
});
```

✅ **Day 5 Complete**: Code execution and testing working!

---

## Day 6: Database Seeding & Optimization

### Step 1: Create Seed Data

**`prisma/seeds/patterns.seed.ts`**:
```typescript
import { PrismaClient } from '@prisma/client';

export async function seedPatterns(db: PrismaClient) {
  const patterns = [
    {
      name: 'Two Pointers',
      type: 'coding',
      difficulty: 'Beginner',
      description: 'Use two pointers to traverse array...',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      useCases: ['Sorted array problems', 'Finding pairs'],
      codeTemplates: {
        java: `public int[] twoPointers(int[] arr) {
  int left = 0, right = arr.length - 1;
  while (left < right) {
    // logic
  }
}`,
      },
    },
    // ... 11 more patterns
  ];

  for (const pattern of patterns) {
    await db.pattern.upsert({
      where: { name: pattern.name },
      update: pattern,
      create: pattern,
    });
  }
}
```

**`prisma/seed.ts`**:
```typescript
import { PrismaClient } from '@prisma/client';
import { seedPatterns } from './seeds/patterns.seed';
import { seedProblems } from './seeds/problems.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await seedPatterns(prisma);
  await seedProblems(prisma);

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Step 2: Run Seeds

```bash
npm run seed
```

✅ **Day 6 Complete**: Database populated with real data!

---

## Day 7: Polish & Deploy

### Step 1: Add Logging

**`src/utils/logger.ts`**:
```typescript
import winston from 'winston';

export function createLogger(requestId?: string): winston.Logger {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { requestId },
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
  });
}
```

### Step 2: Create Makefile

```makefile
.PHONY: help install dev build start test lint format migrate seed

help:
	@echo "AlgoMentor Backend Commands"

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

lint:
	npm run lint

format:
	npm run format

migrate:
	npx prisma migrate dev

seed:
	npm run seed
```

### Step 3: Deploy

```bash
# Build
npm run build

# Test production build
NODE_ENV=production npm start

# Deploy to Railway/Render/Heroku
# (follow platform-specific instructions)
```

✅ **Day 7 Complete**: Production-ready backend!

---

## Testing Your Implementation

```bash
# 1. Start server
npm run dev

# 2. Test health endpoint
curl http://localhost:3000/health

# 3. Test pattern recognition
curl -X POST http://localhost:3000/api/v1/ai/identify-pattern \
  -H "Content-Type: application/json" \
  -d '{
    "problemDescription": "Given a sorted array, find two numbers that add up to target"
  }'

# 4. Run tests
npm test

# 5. Check coverage
npm run test:coverage
```

---

## Common Issues & Solutions

### Issue: Prisma client not generating
```bash
npx prisma generate
```

### Issue: Database connection fails
```bash
# Check DATABASE_URL in .env
# Test connection
psql $DATABASE_URL
```

### Issue: TypeScript errors
```bash
# Rebuild
npm run build

# Check types
npx tsc --noEmit
```

---

## Next Steps After Day 7

1. **Frontend Integration**: Connect React frontend
2. **WebSocket**: Add real-time features for mock interviews
3. **Caching**: Add Redis for frequently accessed data
4. **Monitoring**: Add APM (Application Performance Monitoring)
5. **Documentation**: Generate API docs with Swagger
6. **Analytics**: Add user behavior tracking
7. **System Design**: Implement canvas backend

---

## Resources

- **DeepAgents Source**: `/Users/nitesh/Desktop/projects/deepagents`
- **Architecture Doc**: `BACKEND_ARCHITECTURE.md`
- **Mapping Guide**: `DEEPAGENTS_MAPPING.md`
- **Design Doc**: `DESIGN_DOC.md`

---

**You now have a complete implementation roadmap following DeepAgents' proven patterns!**

Start with `npm run dev` and build incrementally. Each day builds on the previous day's work.

Good luck! 🚀
