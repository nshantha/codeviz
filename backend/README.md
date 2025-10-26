# AlgoMentor Backend - MVP

Pattern-based interview learning with AI assistance using OpenAI GPT-5 and Supabase PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Supabase account
- OpenAI API key (GPT-5)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# OpenAI GPT-5
OPENAI_API_KEY=your_openai_api_key_here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Setup Database

1. Go to Supabase Dashboard → SQL Editor
2. Run the schema: `database/schema.sql`
3. Run the seed data: `database/seed.sql` (after creating it)

### 4. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Patterns

```bash
# List all patterns
GET /api/patterns
GET /api/patterns?type=coding
GET /api/patterns?type=system_design

# Get pattern details
GET /api/patterns/:id
```

### AI Services

```bash
# Identify pattern
POST /api/ai/identify-pattern
Body: {
  "problemDescription": "Given a sorted array..."
}

# Get hint
POST /api/ai/hint
Body: {
  "problemId": "uuid",
  "problemDescription": "...",
  "userCode": "// my code",
  "hintLevel": 1,
  "hintsGiven": []
}
```

### Submissions

```bash
# Submit code
POST /api/submissions
Body: {
  "problemId": "uuid",
  "code": "function solution() {...}",
  "language": "JavaScript"
}
```

### Progress

```bash
# Get progress
GET /api/progress
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration & Supabase client
│   ├── services/         # Business logic
│   │   ├── ai/          # OpenAI services
│   │   └── learning/    # Knowledge tracking
│   ├── routes/          # API routes
│   ├── app.ts           # Express app factory
│   └── index.ts         # Server entry point
├── database/            # SQL schemas & seeds
├── package.json
└── tsconfig.json
```

## 🧪 Testing Endpoints

### 1. Test Health
```bash
curl http://localhost:3000/health
```

### 2. Test Pattern Recognition
```bash
curl -X POST http://localhost:3000/api/ai/identify-pattern \
  -H "Content-Type: application/json" \
  -d '{
    "problemDescription": "Given a sorted array, find two numbers that sum to target"
  }'
```

### 3. Test Hint Generation
```bash
curl -X POST http://localhost:3000/api/ai/hint \
  -H "Content-Type: application/json" \
  -d '{
    "problemId": "00000000-0000-0000-0000-000000000000",
    "problemDescription": "Find two numbers that sum to target in sorted array",
    "userCode": "// I am stuck",
    "hintLevel": 1
  }'
```

## 🗄️ Database Schema

See `database/schema.sql` for full schema.

**Main Tables:**
- `patterns` - Coding & system design patterns
- `problems` - Practice problems
- `problem_patterns` - Many-to-many relationship
- `submissions` - User code submissions
- `knowledge_state` - Pattern mastery tracking

## 📚 Architecture

This backend follows the **DeepAgents architecture patterns**:

- ✅ Factory pattern for services
- ✅ Type-safe with strict TypeScript
- ✅ Service layer separation
- ✅ Supabase for database
- ✅ OpenAI GPT-5 for AI

See `../BACKEND_ARCHITECTURE.md` for detailed design.

## 🔧 Development

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📝 Next Steps

1. ✅ Backend structure complete
2. ⏳ Create seed data (run seed.sql)
3. ⏳ Test all endpoints
4. ⏳ Add frontend
5. ⏳ Deploy to production

## 🐛 Troubleshooting

### "Module not found" errors
```bash
npm install
```

### TypeScript errors
```bash
npm run build
```

### Database connection fails
- Check SUPABASE_URL and SUPABASE_ANON_KEY in `.env`
- Verify Supabase project is running
- Run schema.sql in Supabase SQL Editor

### OpenAI errors
- Verify OPENAI_API_KEY in `.env`
- Check API key has GPT-5 access
- Check rate limits

## 📖 Documentation

- [MVP Roadmap](../MVP_ROADMAP.md)
- [Design Doc](../DESIGN_DOC.md)
- [Architecture](../BACKEND_ARCHITECTURE.md)
- [DeepAgents Mapping](../DEEPAGENTS_MAPPING.md)

---

Built with ❤️ using OpenAI GPT-5 and Supabase
