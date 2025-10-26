# AlgoMentor MVP Roadmap
**Target**: Pattern-based interview learning with AI assistance
**Tech**: OpenAI GPT-5, Supabase PostgreSQL, Express.js, TypeScript

---

## 🎯 MVP Scope - Core Features Only

### Phase 1: Foundation (Day 1) ✅ COMPLETED
- [x] ✅ Git repository initialized
- [x] ✅ .gitignore created
- [x] ✅ Project structure created
- [x] ✅ Package.json with dependencies
- [x] ✅ TypeScript configuration
- [x] ✅ Environment setup (.env.example)
- [x] ✅ Basic Express server running

### Phase 2: Database & AI Services (Day 2) ✅ COMPLETED
- [x] ✅ Supabase client setup
- [x] ✅ Database schema designed
- [x] ✅ Database tables created (schema.sql)
- [x] ✅ OpenAI GPT-5 service factory
- [x] ✅ Pattern recognition service
- [x] ✅ Hint generator service (Socratic)

### Phase 3: Core API Endpoints (Day 3) ✅ COMPLETED
- [x] ✅ GET /api/patterns - List coding patterns
- [x] ✅ GET /api/patterns/:id - Get pattern details
- [x] ✅ POST /api/ai/identify-pattern - AI pattern recognition
- [x] ✅ POST /api/ai/hint - Get Socratic hint
- [x] ✅ POST /api/submissions - Submit code (mock execution)
- [x] ✅ GET /api/progress - User knowledge tracking

### Phase 4: Data & Testing (Day 4) ⏳ READY FOR TESTING
- [x] ✅ Seed 12 coding patterns
- [x] ✅ Seed 5 system design concepts
- [x] ✅ Seed 2 sample problems (more can be added)
- [ ] ⏳ Test all endpoints manually (USER ACTION REQUIRED)
- [ ] ⏳ Fix bugs and edge cases (if found during testing)

---

## 📋 Feature Breakdown

### 1. Coding Pattern Learning ⭐ (PRIORITY 1)

**What**: 12 proven coding patterns (Two Pointers, Sliding Window, etc.)

**Database Tables**:
- `patterns` - Pattern metadata, templates, complexity
- `problems` - Problems tagged with patterns
- `problem_patterns` - Many-to-many relationship

**API Endpoints**:
- `GET /api/patterns` - List all patterns with progress
- `GET /api/patterns/:id` - Pattern details + code templates
- `GET /api/patterns/:id/problems` - Problems for this pattern

**Features**:
- Pattern descriptions with visual explanations
- Code templates (Java, Python, JavaScript)
- Time/Space complexity info
- Use cases and when to apply

**Status**: 🔄 IN PROGRESS

---

### 2. AI-Powered Hints ⭐ (PRIORITY 1)

**What**: Socratic questioning to guide without giving answers

**AI Service**: OpenAI GPT-5 with structured prompts

**API Endpoint**:
- `POST /api/ai/hint`
  - Input: `{ problemId, userCode, hintLevel, hintsGiven[] }`
  - Output: `{ hint, nextLevel, shouldRevealSolution }`

**Hint Levels**:
1. **Conceptual** - "What pattern might apply?"
2. **Approach** - "Think about using two pointers..."
3. **Algorithm** - High-level algorithm steps
4. **Pseudocode** - Detailed pseudocode
5. **Solution** - Partial/full code (last resort)

**Status**: 🔄 IN PROGRESS

---

### 3. Pattern Recognition ⭐ (PRIORITY 1)

**What**: AI identifies which pattern applies to a problem

**API Endpoint**:
- `POST /api/ai/identify-pattern`
  - Input: `{ problemDescription }`
  - Output: `{ primaryPattern, secondaryPatterns[], confidence, reasoning }`

**Use Case**: Help users recognize patterns in new problems

**Status**: 🔄 IN PROGRESS

---

### 4. Code Submission (Mock) ⭐ (PRIORITY 2)

**What**: Submit code, get mock results (no real execution for MVP)

**Database Table**:
- `submissions` - User code, result, timestamp

**API Endpoint**:
- `POST /api/submissions`
  - Input: `{ problemId, code, language }`
  - Output: `{ status: "Accepted", time: 100, memory: 1024 }`

**Mock Logic**: Always return "Accepted" for MVP

**Status**: 🔄 IN PROGRESS

---

### 5. Knowledge Tracking (Basic) ⭐ (PRIORITY 2)

**What**: Track which patterns user has practiced

**Database Table**:
- `knowledge_state` - Per-pattern mastery tracking

**Algorithm**: Simplified Bayesian Knowledge Tracing
- Solved without hints: +0.2 mastery
- Solved with hints: +0.1 mastery
- Failed: -0.15 mastery

**API Endpoint**:
- `GET /api/progress`
  - Output: `{ patterns: [{ name, mastery, status, problemsSolved }] }`

**Status**: 🔄 IN PROGRESS

---

### 6. System Design (Starting Point) ⭐ (PRIORITY 3)

**What**: 5 core system design concepts as patterns

**Database**: Use same `patterns` table with `type: "system_design"`

**Concepts to Include**:
1. Load Balancing
2. Caching (Redis, CDN)
3. Database Sharding
4. Message Queues
5. API Gateway

**API Endpoints**:
- `GET /api/patterns?type=system_design`
- `GET /api/patterns/:id` (works for both coding & system design)

**MVP Scope**: Read-only pattern information (no canvas for MVP)

**Status**: 🔄 IN PROGRESS

---

## 🚫 Out of Scope for MVP

- ❌ User authentication (JWT, signup/login)
- ❌ Real code execution (Judge0 integration)
- ❌ Spaced repetition (review queue)
- ❌ Mock interviews
- ❌ System design canvas (interactive drag-drop)
- ❌ Algorithm visualizations
- ❌ Progress analytics/charts
- ❌ Email notifications
- ❌ WebSocket/real-time features

---

## 📊 Database Schema (MVP)

```sql
-- Patterns (coding + system design)
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('coding', 'system_design')),
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  description TEXT NOT NULL,
  time_complexity TEXT,
  space_complexity TEXT,
  use_cases TEXT[],
  code_templates JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problems
CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  test_cases JSONB NOT NULL,
  hints TEXT[],
  optimal_solution JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problem-Pattern relationship (many-to-many)
CREATE TABLE problem_patterns (
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  PRIMARY KEY (problem_id, pattern_id)
);

-- User submissions (simplified - no user auth for MVP)
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES problems(id),
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  result TEXT NOT NULL,
  execution_time INTEGER,
  hints_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge tracking (simplified - no user auth)
CREATE TABLE knowledge_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES patterns(id),
  mastery_probability FLOAT DEFAULT 0.1,
  problems_solved INTEGER DEFAULT 0,
  problems_attempted INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Locked',
  last_practiced TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pattern_id)
);
```

---

## 🎨 Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Database**: Supabase PostgreSQL
- **AI**: OpenAI GPT-5
- **Validation**: Zod

### Key Dependencies
```json
{
  "express": "^4.18.0",
  "@supabase/supabase-js": "^2.45.0",
  "openai": "^4.75.0",
  "zod": "^3.22.4",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5"
}
```

---

## 📝 API Documentation (MVP)

### GET /health
Health check endpoint
```json
Response: { "status": "ok", "timestamp": "2025-10-26T..." }
```

### GET /api/patterns
List all patterns (coding + system design)
```json
Query: ?type=coding|system_design
Response: {
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Two Pointers",
      "type": "coding",
      "difficulty": "Beginner",
      "description": "...",
      "mastery": 0.65,
      "problemsSolved": 3
    }
  ]
}
```

### GET /api/patterns/:id
Get pattern details with code template
```json
Response: {
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Two Pointers",
    "description": "...",
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(1)",
    "useCases": ["Sorted arrays", "Finding pairs"],
    "codeTemplates": {
      "java": "public int[] twoPointers(...) { ... }",
      "python": "def two_pointers(...): ...",
      "javascript": "function twoPointers(...) { ... }"
    },
    "problems": [ /* related problems */ ]
  }
}
```

### POST /api/ai/identify-pattern
AI identifies pattern from problem description
```json
Request: {
  "problemDescription": "Given a sorted array, find two numbers that sum to target"
}

Response: {
  "success": true,
  "data": {
    "primaryPattern": "Two Pointers",
    "secondaryPatterns": ["Binary Search"],
    "confidence": 0.95,
    "reasoning": "The sorted array and need to find a pair suggests..."
  }
}
```

### POST /api/ai/hint
Get Socratic hint for problem
```json
Request: {
  "problemId": "uuid",
  "userCode": "// my attempt",
  "hintLevel": 1,
  "hintsGiven": []
}

Response: {
  "success": true,
  "data": {
    "hint": "This problem involves a sorted array. What pattern works well with sorted data?",
    "nextLevel": 2,
    "shouldRevealSolution": false
  }
}
```

### POST /api/submissions
Submit code (mock execution)
```json
Request: {
  "problemId": "uuid",
  "code": "function solution() { ... }",
  "language": "JavaScript"
}

Response: {
  "success": true,
  "data": {
    "id": "uuid",
    "status": "Accepted",
    "executionTime": 100,
    "memory": 1024,
    "message": "All test cases passed!"
  }
}
```

### GET /api/progress
Get knowledge tracking overview
```json
Response: {
  "success": true,
  "data": {
    "overallMastery": 0.45,
    "patternsMastered": 3,
    "totalPatterns": 12,
    "patterns": [
      {
        "name": "Two Pointers",
        "mastery": 0.85,
        "status": "Mastered",
        "problemsSolved": 5,
        "problemsAttempted": 6
      }
    ]
  }
}
```

---

## ✅ Definition of Done (MVP)

A feature is considered DONE when:

1. ✅ Code is written and follows TypeScript strict mode
2. ✅ Database tables exist (if needed)
3. ✅ API endpoint works (tested with curl/Postman)
4. ✅ Returns proper error messages
5. ✅ Marked as ✅ in this document

---

## 🚀 Next Steps After MVP

**Phase 2 Features** (Post-Competition):
- User authentication (Supabase Auth)
- Real code execution (Judge0)
- Spaced repetition algorithm
- Mock interview mode
- System design canvas
- Algorithm visualizations

---

**Last Updated**: 2025-10-26
**Status**: 🚧 IN PROGRESS
