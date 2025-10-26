# DeepAgents → AlgoMentor Architecture Mapping

**Quick Reference Guide**: How DeepAgents patterns translate to AlgoMentor backend

---

## 1. Factory Pattern

### DeepAgents
```python
# deepagents/graph.py
def create_deep_agent(
    model: str | BaseChatModel | None = None,
    tools: Sequence[BaseTool | Callable | dict[str, Any]] | None = None,
    middleware: Sequence[AgentMiddleware] = (),
    system_prompt: str | None = None,
    # ...
) -> CompiledStateGraph:
    if model is None:
        model = get_default_model()

    deepagent_middleware = [
        TodoListMiddleware(),
        FilesystemMiddleware(long_term_memory=use_longterm_memory),
        SubAgentMiddleware(...),
        # ...
    ]

    return create_agent(model, tools, middleware=deepagent_middleware)
```

### AlgoMentor Equivalent
```typescript
// src/app.ts
export function createApp(options: AppOptions = {}): Application {
  const app = express();

  // Setup middleware stack (like DeepAgents)
  setupMiddleware(app, options);
  setupRoutes(app);
  setupErrorHandlers(app);

  return app;
}

// src/services/ai/index.ts
export class AIServiceFactory {
  constructor(config: AIServiceConfig) {
    this.config = {
      model: config.model || 'claude-sonnet-4-5-20250929',
      maxTokens: config.maxTokens || 20000,
      // ... defaults
    };
    this.client = new Anthropic({ apiKey: this.config.apiKey });
  }

  createPatternRecognizer() {
    return new PatternRecognitionService(this.client, this.config);
  }

  createHintGenerator() {
    return new HintGeneratorService(this.client, this.config);
  }
}
```

**Mapping**:
- `create_deep_agent()` → `createApp()` + `AIServiceFactory`
- `get_default_model()` → `getDefaultModelConfig()`
- `tools` parameter → Service methods
- `middleware` parameter → Express middleware

---

## 2. Middleware Architecture

### DeepAgents
```python
# Middleware stack
deepagent_middleware = [
    TodoListMiddleware(),           # Planning
    FilesystemMiddleware(),         # File operations
    SubAgentMiddleware(),           # Sub-agent spawning
    SummarizationMiddleware(),      # Context management
    AnthropicPromptCachingMiddleware(), # Optimization
    PatchToolCallsMiddleware(),     # Error handling
]

# Middleware interface
class AgentMiddleware:
    tools: list[BaseTool] = []

    def before_agent(self, state, runtime) -> dict | None:
        pass

    def after_agent(self, state, runtime) -> dict | None:
        pass
```

### AlgoMentor Equivalent
```typescript
// src/middleware/index.ts
export function setupMiddleware(app: Application, options: AppOptions) {
  // Security & parsing (like base middleware)
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Logging (like DeepAgents debug mode)
  app.use(requestLogger);

  // Context injection (like ToolRuntime)
  app.use(contextMiddleware);

  // Authentication
  app.use(authenticate);

  // Custom middleware (extensibility)
  if (options.middleware) {
    options.middleware.forEach(mw => app.use(mw));
  }
}

// Express middleware signature
type Middleware = (req: Request, res: Response, next: NextFunction) => void;
```

**Mapping**:
- `TodoListMiddleware` → Planning service (not middleware)
- `FilesystemMiddleware` → Database repositories
- `SubAgentMiddleware` → Service composition pattern
- `SummarizationMiddleware` → Token management in AI services
- Express middleware = Request/response pipeline

**Key Difference**:
- DeepAgents: Middleware modifies AI agent behavior
- AlgoMentor: Middleware handles HTTP request/response

---

## 3. Tool → Service Pattern

### DeepAgents Tool
```python
# deepagents/middleware/filesystem.py
@tool(description="Read file contents")
def read_file(
    runtime: ToolRuntime[None, FilesystemState],
    file_path: str,
    offset: int = 0,
    limit: int = 2000
) -> str:
    state = runtime.state
    files = state.get("files", {})

    if file_path not in files:
        return f"Error: File {file_path} not found"

    file_data = files[file_path]
    content = file_data["content"]

    return format_content_with_line_numbers(content, start_line=offset)
```

### AlgoMentor Service Method
```typescript
// src/services/ai/hint-generator.ts
export class HintGeneratorService {
  constructor(
    private client: Anthropic,
    private config: Required<AIServiceConfig>
  ) {}

  async generateHint(context: HintContext): Promise<{
    hint: string;
    nextLevel: number;
    shouldRevealSolution: boolean;
  }> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 500,
      messages: [{ role: 'user', content: this.buildHintPrompt(context) }]
    });

    return {
      hint: response.content[0].text,
      nextLevel: context.hintLevel + 1,
      shouldRevealSolution: context.hintLevel >= 4
    };
  }

  private buildHintPrompt(context: HintContext): string {
    // Prompt engineering logic
  }
}
```

**Mapping**:
- `@tool` decorator → Service class method
- `ToolRuntime` parameter → Constructor-injected dependencies
- Tool return value → Method return type
- Tool description → Method JSDoc comment

---

## 4. State Management

### DeepAgents State
```python
# deepagents/middleware/filesystem.py
class FileData(TypedDict):
    content: list[str]
    created_at: str
    modified_at: str

class FilesystemState(AgentState):
    files: Annotated[dict[str, FileData], _file_data_reducer]

def _file_data_reducer(left, right):
    """Merge file updates with support for deletions"""
    if left is None:
        return {k: v for k, v in right.items() if v is not None}

    result = {**left}
    for key, value in right.items():
        if value is None:
            result.pop(key, None)
        else:
            result[key] = value
    return result
```

### AlgoMentor Database State
```typescript
// prisma/schema.prisma
model KnowledgeState {
  id                   String   @id @default(uuid())
  userId               String
  patternId            String
  masteryProbability   Float    @default(0.1)
  lastPracticed        DateTime @default(now())
  problemsSolved       Int      @default(0)
  problemsAttempted    Int      @default(0)
  status               String   @default("Locked")

  @@unique([userId, patternId])
}

// src/services/learning/knowledge-tracer.ts
export class KnowledgeTracerService {
  async updateKnowledge(update: KnowledgeUpdate) {
    const current = await this.db.knowledgeState.findUnique(...);

    let newMastery = current?.masteryProbability || 0.1;

    if (update.solved && update.hintsUsed === 0) {
      newMastery += 0.2;
    } else if (update.solved && update.hintsUsed > 0) {
      newMastery += 0.1;
    } else {
      newMastery -= 0.15;
    }

    await this.db.knowledgeState.upsert({
      where: { userId_patternId: { userId, patternId } },
      update: { masteryProbability: newMastery, ... },
      create: { ... }
    });
  }
}
```

**Mapping**:
- `TypedDict` → TypeScript interface + Prisma model
- State reducer → Service method with update logic
- In-memory state → PostgreSQL database
- State annotations → Database constraints

---

## 5. Runtime Context

### DeepAgents ToolRuntime
```python
# LangChain runtime context
class ToolRuntime:
    state: AgentState
    store: BaseStore | None
    config: RunnableConfig
    tool_call_id: str | None

# Tool with runtime access
@tool
def ls(runtime: ToolRuntime[None, FilesystemState], path: str | None = None):
    state = runtime.state
    files = state.get("files", {})
    # ... access state
```

### AlgoMentor Request Context
```typescript
// src/middleware/context.ts
export interface RequestContext {
  requestId: string;
  userId?: string;
  logger: Logger;
  db: PrismaClient;
  startTime: number;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

// Usage in controller
export class ProblemController {
  async getRecommended(req: Request, res: Response) {
    const userId = req.context.userId!;
    const logger = req.context.logger;
    const db = req.context.db;

    logger.info('Fetching recommended problem', { userId });
    const problem = await db.problem.findFirst({ ... });
  }
}
```

**Mapping**:
- `ToolRuntime` → `RequestContext`
- `runtime.state` → `req.context.db` (persistent state)
- `runtime.store` → Database (PostgreSQL)
- `runtime.config` → Environment config

---

## 6. Type Safety

### DeepAgents (Python)
```python
# pyproject.toml
[tool.mypy]
strict = true
disallow_any_generics = false

# Type hints everywhere
def create_file_data(
    content: str | list[str],
    *,
    created_at: str | None = None,
) -> FileData:
    lines = content.split("\n") if isinstance(content, str) else content
    return {
        "content": lines,
        "created_at": created_at or datetime.now(UTC).isoformat(),
        "modified_at": datetime.now(UTC).isoformat(),
    }
```

### AlgoMentor (TypeScript)
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}

// Type safety everywhere
interface FileData {
  content: string[];
  createdAt: string;
  modifiedAt: string;
}

function createFileData(
  content: string | string[],
  options?: { createdAt?: string }
): FileData {
  const lines = typeof content === 'string' ? content.split('\n') : content;
  const now = new Date().toISOString();

  return {
    content: lines,
    createdAt: options?.createdAt || now,
    modifiedAt: now,
  };
}
```

**Mapping**:
- `mypy strict` → `tsconfig strict`
- `TypedDict` → TypeScript `interface`
- `| None` → `| undefined` or `?` optional
- Python type hints → TypeScript types

---

## 7. Validation

### DeepAgents
```python
# deepagents/middleware/filesystem.py
def _validate_path(path: str, *, allowed_prefixes: Sequence[str] | None = None) -> str:
    # Reject paths with traversal attempts
    if ".." in path or path.startswith("~"):
        msg = f"Path traversal not allowed: {path}"
        raise ValueError(msg)

    # Normalize path
    normalized = os.path.normpath(path)
    normalized = normalized.replace("\\", "/")

    if not normalized.startswith("/"):
        normalized = f"/{normalized}"

    # Check allowed prefixes
    if allowed_prefixes is not None and not any(normalized.startswith(prefix) for prefix in allowed_prefixes):
        msg = f"Path must start with one of {allowed_prefixes}: {path}"
        raise ValueError(msg)

    return normalized
```

### AlgoMentor
```typescript
// src/middleware/validation.ts
import { z, ZodSchema } from 'zod';

const SubmissionSchema = z.object({
  problemId: z.string().uuid(),
  code: z.string().min(1).max(10000),
  language: z.enum(['Java', 'Python', 'JavaScript']),
});

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
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError('Validation failed', 400, error.errors));
      }
    }
  };
}

// Usage
router.post('/submit', validate({ body: SubmissionSchema }), controller.submit);
```

**Mapping**:
- Manual validation → Zod schema validation
- `ValueError` → `AppError` with 400 status
- Function validation → Middleware validation
- Runtime checks → Schema parsing

---

## 8. Error Handling

### DeepAgents
```python
# Returns error strings from tools
def read_file(runtime, file_path: str) -> str:
    if file_path not in state["files"]:
        return f"Error: File {file_path} not found"

    return content

# Or raises exceptions
def _validate_path(path: str) -> str:
    if ".." in path:
        raise ValueError(f"Path traversal not allowed: {path}")
```

### AlgoMentor
```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// src/middleware/error-handler.ts
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

  // Unexpected errors
  req.context.logger.error('Unexpected error', { err });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}

// Usage in service
async getById(id: string): Promise<Problem> {
  const problem = await this.db.problem.findUnique({ where: { id } });

  if (!problem) {
    throw new AppError('Problem not found', 404);
  }

  return problem;
}
```

**Mapping**:
- Error strings → `AppError` exceptions
- `ValueError` → `AppError` with 400 status
- No centralized handler → Express error middleware
- Tool-level errors → Service-level errors

---

## 9. Async Patterns

### DeepAgents
```python
# Supports both sync and async
def create_deep_agent(...) -> CompiledStateGraph:
    # Returns graph that supports:
    agent.invoke(...)        # Sync
    await agent.ainvoke(...) # Async
    agent.stream(...)        # Sync streaming
    await agent.astream(...) # Async streaming
```

### AlgoMentor
```typescript
// All async by default (Node.js is async)
export class AIServiceFactory {
  async generateHint(context: HintContext): Promise<HintResponse> {
    const response = await this.client.messages.create({...});
    return this.parseResponse(response);
  }
}

// Controller with async/await
export class ProblemController {
  async getRecommended(req: Request, res: Response) {
    const problem = await this.service.getRecommended(req.context.userId);
    res.json({ success: true, data: problem });
  }
}

// Async error handling wrapper
export const asyncHandler = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

**Mapping**:
- `invoke` / `ainvoke` → All methods are async by default
- Sync/async duality → Single async API (Node.js convention)
- Streaming → WebSocket or SSE (Server-Sent Events)

---

## 10. Testing Structure

### DeepAgents
```
tests/
├── test_deepagents.py               # Core tests
├── test_filesystem_middleware.py    # Filesystem tool tests
├── test_subagent_middleware.py      # Sub-agent tests
├── test_hitl.py                     # Human-in-the-loop tests
└── utils.py                         # Test utilities

# Test utilities
def assert_all_deepagent_qualities(agent):
    assert "todos" in agent.state_channels
    assert "files" in agent.state_channels
    assert has_tool(agent, "write_todos")
    assert has_tool(agent, "ls")
    # ...
```

### AlgoMentor
```
tests/
├── unit/
│   ├── services/
│   │   ├── ai.test.ts
│   │   ├── knowledge-tracer.test.ts
│   │   └── spaced-repetition.test.ts
│   ├── repositories/
│   │   └── problem.test.ts
│   └── utils/
│       └── validators.test.ts
├── integration/
│   ├── api/
│   │   ├── auth.test.ts
│   │   ├── problems.test.ts
│   │   └── submissions.test.ts
│   └── learning/
│       └── knowledge-tracing.test.ts
└── helpers/
    ├── setup.ts
    ├── factories.ts
    └── mocks.ts

// tests/helpers/factories.ts
export class TestDataFactory {
  static createUser(overrides?: Partial<User>): User {
    return {
      id: uuid(),
      email: 'test@example.com',
      name: 'Test User',
      ...overrides,
    };
  }

  static createProblem(overrides?: Partial<Problem>): Problem {
    // ...
  }
}

// tests/integration/api/problems.test.ts
describe('Problem API', () => {
  let app: Application;
  let db: PrismaClient;

  beforeAll(async () => {
    app = createApp({ debug: false });
    db = new PrismaClient();
  });

  it('should return recommended problem', async () => {
    const user = await TestDataFactory.createUser();
    const token = generateToken(user.id);

    const response = await request(app)
      .get('/api/v1/problems/recommended')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

**Mapping**:
- `pytest` → `jest`
- Test utilities → Test factories and helpers
- Integration tests → API endpoint tests
- Mocking → Jest mocks

---

## 11. Configuration & Defaults

### DeepAgents
```python
# deepagents/graph.py
def get_default_model() -> ChatAnthropic:
    return ChatAnthropic(
        model_name="claude-sonnet-4-5-20250929",
        max_tokens=20000,
    )

# deepagents/middleware/filesystem.py
MAX_LINE_LENGTH = 2000
DEFAULT_READ_OFFSET = 0
DEFAULT_READ_LIMIT = 2000
EMPTY_CONTENT_WARNING = "System reminder: File exists but has empty contents"
```

### AlgoMentor
```typescript
// src/config/defaults.ts
export const DEFAULT_AI_MODEL = 'claude-sonnet-4-5-20250929';
export const DEFAULT_MAX_TOKENS = 20000;
export const DEFAULT_TEMPERATURE = 0.7;

export const SPACED_REPETITION = {
  INITIAL_INTERVAL: 1,      // days
  SECOND_INTERVAL: 3,
  THIRD_INTERVAL: 7,
  MIN_EASE_FACTOR: 1.3,
  DEFAULT_EASE_FACTOR: 2.5,
};

export const KNOWLEDGE_TRACING = {
  INITIAL_MASTERY: 0.1,     // P(L0)
  STRONG_EVIDENCE: 0.2,     // Solved without hints
  WEAK_EVIDENCE: 0.1,       // Solved with hints
  FORGETTING: -0.15,        // Failed attempt
  MASTERY_THRESHOLD: 0.8,
};

// src/config/index.ts
const EnvSchema = z.object({
  AI_MODEL: z.string().default(DEFAULT_AI_MODEL),
  AI_MAX_TOKENS: z.string().transform(Number).default('20000'),
  // ...
});
```

**Mapping**:
- Module-level constants → Centralized constants file
- Function defaults → Config object defaults
- Environment-based → `.env` + validation

---

## 12. Documentation Style

### DeepAgents
```python
def _format_content_with_line_numbers(
    content: str | list[str],
    *,
    format_style: Literal["pipe", "tab"] = "pipe",
    start_line: int = 1,
) -> str:
    r"""Format file content with line numbers for display.

    Converts file content to a numbered format similar to `cat -n` output,
    with support for two different formatting styles.

    Args:
        content: File content as a string or list of lines.
        format_style: Format style for line numbers:
            - `"pipe"`: Compact format like `"1|content"`
            - `"tab"`: Right-aligned format like `"     1\tcontent"`
        start_line: Starting line number (default: 1).

    Returns:
        Formatted content with line numbers prepended to each line.

    Example:
        ```python
        content = "Hello\nWorld"
        format_content_with_line_numbers(content, format_style="pipe")
        # Returns: "1|Hello\n2|World"
        ```
    """
```

### AlgoMentor
```typescript
/**
 * Format file content with line numbers for display
 *
 * Converts file content to a numbered format similar to `cat -n` output,
 * with support for two different formatting styles.
 *
 * @param content - File content as a string or array of lines
 * @param options - Formatting options
 * @param options.formatStyle - Format style: "pipe" (1|content) or "tab" (     1\tcontent)
 * @param options.startLine - Starting line number (default: 1)
 * @returns Formatted content with line numbers prepended
 *
 * @example
 * ```typescript
 * const content = "Hello\nWorld";
 * formatContentWithLineNumbers(content, { formatStyle: "pipe" });
 * // Returns: "1|Hello\n2|World"
 * ```
 */
export function formatContentWithLineNumbers(
  content: string | string[],
  options: {
    formatStyle?: 'pipe' | 'tab';
    startLine?: number;
  } = {}
): string {
  const { formatStyle = 'pipe', startLine = 1 } = options;
  // ...
}
```

**Mapping**:
- Google-style docstrings → JSDoc comments
- `Args:` → `@param`
- `Returns:` → `@returns`
- `Example:` → `@example`

---

## Summary Table

| DeepAgents | AlgoMentor | Purpose |
|------------|------------|---------|
| `create_deep_agent()` | `createApp()` + `AIServiceFactory` | Factory pattern |
| `get_default_model()` | `getDefaultModelConfig()` | Default configuration |
| Middleware stack | Express middleware | Request pipeline |
| `@tool` decorator | Service class methods | Business logic |
| `ToolRuntime` | `RequestContext` | Runtime context |
| State graph | PostgreSQL + Services | State management |
| `TypedDict` | TypeScript interface + Prisma | Type definitions |
| `_validate_path()` | Zod schemas | Validation |
| LangGraph store | Database repositories | Data persistence |
| `mypy strict` | `tsconfig strict` | Type safety |
| pytest | Jest | Testing |
| Ruff | ESLint + Prettier | Linting |
| Google docstrings | JSDoc comments | Documentation |

---

## Key Takeaways

✅ **Same Philosophy, Different Implementation**
- DeepAgents: AI agent framework (Python, LangGraph)
- AlgoMentor: REST API backend (TypeScript, Express)

✅ **Shared Principles**
- Factory pattern for clean instantiation
- Middleware composition for extensibility
- Type safety throughout (strict mode)
- Service layer for business logic
- Comprehensive testing
- Well-documented code

✅ **Adaptations for Web Backend**
- Tools → Service methods
- State graph → Database + ORM
- Middleware → HTTP middleware
- Runtime context → Request context
- LangChain → Anthropic SDK directly

---

**Use this guide when implementing AlgoMentor to maintain the same code quality and architectural patterns as DeepAgents!**
