# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AlgoMentor is an AI-powered interview preparation system that uses **true DeepAgents architecture** for pattern-based learning, Bayesian knowledge tracing, and Socratic AI tutoring.

**Tech Stack:**
- Backend: Node.js 20+ with TypeScript, Express.js
- Database: PostgreSQL (Supabase)
- AI: OpenAI GPT-4/GPT-5 with DeepAgents-inspired agent system
- Architecture: Middleware-based agent execution (translated from DeepAgents Python/LangGraph)

**🎯 MAJOR ARCHITECTURE CHANGE (Oct 26, 2025):**
We now implement **true DeepAgents patterns** - this is no longer a simple REST API. It's an autonomous agent system with middleware composition, tool execution loops, and subagent delegation.

See `DEEPAGENTS_ARCHITECTURE.md` for comprehensive architecture documentation.

## Common Commands

### Development
```bash
# Install dependencies
cd backend && npm install

# Start development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Run all API tests
./test-api.sh
```

### Database Setup
1. Create Supabase project at https://supabase.com
2. Get credentials (URL + Service Role Key)
3. Run `backend/database/schema.sql` in Supabase SQL Editor
4. Run `backend/database/seed.sql` to load 17 patterns

### Environment Configuration
```bash
cp backend/.env.example backend/.env
```

Required environment variables:
- `OPENAI_API_KEY` - OpenAI API key (GPT-4o or GPT-5)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## DeepAgents Architecture (NEW)

### Core Concept
Instead of hardcoded routes calling AI services, we now have **autonomous agents** that:
- Use tools based on user needs
- Execute multi-step reasoning loops
- Delegate to specialized subagents
- Track state across interactions

### Agent System Structure
```
backend/src/agent/
├── types.ts                        # Core types (AgentState, Tool, Middleware)
├── executor.ts                     # Agent execution loop (like LangGraph)
├── factory.ts                      # createDeepAgent() factory
├── index.ts                        # Exports
└── middleware/                     # Composable capabilities
    ├── pattern-recognition.ts      # identify_pattern tool
    ├── socratic-tutor.ts          # generate_hint tool
    ├── knowledge-tracker.ts       # update_mastery, get_progress tools
    └── subagents.ts               # task tool (delegation)
```

### Factory Pattern - createDeepAgent()

**File:** `backend/src/agent/factory.ts`

```typescript
const agent = createDeepAgent({
  systemPrompt: 'You are a coding interview tutor...',
  middleware: [
    new PatternRecognitionMiddleware(),  // Adds identify_pattern tool
    new SocraticTutorMiddleware(),      // Adds generate_hint tool
    new KnowledgeTrackerMiddleware(),   // Adds update_mastery, get_progress
    new SubAgentMiddleware({            // Adds task tool for delegation
      subagents: [...]
    }),
  ],
  debug: true,
});

// Agent autonomously uses tools
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Help me with two-sum' }]
});
```

### Middleware System

Each middleware can:
- **Provide tools** via `getTools()`
- **Hook into execution** via `beforeModelCall/afterModelCall`
- **Extend system prompt** via `getSystemPrompt()`
- **Initialize state** via `initializeState()`

**Execution Flow:**
```
1. beforeModelCall hooks run
2. Call OpenAI LLM
3. afterModelCall hooks run
4. If tool calls → execute tools → repeat
5. If no tool calls → return final response
```

### Implemented Middleware

#### 1. PatternRecognitionMiddleware
- **Tool:** `identify_pattern`
- **Purpose:** Analyze problems and identify algorithmic patterns
- **Autonomous:** Agent calls this when user describes a problem

#### 2. SocraticTutorMiddleware
- **Tool:** `generate_hint`
- **Purpose:** Generate progressive hints (5 levels: clarifying → consequence)
- **Adaptive:** Adjusts difficulty based on student mastery

#### 3. KnowledgeTrackerMiddleware
- **Tools:** `update_mastery`, `get_progress`, `get_recommendations`
- **Purpose:** Bayesian knowledge tracing and progress monitoring
- **Persistent:** Updates Supabase database

#### 4. SubAgentMiddleware
- **Tool:** `task`
- **Purpose:** Delegate to specialized subagents (code-reviewer, pattern-expert)
- **Isolated:** Each subagent has separate context window

## API Endpoints

### NEW: Agent Endpoint
**`POST /api/agent/chat`** - Main conversational interface

**Replaces:**
- ❌ `POST /api/ai/identify-pattern` (deprecated)
- ❌ `POST /api/ai/hint` (deprecated)
- ❌ `POST /api/ai/stream/*` (deprecated)

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Help me solve two-sum" }
  ],
  "context": {
    "problemId": "uuid",
    "patternId": "uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "role": "assistant",
      "content": "Let me identify the pattern... This is a Two Pointers problem!"
    }
  ],
  "metadata": {
    "toolsUsed": 2,
    "identifiedPatterns": [...],
    "hintsGiven": [...],
    "knowledgeUpdates": [...]
  }
}
```

### Legacy Endpoints (Still Available)
- `GET /health` - Health check
- `GET /api/patterns` - List all patterns
- `GET /api/patterns/:id` - Get pattern details
- `POST /api/submissions` - Submit code
- `GET /api/progress` - Progress overview

## Development Workflow

### Adding New Agent Capabilities

**Old way (deprecated):**
```typescript
// ❌ Create service class, route, validation, wire manually
class NewService { ... }
router.post('/new-feature', async (req, res) => { ... });
```

**New way:**
```typescript
// ✅ Create middleware class
class NewFeatureMiddleware implements AgentMiddleware {
  getTools() {
    return [{
      name: 'new_tool',
      description: '...',
      parameters: { ... },
      execute: async (args, state) => {
        // Tool logic
        return result;
      }
    }];
  }

  getSystemPrompt() {
    return 'You have access to new_tool...';
  }
}

// Use it
const agent = createDeepAgent({
  middleware: [...existing, new NewFeatureMiddleware()],
});
```

### Modifying Agent Behavior

**System prompts:** Edit `backend/src/routes/agent.ts` main system prompt

**Tool prompts:** Edit individual middleware files:
- `agent/middleware/pattern-recognition.ts` - Pattern identification
- `agent/middleware/socratic-tutor.ts` - Hint generation
- `agent/middleware/knowledge-tracker.ts` - Progress tracking

**AI models:** Edit `backend/src/config/index.ts` → `OPENAI_MODEL`

### Database Changes
1. Modify `backend/database/schema.sql`
2. Update `backend/database/seed.sql` if needed
3. Re-run both scripts in Supabase SQL Editor

## Agent Execution Example

```
User: "Help me solve two-sum problem"

Agent Loop:
  [Iteration 1]
  → Agent reasoning: "I should identify the pattern first"
  → Tool call: identify_pattern({ problemDescription: "..." })
  → Tool result: { primaryPattern: "Two Pointers", confidence: 0.98 }

  [Iteration 2]
  → Agent reasoning: "Let me check their progress"
  → Tool call: get_progress()
  → Tool result: { patterns: [...], Two Pointers mastery: 0.4 }

  [Iteration 3]
  → Agent reasoning: "They need a level 2 hint"
  → Tool call: generate_hint({ level: 2, mastery: 0.4 })
  → Tool result: { question: "How does the sorted array help?" }

  [Iteration 4]
  → Agent reasoning: "I have all info, let me respond"
  → No more tool calls
  → Final response to user

User sees: "This is a Two Pointers problem! Since you're practicing,
here's a hint: How does the sorted array help?"
```

## Key Architectural Differences

### Before (Traditional REST)
```
Request → Route → Service → AI API → Response
```
- Single AI call per request
- Developer decides what to call
- No multi-step reasoning
- Stateless

### After (DeepAgents)
```
Request → Agent → Middleware Stack → Tool Loop → Response
                     ↓
              [Autonomous Tool Usage]
                ├─ Pattern Recognition
                ├─ Hint Generation
                ├─ Knowledge Tracking
                └─ Subagent Delegation
```
- Multi-step reasoning loops
- Agent decides autonomously
- Composable middleware
- Stateful execution

## Testing Agent System

```bash
# Start server
npm run dev

# Test agent endpoint
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Find two numbers in sorted array that sum to target"
      }
    ]
  }'
```

**Expected behavior:**
1. Agent identifies pattern autonomously
2. Checks student progress
3. Generates appropriate hint
4. Returns comprehensive response
5. Metadata shows all tools used

## Troubleshooting

**Port already in use:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Database connection error:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check Supabase project is running
- Ensure schema/seed scripts were executed

**AI errors:**
- Check `OPENAI_API_KEY` is valid
- Verify model is `gpt-4o` or `gpt-5`
- Check OpenAI account has credits

**Agent not using tools:**
- Check `debug: true` in agent creation
- Review console logs for tool execution
- Verify middleware is registered correctly
- Check system prompts describe tools clearly

**TypeScript errors:**
- Run `npm run build` to see full errors
- Check strict mode compliance
- Verify all imports use correct paths

## Important Files

### Agent System
- `backend/src/agent/executor.ts:71` - Main agent loop
- `backend/src/agent/factory.ts:39` - createDeepAgent factory
- `backend/src/agent/types.ts:26` - AgentMiddleware interface
- `backend/src/routes/agent.ts:38` - Agent HTTP endpoint

### Middleware
- `backend/src/agent/middleware/pattern-recognition.ts:25` - Pattern tool
- `backend/src/agent/middleware/socratic-tutor.ts:32` - Hint tool
- `backend/src/agent/middleware/knowledge-tracker.ts:30` - Progress tools
- `backend/src/agent/middleware/subagents.ts:67` - Delegation tool

### Configuration
- `backend/src/config/index.ts:33` - Environment validation
- `backend/src/config/supabase.ts:15` - Database client

### Documentation
- `DEEPAGENTS_ARCHITECTURE.md` - Comprehensive architecture guide
- `backend/README.md` - Quick start guide

## Next Steps for Developers

1. **Read** `DEEPAGENTS_ARCHITECTURE.md` for deep understanding
2. **Experiment** with creating custom middleware
3. **Test** agent behavior with different user inputs
4. **Monitor** tool usage in debug mode
5. **Optimize** prompts based on agent performance

## Migration Notes

**For Frontend:**
- Switch from multiple endpoints to single `/api/agent/chat`
- Support multi-turn conversations
- Handle metadata in responses

**For Backend:**
- Create middleware instead of services
- Let agent orchestrate instead of manual routing
- Think in terms of tools, not functions
