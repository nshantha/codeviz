# AlgoMentor - AI-Powered Interview Mastery System

**Status**: Architecture Design Phase
**Competition**: AI Interview Prep Innovation Challenge
**Timeline**: 7 days
**Tech Stack**: TypeScript, Express.js, PostgreSQL (Supabase), OpenAI GPT-5

---

## 📚 Documentation Index

This project follows **DeepAgents**' proven architecture patterns for building robust, maintainable systems.

### Core Documents

1. **[DESIGN_DOC.md](DESIGN_DOC.md)** - Complete product specification
   - Problem statement & research
   - Learning science foundations (spaced repetition, knowledge tracing, etc.)
   - Feature specifications
   - 7-day implementation plan
   - Success metrics

2. **[BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md)** - Technical architecture
   - Project structure (DeepAgents-inspired)
   - Technology stack
   - Middleware system
   - Service layer design
   - Data models (Prisma schema)
   - API layer
   - Configuration management

3. **[DEEPAGENTS_MAPPING.md](DEEPAGENTS_MAPPING.md)** - Architecture translation guide
   - How DeepAgents patterns map to AlgoMentor
   - Factory pattern equivalents
   - Middleware architecture comparison
   - Tool → Service pattern
   - State management
   - Code examples side-by-side

4. **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Step-by-step build plan
   - Day-by-day implementation steps
   - Code snippets for each module
   - Testing instructions
   - Common issues & solutions

---

## 🎯 Project Overview

AlgoMentor is an AI-powered interview preparation system that uses:
- **Pattern-based learning** (12 coding patterns cover 87% of FAANG interviews)
- **Spaced repetition** (SM-2 algorithm to combat forgetting curve)
- **Bayesian knowledge tracing** (AI tracks your mastery per pattern)
- **Socratic AI tutoring** (Claude Sonnet 4.5 guides without giving answers)
- **Adaptive difficulty** (70-85% success zone for optimal learning)
- **System design practice** (Interactive canvas + AI feedback)

### Why It's Different

| Platform | AlgoMentor Advantage |
|----------|---------------------|
| **LeetCode** | ❌ No learning path → ✅ Pattern-based progression |
| **AlgoExpert** | ❌ No spaced repetition → ✅ SM-2 algorithm review system |
| **Design Gurus** | ❌ Static content → ✅ AI adapts to YOUR progress |
| **Anki** | ❌ No code execution → ✅ Full IDE + test runner |
| **ChatGPT** | ❌ No memory → ✅ Bayesian knowledge tracing |

---

## 🏗️ Architecture Highlights

### Inspired by DeepAgents

This backend architecture is **directly inspired** by the [DeepAgents](https://github.com/anthropics/deepagents) project, which demonstrates best practices for building AI agent systems.

**Key patterns we've adopted:**

1. **Factory Pattern** - Clean service instantiation with sensible defaults
2. **Middleware Composition** - Layered, extensible request pipeline
3. **Type Safety** - Strict TypeScript (equivalent to mypy strict mode)
4. **Service Layer** - Business logic isolated from HTTP layer
5. **Context Injection** - Runtime context passed to all services
6. **Tool-based Abstractions** - Well-defined interfaces for each capability

### Project Structure (DeepAgents-Inspired)

```
algomentor-backend/
├── src/
│   ├── app.ts                    # App factory (like create_deep_agent)
│   ├── middleware/               # Express middleware (composable)
│   ├── services/                 # Business logic (like DeepAgents tools)
│   │   ├── ai/                   # AI services (pattern recognition, hints, etc.)
│   │   ├── learning/             # Learning algorithms (knowledge tracing, spaced repetition)
│   │   └── code-execution/       # Judge0 integration
│   ├── repositories/             # Data access layer (like DeepAgents store)
│   ├── controllers/              # API controllers
│   ├── routes/                   # API routes
│   └── types/                    # TypeScript types (like TypedDict)
├── prisma/
│   └── schema.prisma             # Database schema
└── tests/
    ├── unit/
    └── integration/
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Anthropic API key
- Judge0 API key

### Setup (5 minutes)

```bash
# 1. Clone and install
git clone <repo>
cd algomentor-backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Setup database
npx prisma migrate dev
npm run seed

# 4. Start development server
npm run dev

# 5. Test
curl http://localhost:3000/health
```

### Development Workflow

```bash
# Run dev server with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Prisma studio (database GUI)
npm run studio
```

---

## 📖 Implementation Roadmap

### Day 1: Foundation & Core Infrastructure
✅ Project setup, database schema, basic UI, Sonnet 4.5 integration

### Day 2: Pattern Learning + Code Editor
✅ Pattern detail pages, Monaco editor, code execution (Judge0)

### Day 3: AI Tutor (Hints + Socratic Q&A)
✅ Progressive hint system, AI chat interface, code review

### Day 4: Knowledge Tracing + Spaced Repetition
✅ Bayesian knowledge tracing, SM-2 algorithm, review queue

### Day 5: Progress Dashboard + Visualizations
✅ Pattern mastery tracking, algorithm visualizer, analytics

### Day 6: System Design Canvas + Mock Interviews
✅ Interactive canvas, AI feedback, back-of-envelope calculator

### Day 7: Polish + Demo Preparation
✅ Bug fixes, UX polish, demo video, competition submission

**See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for detailed steps.**

---

## 🧪 Research Foundations

This system is built on proven learning science:

1. **Bloom's 2-Sigma Problem** (1984) - 1-on-1 tutoring = 2 standard deviations better
2. **Bayesian Knowledge Tracing** (1995) - Predict learner understanding
3. **Ebbinghaus Forgetting Curve** (1885) - 70% forgotten in 24 hours without review
4. **Deliberate Practice** (1993) - 70-85% difficulty sweet spot
5. **SM-2 Algorithm** (Anki) - Optimal review scheduling

**See [DESIGN_DOC.md](DESIGN_DOC.md) for full research citations.**

---

## 🎨 Tech Stack

### Backend
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **AI**: OpenAI GPT-5
- **Code Execution**: Judge0 API
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Testing**: Jest + Supertest

### Frontend (Future)
- **Framework**: React + TypeScript
- **Code Editor**: Monaco Editor
- **Visualization**: Cytoscape.js / React Flow
- **State**: Zustand or Redux Toolkit
- **API Client**: Axios

---

## 🧠 Core Features

### 1. Pattern-Based Learning
- 12 coding patterns cover 87% of FAANG interviews
- Visual explanations + code templates
- Progressive unlocking (prerequisites)

### 2. AI-Powered Hints
- Socratic questioning (not answer-giving)
- 5 levels: Conceptual → Approach → Algorithm → Pseudocode → Code
- Context-aware (knows what you've learned)

### 3. Spaced Repetition
- SM-2 algorithm (used by Anki)
- Problems reviewed at: 1d, 3d, 1w, 2w, 1m
- Adaptive intervals based on recall quality

### 4. Knowledge Tracing
- Bayesian updates after each problem
- Mastery probability (0.0 - 1.0) per pattern
- Pattern state: Locked → Introduced → Practicing → Mastered

### 5. Mock Interviews
- Timed coding challenges
- AI interviewer with follow-up questions
- Performance report with recommendations

### 6. System Design Practice
- Interactive canvas (drag-drop components)
- AI feedback on scalability
- Back-of-envelope calculations
- Trade-offs analysis

---

## 📊 Success Metrics

### For Competition ("Keep Learning" Award)

✅ **Educational Impact**:
- Evidence-based techniques (spaced repetition, active recall)
- Personalized learning (knowledge tracing)
- Measurable progress (mastery metrics)

✅ **Claude Sonnet 4.5 Showcase**:
- Pattern recognition
- Socratic tutoring
- Adaptive difficulty
- Code review
- Mock interviewing

✅ **Innovation**:
- Combines multiple proven techniques
- AI as 1-on-1 tutor (Bloom's 2-sigma)
- Bayesian knowledge tracking

### For Personal Goals

- **Week 1-2**: Master Tier 1 patterns (80%+ success rate)
- **Week 3-4**: Master Tier 2 patterns (75%+ success rate)
- **Week 9-12**: Interview ready (85+ readiness score)

---

## 🤝 Contributing

This is currently a competition project for the Claude Sonnet 4.5 Competition.

After the competition, contributions will be welcome!

---

## 📄 License

MIT License (to be added after competition)

---

## 🙏 Acknowledgments

- **DeepAgents** - Architecture inspiration ([GitHub](https://github.com/anthropics/deepagents))
- **Anthropic** - Claude Sonnet 4.5 API
- **Design Gurus** - Pattern-based approach research
- **Anki** - SM-2 algorithm implementation reference
- **LeetCode** - Problem inspiration

---

## 📞 Contact

For questions during the competition, reach out via Discord: [Competition Channel]

---

## 📂 File Structure Summary

```
.
├── README.md                    # This file
├── DESIGN_DOC.md               # Product specification (75KB, comprehensive)
├── BACKEND_ARCHITECTURE.md     # Technical architecture (DeepAgents-inspired)
├── DEEPAGENTS_MAPPING.md       # Translation guide (DeepAgents → AlgoMentor)
├── IMPLEMENTATION_GUIDE.md     # Step-by-step build instructions
└── .claude/                    # Claude Code configuration
```

---

**Ready to build?** Start with the [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)!

**Want to understand the architecture?** Read [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md)

**Need to see DeepAgents equivalents?** Check [DEEPAGENTS_MAPPING.md](DEEPAGENTS_MAPPING.md)

**Curious about the research?** Dive into [DESIGN_DOC.md](DESIGN_DOC.md)

---

Built with ❤️ using OpenAI GPT-5 and Supabase
