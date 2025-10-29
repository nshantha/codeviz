# AlgoMentor Scripts

Quick start scripts for running and testing AlgoMentor.

---

## 📜 Available Scripts

### 1. **start.sh** - Start All Servers

Starts both backend (port 3000) and frontend (port 3001) servers.

**Usage:**
```bash
./start.sh
```

**What it does:**
- ✅ Checks and kills existing processes on ports 3000/3001
- ✅ Verifies dependencies are installed
- ✅ Checks environment variables exist
- ✅ Starts backend server (http://localhost:3000)
- ✅ Starts frontend server (http://localhost:3001)
- ✅ Waits for both servers to be ready
- ✅ Displays URLs and log locations
- ✅ Keeps running until you press Ctrl+C

**Output:**
```
╔════════════════════════════════════════╗
║     ✓ AlgoMentor Started Successfully! ║
╚════════════════════════════════════════╝

📍 URLs:
  Frontend: http://localhost:3001
  Backend:  http://localhost:3000
  Chat UI:  http://localhost:3001/chat
  Health:   http://localhost:3000/health

📊 Logs:
  Backend:  tail -f /tmp/algomentor-backend.log
  Frontend: tail -f /tmp/algomentor-frontend.log
```

**To stop:**
Press `Ctrl+C` in the terminal

---

### 2. **stop.sh** - Stop All Servers

Stops both backend and frontend servers.

**Usage:**
```bash
./stop.sh
```

**What it does:**
- Kills any process running on port 3000 (backend)
- Kills any process running on port 3001 (frontend)
- Confirms successful shutdown

**Output:**
```
╔════════════════════════════════════════╗
║     AlgoMentor Stop Script            ║
╚════════════════════════════════════════╝

Stopping Backend on port 3000...
  ✓ Backend stopped
Stopping Frontend on port 3001...
  ✓ Frontend stopped

✓ All servers stopped
```

---

### 3. **test-full.sh** - Run Integration Tests

Tests the complete AlgoMentor system including agent functionality.

**Usage:**
```bash
./test-full.sh
```

**Prerequisites:**
- Backend must be running (port 3000)
- Frontend must be running (port 3001)
- Run `./start.sh` first if servers aren't running

**What it tests:**
1. ✅ Health check endpoint
2. ✅ Patterns API (list all patterns)
3. ✅ Progress API (get user progress)
4. ✅ Agent chat - pattern explanation
5. ✅ Agent chat - problem solving

**Output:**
```
╔════════════════════════════════════════╗
║   AlgoMentor Integration Tests        ║
╚════════════════════════════════════════╝

[1/6] Checking if servers are running...
  ✓ Backend is running
  ✓ Frontend is running

[2/6] Testing health endpoint...
Testing: Health Check
  → GET /health
  ✓ Status: 200
  ✓ Response: { "status": "ok" }

... (more tests)

╔════════════════════════════════════════╗
║     ✓ All Tests Completed!            ║
╚════════════════════════════════════════╝
```

**Note:** Agent tests take 30-60 seconds each (GPT-5 processing time)

---

## 🚀 Quick Start Guide

### First Time Setup

1. **Clone and navigate to project:**
   ```bash
   cd /Users/nitesh/Desktop/projects/codeviz
   ```

2. **Make sure environment files exist:**
   ```bash
   # Backend
   ls backend/.env

   # Frontend
   ls frontend/.env.local
   ```

3. **Start everything:**
   ```bash
   ./start.sh
   ```

4. **Open browser:**
   - Chat UI: http://localhost:3001/chat
   - Backend API: http://localhost:3000

5. **Run tests (in another terminal):**
   ```bash
   ./test-full.sh
   ```

6. **Stop when done:**
   ```bash
   # Press Ctrl+C in the start.sh terminal
   # OR
   ./stop.sh
   ```

---

## 🔧 Troubleshooting

### Ports already in use

```bash
# Stop any running servers
./stop.sh

# Or manually kill processes
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Dependencies not installed

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Environment variables missing

```bash
# Check if files exist
ls backend/.env
ls frontend/.env.local

# If missing, copy from examples
cp backend/.env.example backend/.env
# Then edit with your values
```

### View logs

```bash
# Backend logs
tail -f /tmp/algomentor-backend.log

# Frontend logs
tail -f /tmp/algomentor-frontend.log
```

### Backend won't start

```bash
# Check Node.js version (needs 20+)
node --version

# Check if port is blocked
lsof -i :3000

# Check environment variables
cat backend/.env
```

### Frontend won't start

```bash
# Check if backend is running first
curl http://localhost:3000/health

# Check frontend dependencies
cd frontend && npm install

# Rebuild
cd frontend && npm run build
```

---

## 📊 Log Locations

Scripts write logs to `/tmp/`:

- **Backend:** `/tmp/algomentor-backend.log`
- **Frontend:** `/tmp/algomentor-frontend.log`

View in real-time:
```bash
tail -f /tmp/algomentor-backend.log
tail -f /tmp/algomentor-frontend.log
```

---

## 🎯 Testing from Command Line

### Test health endpoint
```bash
curl http://localhost:3000/health
```

### Test patterns endpoint
```bash
curl http://localhost:3000/api/patterns
```

### Test agent chat
```bash
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What is the Two Pointers pattern?"
      }
    ]
  }'
```

---

## 💡 Development Workflow

### Option 1: Use Scripts (Recommended)
```bash
# Start everything
./start.sh

# In another terminal, run tests
./test-full.sh

# View logs if needed
tail -f /tmp/algomentor-backend.log

# Stop when done
Ctrl+C or ./stop.sh
```

### Option 2: Manual Start (for debugging)
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Tests
./test-full.sh
```

---

## 📝 Script Features

All scripts include:
- ✅ Color-coded output (errors, success, info)
- ✅ Progress indicators
- ✅ Error handling
- ✅ Automatic cleanup
- ✅ Health checks
- ✅ Detailed status messages

---

## 🎨 Example Session

```bash
$ ./start.sh
╔════════════════════════════════════════╗
║     AlgoMentor Startup Script         ║
╚════════════════════════════════════════╝

[1/5] Checking for existing processes...
  ✓ Ports cleared

[2/5] Checking dependencies...
  ✓ Backend dependencies OK
  ✓ Frontend dependencies OK

[3/5] Checking environment variables...
  ✓ Backend .env OK
  ✓ Frontend .env.local OK

[4/5] Starting backend server...
  → Backend PID: 12345
  → Waiting for backend to start...
  ✓ Backend started successfully
  ✓ Backend: http://localhost:3000

[5/5] Starting frontend server...
  → Frontend PID: 12346
  → Waiting for frontend to start...
  ✓ Frontend started successfully
  ✓ Frontend: http://localhost:3001

╔════════════════════════════════════════╗
║     ✓ AlgoMentor Started Successfully! ║
╚════════════════════════════════════════╝

📍 URLs:
  Frontend: http://localhost:3001
  Backend:  http://localhost:3000
  Chat UI:  http://localhost:3001/chat
  Health:   http://localhost:3000/health

Press Ctrl+C to stop all servers...
```

---

**Happy coding with AlgoMentor! 🚀**
