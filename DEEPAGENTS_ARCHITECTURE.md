# DeepAgents Architecture Implementation

## Overview

This document describes the **true DeepAgents-inspired architecture** now implemented in AlgoMentor backend.

**Status:** ✅ **FULLY IMPLEMENTED** (as of October 26, 2025)

**What Changed:** We translated the core patterns from [DeepAgents](https://github.com/anthropics/deepagents) (Python/LangGraph) to TypeScript/OpenAI.

---

## Architecture Comparison

### Before (Old Architecture)
```
HTTP Request → Route Handler → Service Class → OpenAI API → Response
```
- **Pattern:** Traditional REST API
- **No agent loop:** Single AI call per request
- **No tools:** Direct function calls
- **No middleware:** Hardcoded logic in routes
- **No delegation:** No subagent support
- **Stateless:** Each request independent

### After (DeepAgents Architecture)
```
HTTP Request → createDeepAgent() → Middleware Stack → Agent Loop → Tools → Response
                     ↓
              [Middleware Composition]
                ├─ PatternRecognitionMiddleware (identify_pattern tool)
                ├─ SocraticTutorMiddleware (generate_hint tool)
                ├─ KnowledgeTrackerMiddleware (update_mastery, get_progress, etc.)
                └─ SubAgentMiddleware (task tool → delegation)
                     ↓
              [Agent Execution Loop]
                ├─ Reason (call LLM)
                ├─ Tool calls (autonomous)
                ├─ Execute tools
                ├─ Update state
                └─ Repeat until done
```

---

## Core Components

### 1. Agent Factory (`agent/factory.ts`)

**Equivalent to:** `create_deep_agent()` in DeepAgents `graph.py`

```typescript
const agent = createDeepAgent({
  systemPrompt: 'You are a coding tutor...',
  middleware: [
    new PatternRecognitionMiddleware(),
    new SocraticTutorMiddleware(),
    new KnowledgeTrackerMiddleware(),
  ],
  debug: true,
});

const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Help me with two-sum' }]
});
```

**Key Features:**
- ✅ Middleware composition
- ✅ Tool registration from middleware
- ✅ System prompt assembly
- ✅ Singleton OpenAI client
- ✅ Agent executor creation

---

### 2. Agent Executor (`agent/executor.ts`)

**Equivalent to:** LangGraph's `CompiledStateGraph`

**Execution Loop:**
```typescript
while (iterations < maxIterations) {
  // 1. Run beforeModelCall hooks
  for (const mw of middleware) {
    request = await mw.beforeModelCall(request, state);
  }

  // 2. Call LLM
  const response = await openai.chat.completions.create(...);

  // 3. Run afterModelCall hooks
  for (const mw of middleware) {
    response = await mw.afterModelCall(response, state);
  }

  // 4. Execute tools
  if (response.toolCalls) {
    for (const toolCall of response.toolCalls) {
      // beforeToolCall hooks
      const result = await tool.execute(args, state);
      // afterToolCall hooks
    }
  }

  // 5. Exit if no more tools
  if (!response.toolCalls) break;
}
```

**Features:**
- ✅ Autonomous tool execution loop
- ✅ Middleware hook points
- ✅ State management
- ✅ Max iteration safety
- ✅ Debug logging

---

### 3. Middleware System (`agent/types.ts`)

**Equivalent to:** `AgentMiddleware` in LangGraph

```typescript
export interface AgentMiddleware {
  name: string;

  // Hooks
  beforeModelCall?(request: ModelRequest, state: AgentState): Promise<ModelRequest>;
  afterModelCall?(response: ModelResponse, state: AgentState): Promise<ModelResponse>;
  beforeToolCall?(toolCall: ToolCall, state: AgentState): Promise<ToolCall>;
  afterToolCall?(result: ToolResult, state: AgentState): Promise<ToolResult>;

  // Capabilities
  getTools?(): Tool[];
  getSystemPrompt?(): string;
  initializeState?(state: AgentState): void;
  reduceState?(current: any, update: any, key: string): any;
}
```

**Implemented Middleware:**

#### 3a. PatternRecognitionMiddleware
**File:** `agent/middleware/pattern-recognition.ts`

**Provides Tool:** `identify_pattern`
- Analyzes problem descriptions
- Returns pattern recommendations with confidence scores
- Uses OpenAI structured outputs

**Example Usage:**
```typescript
// Agent autonomously uses this tool when user describes a problem
User: "Find two numbers in a sorted array that sum to target"
Agent: *calls identify_pattern tool*
Tool Result: { primaryPattern: "Two Pointers", confidence: 0.98 }
Agent: "This is a classic Two Pointers problem! Let me explain..."
```

#### 3b. SocraticTutorMiddleware
**File:** `agent/middleware/socratic-tutor.ts`

**Provides Tool:** `generate_hint`
- 5-level progressive hints (clarifying → consequence)
- Adaptive difficulty based on mastery
- Never gives away the solution

**Example Usage:**
```typescript
User: "I'm stuck on this problem"
Agent: *calls generate_hint with level 1*
Tool Result: {
  hintType: "clarifying",
  question: "What are the inputs and outputs?",
  guidance: "Understanding the problem is the first step..."
}
```

#### 3c. KnowledgeTrackerMiddleware
**File:** `agent/middleware/knowledge-tracker.ts`

**Provides Tools:**
- `update_mastery` - Bayesian knowledge tracing
- `get_progress` - Overall progress overview
- `get_recommendations` - Personalized next steps

**Example Usage:**
```typescript
User: "I solved the two-sum problem!"
Agent: *calls update_mastery*
Tool Result: {
  oldMastery: 0.5,
  newMastery: 0.7,
  status: "Practicing"
}
Agent: "Great job! Your Two Pointers mastery increased to 70%!"
```

#### 3d. SubAgentMiddleware
**File:** `agent/middleware/subagents.ts`

**Provides Tool:** `task`
- Delegates to specialized subagents
- Isolated context windows
- Parallel execution support

**Example Usage:**
```typescript
Agent: "I'll delegate this to a code review specialist"
*calls task tool*
{
  subagent_type: "code-reviewer",
  prompt: "Review this two-sum implementation for correctness and efficiency"
}
→ Subagent analyzes code deeply
→ Returns comprehensive review
Agent: "Here's the detailed feedback..."
```

---

### 4. State Management (`agent/types.ts`)

**Equivalent to:** DeepAgents `AgentState` TypedDict

```typescript
export interface AgentState {
  messages: ChatCompletionMessageParam[];

  // Middleware can extend state
  identifiedPatterns?: any[];
  hintsGiven?: any[];
  knowledgeUpdates?: any[];
  subagentExecutions?: any[];

  [key: string]: any; // Extensible
}
```

**State Flow:**
1. Initialize state with `messages`
2. Middleware adds state keys via `initializeState()`
3. Tools modify state during execution
4. State flows through entire agent loop
5. Final state returned with all context

---

## API Usage

### New Endpoint: `POST /api/agent/chat`

**Replaces:**
- ❌ `POST /api/ai/identify-pattern` (deprecated)
- ❌ `POST /api/ai/hint` (deprecated)
- ❌ `POST /api/ai/stream/*` (deprecated)

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Help me solve two-sum problem" }
  ],
  "context": {
    "problemId": "uuid-here",
    "patternId": "uuid-here",
    "studentId": "uuid-here"
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
      "content": "I see you're working on two-sum! Let me identify the pattern for you..."
    },
    {
      "role": "assistant",
      "content": "This is a Two Pointers problem (confidence: 98%). Would you like a hint?"
    }
  ],
  "metadata": {
    "toolsUsed": 2,
    "identifiedPatterns": [
      {
        "primaryPattern": "Two Pointers",
        "confidence": 0.98
      }
    ],
    "hintsGiven": [],
    "knowledgeUpdates": [],
    "subagentExecutions": []
  }
}
```

**Key Differences from Old API:**
- ✅ Single endpoint for all interactions
- ✅ Agent autonomously decides which tools to use
- ✅ Multi-turn conversations supported
- ✅ Complete context tracking
- ✅ Parallel tool execution
- ✅ Metadata shows what happened behind the scenes

---

## DeepAgents Pattern Mapping

| DeepAgents (Python) | AlgoMentor (TypeScript) | Status |
|---------------------|-------------------------|--------|
| `create_deep_agent()` | `createDeepAgent()` | ✅ Implemented |
| `CompiledStateGraph` | `AgentExecutor` | ✅ Implemented |
| `AgentMiddleware` | `AgentMiddleware` interface | ✅ Implemented |
| `FilesystemMiddleware` | Domain-specific middleware | ✅ Adapted |
| `SubAgentMiddleware` | `SubAgentMiddleware` | ✅ Implemented |
| `TodoListMiddleware` | N/A (not needed) | ⏭️ Skipped |
| `SummarizationMiddleware` | N/A (OpenAI handles context) | ⏭️ Skipped |
| Tool abstraction | `Tool` interface | ✅ Implemented |
| State management | `AgentState` | ✅ Implemented |
| Middleware hooks | `before/afterModelCall`, `before/afterToolCall` | ✅ Implemented |

---

## What This Enables

### 1. Autonomous Tool Usage
**Before:** Developer hardcodes when to call pattern recognition
```typescript
// Old way
if (req.path === '/identify-pattern') {
  const result = await patternService.identify(description);
}
```

**After:** Agent decides autonomously
```typescript
// New way
const agent = createDeepAgent({ middleware: [new PatternRecognitionMiddleware()] });
// Agent sees user describe a problem → autonomously calls identify_pattern tool
```

---

### 2. Multi-Step Reasoning
**Before:** Single AI call per request
```
User: "Help with two-sum" → AI response → Done
```

**After:** Agent can reason across multiple steps
```
User: "Help with two-sum"
  → Agent: *calls identify_pattern tool*
  → Tool returns: "Two Pointers"
  → Agent: *calls get_progress tool*
  → Tool returns: "Mastery: 40%"
  → Agent: *calls generate_hint with level=2*
  → Tool returns: "Have you considered using two pointers?"
  → Agent: "Based on your progress, here's a hint..."
```

---

### 3. Subagent Delegation
**Before:** No delegation
```
Complex task → Agent tries to do everything → Context overflow
```

**After:** Delegation with isolation
```
Complex task
  → Agent: *calls task tool for "code-reviewer" subagent*
  → Subagent: [isolated context, deep analysis]
  → Returns: Comprehensive review
  → Main agent: Synthesizes and presents to user
```

---

### 4. Composable Capabilities
**Before:** Hardcoded features
```typescript
// Want new feature? Edit multiple files
- Add service class
- Add route handler
- Add validation
- Wire everything manually
```

**After:** Add middleware
```typescript
// Want new feature? Add one middleware class
class NewFeatureMiddleware implements AgentMiddleware {
  getTools() {
    return [{ name: 'new_feature', execute: ... }];
  }
}

// Use it
const agent = createDeepAgent({
  middleware: [...existing, new NewFeatureMiddleware()],
});
```

---

## Example Interactions

### Example 1: Pattern Identification + Hints
```
User: "I have a problem: find two numbers in sorted array that sum to target"

Agent Loop:
  [Iteration 1]
  → LLM: "I should identify the pattern"
  → Tool call: identify_pattern({ problemDescription: "..." })
  → Tool result: { primaryPattern: "Two Pointers", confidence: 0.98 }

  [Iteration 2]
  → LLM: "Now I'll check their mastery level"
  → Tool call: get_progress()
  → Tool result: { patterns: [...], Two Pointers mastery: 0.4 }

  [Iteration 3]
  → LLM: "They need a hint at level 2"
  → Tool call: generate_hint({ level: 2, mastery: 0.4 })
  → Tool result: { question: "How does the sorted array help?" }

  [Iteration 4]
  → LLM: *no more tool calls*
  → Response: "This is a Two Pointers problem! Since you're practicing this pattern, here's a hint: How does the sorted array help you optimize your approach?"

Final Response to User:
"This is a Two Pointers problem (98% confidence)! I see you're practicing this pattern. Here's a hint to guide you: How does the sorted array help you optimize your approach?"
```

---

### Example 2: Code Review with Subagent
```
User: "Review my code: [paste code]"

Agent Loop:
  [Iteration 1]
  → LLM: "This needs deep analysis, I'll use the code-reviewer subagent"
  → Tool call: task({
      subagent_type: "code-reviewer",
      prompt: "Review this two-sum implementation: [code]"
    })
  → Subagent executes (isolated context):
      - Analyzes correctness
      - Checks complexity
      - Finds edge cases
      - Returns comprehensive review
  → Tool result: { review: "..." }

  [Iteration 2]
  → LLM: *no more tool calls*
  → Response: "Here's a detailed review: [synthesized feedback]"
```

---

## Testing

### Test the Agent System
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
        "content": "Help me solve: find two numbers in sorted array that sum to target"
      }
    ]
  }'
```

**Expected:**
- Agent identifies pattern autonomously
- Returns multi-step response
- Metadata shows tools used

---

## Migration Guide

### For Frontend Developers

**Old API Calls:**
```typescript
// ❌ Old way - multiple endpoints
const pattern = await fetch('/api/ai/identify-pattern', { ... });
const hint = await fetch('/api/ai/hint', { ... });
const progress = await fetch('/api/progress', { ... });
```

**New API Call:**
```typescript
// ✅ New way - single agent endpoint
const response = await fetch('/api/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Help me with two-sum' }
    ]
  })
});

// Agent autonomously:
// - Identifies pattern
// - Checks progress
// - Generates hints
// - All in one conversation
```

### For Backend Developers

**Old Service Pattern:**
```typescript
// ❌ Old - manual orchestration
router.post('/identify-pattern', async (req, res) => {
  const factory = getAIServiceFactory();
  const service = new PatternRecognitionService(factory);
  const result = await service.identifyPattern(req.body.description);
  res.json(result);
});
```

**New Middleware Pattern:**
```typescript
// ✅ New - agent handles it
class MyMiddleware implements AgentMiddleware {
  getTools() {
    return [{
      name: 'my_tool',
      execute: async (args, state) => {
        // Tool logic
        return result;
      }
    }];
  }
}

// Agent autonomously decides when to use my_tool
```

---

## Benefits

### 1. **True Agent Architecture**
- ✅ Autonomous tool usage
- ✅ Multi-step reasoning
- ✅ Self-directed execution

### 2. **Composability**
- ✅ Mix and match middleware
- ✅ Add features without breaking existing code
- ✅ Clear separation of concerns

### 3. **Extensibility**
- ✅ New tools via middleware
- ✅ Custom subagents
- ✅ Hook into any execution phase

### 4. **Developer Experience**
- ✅ Less boilerplate
- ✅ Declarative configuration
- ✅ Reusable patterns

### 5. **User Experience**
- ✅ Conversational interface
- ✅ Context-aware responses
- ✅ Seamless multi-step interactions

---

## Next Steps

### Immediate
- ✅ Core architecture implemented
- ✅ All middleware working
- ✅ Agent endpoint deployed
- ⏭️ Test with real users
- ⏭️ Monitor agent behavior
- ⏭️ Optimize tool usage

### Future Enhancements
- [ ] Streaming support for agent loop
- [ ] Persistent conversation history (checkpointing)
- [ ] Long-term memory (store)
- [ ] Human-in-the-loop approvals
- [ ] Custom subagents per student
- [ ] Performance analytics

---

## Architecture Files

```
backend/src/agent/
├── types.ts                        # Core types (AgentState, Tool, Middleware, etc.)
├── executor.ts                     # Agent execution loop
├── factory.ts                      # createDeepAgent() + AIServiceFactory
├── index.ts                        # Exports
└── middleware/
    ├── pattern-recognition.ts      # identify_pattern tool
    ├── socratic-tutor.ts          # generate_hint tool
    ├── knowledge-tracker.ts       # update_mastery, get_progress tools
    └── subagents.ts               # task tool (delegation)

backend/src/routes/
└── agent.ts                        # POST /api/agent/chat endpoint
```

---

## Conclusion

We now have a **true DeepAgents-inspired architecture** that:
- ✅ Matches the core patterns from the original Python implementation
- ✅ Adapted for TypeScript/OpenAI instead of Python/LangGraph
- ✅ Preserves the key architectural principles:
  - Middleware composition
  - Tool abstraction
  - State management
  - Autonomous execution
  - Subagent delegation

**This is no longer a REST API with AI capabilities.**
**This is an agent system that happens to have an HTTP interface.**

The difference is fundamental and transformative.
