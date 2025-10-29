# AlgoMentor Quick Start

## 🚀 Three Commands to Get Started

### 1. Start Everything
```bash
./start.sh
```

### 2. Test It
```bash
./test-full.sh
```

### 3. Stop Everything
```bash
./stop.sh
```

---

## 📍 URLs

- **Chat UI:** http://localhost:3001/chat
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

---

## 💬 Try These Questions

Open http://localhost:3001/chat and ask:

1. "What is the Two Pointers pattern?"
2. "Help me solve: Find two numbers that sum to a target in a sorted array"
3. "Explain sliding window technique"
4. "Show me how binary search works"
5. "What's the difference between DFS and BFS?"

---

## 🔧 Troubleshooting One-Liners

```bash
# Stop all servers
./stop.sh

# Kill processes manually
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# View logs
tail -f /tmp/algomentor-backend.log
tail -f /tmp/algomentor-frontend.log

# Reinstall dependencies
cd backend && npm install
cd frontend && npm install
```

---

## 📦 What You Get

✅ AI-powered interview tutor
✅ Pattern-based learning (17 patterns)
✅ Dynamic algorithm visualizations
✅ Socratic hints (5 levels)
✅ Progress tracking
✅ DeepAgents architecture

---

## 🎯 Quick Test

```bash
# Test health
curl http://localhost:3000/health

# Test agent
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is Two Pointers?"}]}'
```

---

**That's it! You're ready to start learning! 🎓**
