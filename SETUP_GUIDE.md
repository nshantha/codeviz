# AlgoMentor - Complete Setup Guide

**Quick setup guide for running the MVP backend**

---

## ✅ Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] OpenAI API key with GPT-5 access
- [ ] Supabase account (free tier works)
- [ ] Git installed

---

## 🚀 Step-by-Step Setup

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Save it securely (you'll need it in Step 4)

### Step 2: Setup Supabase

1. Go to https://supabase.com
2. Create a new project
3. Wait for project to finish setting up (~2 minutes)
4. Go to **Project Settings** → **API**
5. Copy these values:
   - `Project URL` (looks like: https://xxx.supabase.co)
   - `anon public` key

### Step 3: Create Database Schema

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `backend/database/schema.sql`
4. Paste into the SQL editor
5. Click **Run** (bottom right)
6. You should see: "Success. No rows returned"

### Step 4: Seed Database with Data

1. Still in **SQL Editor**, create another **New Query**
2. Copy the entire contents of `backend/database/seed.sql`
3. Paste into the SQL editor
4. Click **Run**
5. You should see a table showing counts:
   - Coding Patterns: 12
   - System Design Patterns: 5
   - Problems: 2 (or more if you added more)

### Step 5: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install all required packages (~2-3 minutes).

### Step 6: Configure Environment

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` with your actual values:
```bash
# Use your favorite editor
nano .env
# or
code .env
```

3. Fill in these values:
```env
# OpenAI (from Step 1)
OPENAI_API_KEY=sk-...your-actual-key...

# Supabase (from Step 2)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-actual-key...

# Leave these as defaults
NODE_ENV=development
PORT=3000
OPENAI_MODEL=gpt-5
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
LOG_LEVEL=info
```

### Step 7: Start the Server

```bash
npm run dev
```

You should see:
```
🚀 AlgoMentor Backend Started
📍 Environment: development
🌐 Server: http://localhost:3000
❤️  Health: http://localhost:3000/health
📊 API: http://localhost:3000/api

Available endpoints:
  GET  /health
  GET  /api/patterns
  GET  /api/patterns/:id
  POST /api/ai/identify-pattern
  POST /api/ai/hint
  POST /api/submissions
  GET  /api/progress
```

---

## 🧪 Test the Setup

### Test 1: Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-26T...",
  "env": "development"
}
```

### Test 2: Get Patterns

```bash
curl http://localhost:3000/api/patterns
```

Expected: JSON array with 17 patterns (12 coding + 5 system design)

### Test 3: AI Pattern Recognition

```bash
curl -X POST http://localhost:3000/api/ai/identify-pattern \
  -H "Content-Type: application/json" \
  -d '{
    "problemDescription": "Given a sorted array of integers, find two numbers that add up to a target value"
  }'
```

Expected: JSON with pattern recognition result (should identify "Two Pointers")

### Test 4: AI Hint Generation

```bash
# First, get a problem ID
curl http://localhost:3000/api/patterns | jq '.[0].problems[0].id'

# Then use that ID (replace with actual UUID)
curl -X POST http://localhost:3000/api/ai/hint \
  -H "Content-Type: application/json" \
  -d '{
    "problemId": "PASTE-UUID-HERE",
    "problemDescription": "Find two numbers that sum to target in sorted array",
    "userCode": "// I am stuck, not sure where to start",
    "hintLevel": 1
  }'
```

Expected: JSON with a Socratic hint (should ask a guiding question)

---

## 🐛 Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Issue: "OPENAI_API_KEY is required"

**Solution:**
- Check your `.env` file exists in `backend/` folder
- Ensure `OPENAI_API_KEY=` has your actual key (starts with `sk-`)
- No spaces around the `=` sign

### Issue: "Invalid Supabase URL"

**Solution:**
- Check `SUPABASE_URL` in `.env`
- Should be like: `https://xxxxx.supabase.co` (no trailing slash)
- Verify project is active in Supabase dashboard

### Issue: Database connection errors

**Solution:**
1. Verify schema.sql was run successfully
2. Check Supabase project is not paused (free tier pauses after inactivity)
3. Verify `SUPABASE_ANON_KEY` is correct

### Issue: "Cannot find module 'dotenv'"

**Solution:**
```bash
npm install dotenv
```

### Issue: TypeScript errors when building

**Solution:**
```bash
npm run build
# Check output for specific errors
```

---

## 📁 Project Structure

```
codeviz/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration & Supabase setup
│   │   ├── services/
│   │   │   ├── ai/          # OpenAI GPT-5 services
│   │   │   └── learning/    # Knowledge tracking
│   │   ├── routes/          # API endpoints
│   │   ├── app.ts           # Express app
│   │   └── index.ts         # Server entry
│   ├── database/
│   │   ├── schema.sql       # Database tables
│   │   └── seed.sql         # Initial data
│   ├── .env                 # Your secrets (gitignored)
│   ├── .env.example         # Template
│   ├── package.json
│   └── README.md
├── MVP_ROADMAP.md           # Feature roadmap
├── BACKEND_ARCHITECTURE.md  # Architecture details
└── SETUP_GUIDE.md           # This file
```

---

## 🔐 Security Notes

**Important:**
- ⚠️ Never commit `.env` file to git (it's in .gitignore)
- ⚠️ Never share your OpenAI API key
- ⚠️ Never share your Supabase service role key
- ✅ Use `.env.example` as a template for others

---

## 📝 Next Steps

After setup is complete:

1. **Test all endpoints** - Use the curl commands above
2. **Check MVP_ROADMAP.md** - See what features are implemented
3. **Add more problems** - Edit `database/seed.sql` and re-run
4. **Build frontend** - Connect React app to these APIs
5. **Deploy** - Deploy to Railway, Render, or Vercel

---

## 🆘 Need Help?

1. Check `backend/README.md` for API documentation
2. Check `MVP_ROADMAP.md` for feature status
3. Check console logs for specific errors
4. Verify all environment variables are set correctly

---

## ✅ Setup Complete!

If all tests pass, your backend is ready! 🎉

**You now have:**
- ✅ OpenAI GPT-5 integration working
- ✅ Supabase PostgreSQL database
- ✅ 12 coding patterns + 5 system design concepts
- ✅ Sample problems with solutions
- ✅ AI-powered pattern recognition
- ✅ AI-powered Socratic hints
- ✅ Knowledge tracking system
- ✅ RESTful API endpoints

**Next:** Start building the frontend or add more features!
