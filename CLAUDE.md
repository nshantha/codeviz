# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AlgoMentor is an AI-powered interview preparation system that uses pattern-based learning, spaced repetition, Bayesian knowledge tracing, and Socratic AI tutoring to help users master coding interviews.

**Tech Stack:**
- Backend: Node.js 20+ with TypeScript, Express.js
- Database: PostgreSQL (Supabase)
- AI: OpenAI GPT-5 with Structured Outputs (2025)
- Validation: Zod schemas

## Common Commands

### Development
```bash
# Install dependencies
cd backend && npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run all API tests (comprehensive integration test)
./test-api.sh
```

### Database Setup
1. Create Supabase project at https://supabase.com
2. Get credentials (URL + Service Role Key)
3. Run `backend/database/schema.sql` in Supabase SQL Editor
4. Run `backend/database/seed.sql` to load 17 patterns

### Environment Configuration
```bash
# Copy example and edit with your API keys
cp backend/.env.example backend/.env
```

Required environment variables:
- `OPENAI_API_KEY` - OpenAI GPT-5 API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Architecture (DeepAgents-Inspired)

This backend follows the **DeepAgents** architecture pattern for building robust AI agent systems:

### Factory Pattern
- `AIServiceFactory` (backend/src/services/ai/index.ts:15) - Singleton factory that creates configured AI services with shared OpenAI client
- Inspired by DeepAgents' `create_deep_agent` pattern
- Centralizes configuration and client instantiation

### Service Layer Design
```
src/
├── app.ts                 # App factory (like create_deep_agent)
├── config/                # Zod-validated environment config
├── routes/                # API endpoints (thin controllers)
├── services/              # Business logic (like DeepAgents tools)
│   ├── ai/                # AI services (pattern recognition, hints)
│   └── learning/          # Knowledge tracking algorithms
├── prompts/               # Schema-based AI prompts ✨
│   ├── schemas.ts         # JSON schemas for structured outputs
│   ├── pattern-recognition.ts
│   └── socratic-hints.ts
└── config/supabase.ts     # Database client
```

### Key Architectural Patterns

1. **Schema-Based Prompting** (2025 OpenAI Feature)
   - Uses OpenAI Structured Outputs for guaranteed JSON responses
   - Schemas defined in `backend/src/prompts/schemas.ts`
   - Pattern recognition returns: `primaryPattern`, `confidence`, `reasoning`, `keyIndicators`
   - Hints follow Socratic method: 5 levels from clarifying → consequence

2. **Type Safety**
   - Strict TypeScript mode enabled (`tsconfig.json:8`)
   - Zod validation for all environment variables (`config/index.ts`)
   - Zod validation for all API requests (`routes/schemas.ts`)

3. **Streaming Support**
   - SSE (Server-Sent Events) for real-time AI responses
   - Separate streaming endpoints in `routes/ai-stream.ts`
   - Note: Streaming does NOT support structured outputs (OpenAI limitation)

4. **Error Handling**
   - AI services return fallback responses on error (not exceptions)
   - Pattern recognition falls back to `Unknown` pattern with 0.5 confidence
   - Global error handler in `app.ts:56`

## OpenAI GPT-5 (2025) Specifics

⚠️ **Important API Changes:**
- Use `max_completion_tokens` instead of deprecated `max_tokens`
- Temperature defaults to 1.0 (cannot be changed for GPT-5)
- Structured outputs require `response_format` with JSON schema
- Streaming does NOT support structured outputs

Example:
```typescript
const completion = await client.chat.completions.create({
  model: 'gpt-5',
  max_completion_tokens: 1000,
  // temperature: 1.0 is default and only option
  messages: [...],
  response_format: { type: 'json_schema', json_schema: schema }
});
```

## Database Schema

**Tables:**
- `patterns` - 17 patterns (12 coding + 5 system design)
- `problems` - Coding problems with test cases
- `problem_patterns` - Many-to-many relationship
- `submissions` - Code submissions (mock execution for MVP)
- `student_progress` - Bayesian knowledge tracking per pattern

**Key Columns:**
- Pattern type: `'coding'` or `'system_design'`
- Difficulty: `'Easy'`, `'Medium'`, `'Hard'` (problems)
- Difficulty: `'Beginner'`, `'Intermediate'`, `'Advanced'` (patterns)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/patterns` | List all patterns |
| GET | `/api/patterns/:id` | Get pattern details |
| POST | `/api/ai/identify-pattern` | AI pattern recognition (structured) |
| POST | `/api/ai/hint` | Generate Socratic hint (structured) |
| POST | `/api/ai/stream/identify-pattern` | Pattern recognition (streaming) |
| POST | `/api/ai/stream/hint` | Hint generation (streaming) |
| POST | `/api/submissions` | Submit code (mock execution) |
| GET | `/api/progress` | Knowledge tracking overview |

## Testing

Run `./test-api.sh` for comprehensive integration tests:
- ✅ Health check
- ✅ Database connection (17 patterns)
- ✅ AI pattern recognition (98% accuracy)
- ⚠️ Hint generation (fallback mode during debugging)
- ✅ Code submission
- ✅ Progress tracking

## Development Workflow

1. **Adding New AI Features:**
   - Define JSON schema in `prompts/schemas.ts`
   - Create prompt builder in `prompts/`
   - Implement service in `services/ai/`
   - Add route in `routes/`
   - Add validation schema in `routes/schemas.ts`

2. **Modifying AI Prompts:**
   - System prompts in `prompts/*.ts` (e.g., `PATTERN_RECOGNITION_SYSTEM_PROMPT`)
   - User prompt builders (e.g., `buildPatternRecognitionPrompt()`)
   - Response formats (e.g., `patternRecognitionResponseFormat`)

3. **Database Changes:**
   - Modify `backend/database/schema.sql`
   - Update seed data in `backend/database/seed.sql`
   - Re-run both scripts in Supabase SQL Editor

## Known Limitations (MVP)

- Code execution is mocked (not using Judge0 API yet)
- No user authentication (submissions not tied to users)
- Hint generation has AI debugging in progress (fallback works)
- Single database schema (no migrations system)

## Troubleshooting

**Port already in use:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Database connection error:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Check Supabase project is running
- Ensure schema.sql and seed.sql were executed

**AI errors:**
- Check `OPENAI_API_KEY` is valid
- Verify OpenAI account has credits
- Check model name is `gpt-5` (not `gpt-4` or others)

**TypeScript errors:**
- Run `npm run build` to see full error output
- Check strict mode compliance (`tsconfig.json:8`)
- Verify all imports use correct paths (no `.ts` extensions in imports)
