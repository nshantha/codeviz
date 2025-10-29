#!/bin/bash

# AlgoMentor Startup Script
# This script starts both backend and frontend servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     AlgoMentor Startup Script         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Killing process on port $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
}

# Clean up function
cleanup() {
    echo -e "\n${RED}Shutting down servers...${NC}"
    kill_port 3000
    kill_port 3001
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Step 1: Check and kill existing processes
echo -e "${YELLOW}[1/5] Checking for existing processes...${NC}"
if check_port 3000; then
    echo -e "${YELLOW}  ⚠ Backend port 3000 is in use${NC}"
    kill_port 3000
    sleep 2
fi

if check_port 3001; then
    echo -e "${YELLOW}  ⚠ Frontend port 3001 is in use${NC}"
    kill_port 3001
    sleep 2
fi
echo -e "${GREEN}  ✓ Ports cleared${NC}"
echo ""

# Step 2: Check dependencies
echo -e "${YELLOW}[2/5] Checking dependencies...${NC}"

if [ ! -d "$PROJECT_ROOT/backend/node_modules" ]; then
    echo -e "${YELLOW}  ⚠ Backend dependencies not found, installing...${NC}"
    cd "$PROJECT_ROOT/backend" && npm install
fi
echo -e "${GREEN}  ✓ Backend dependencies OK${NC}"

if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo -e "${YELLOW}  ⚠ Frontend dependencies not found, installing...${NC}"
    cd "$PROJECT_ROOT/frontend" && npm install
fi
echo -e "${GREEN}  ✓ Frontend dependencies OK${NC}"
echo ""

# Step 3: Check environment variables
echo -e "${YELLOW}[3/5] Checking environment variables...${NC}"

if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    echo -e "${RED}  ✗ Backend .env file not found!${NC}"
    echo -e "${RED}    Create backend/.env with required variables${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Backend .env OK${NC}"

if [ ! -f "$PROJECT_ROOT/frontend/.env.local" ]; then
    echo -e "${RED}  ✗ Frontend .env.local file not found!${NC}"
    echo -e "${RED}    Create frontend/.env.local with required variables${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Frontend .env.local OK${NC}"
echo ""

# Step 4: Start Backend
echo -e "${YELLOW}[4/5] Starting backend server...${NC}"
cd "$PROJECT_ROOT/backend"
npm run dev > /tmp/algomentor-backend.log 2>&1 &
BACKEND_PID=$!

echo -e "${BLUE}  → Backend PID: $BACKEND_PID${NC}"
echo -e "${BLUE}  → Waiting for backend to start...${NC}"

# Wait for backend to be ready
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Backend started successfully${NC}"
        echo -e "${GREEN}  ✓ Backend: http://localhost:3000${NC}"
        break
    fi

    if [ $i -eq 30 ]; then
        echo -e "${RED}  ✗ Backend failed to start${NC}"
        echo -e "${RED}  Check logs: tail -f /tmp/algomentor-backend.log${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi

    sleep 1
done
echo ""

# Step 5: Start Frontend
echo -e "${YELLOW}[5/5] Starting frontend server...${NC}"
cd "$PROJECT_ROOT/frontend"
npm run dev > /tmp/algomentor-frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "${BLUE}  → Frontend PID: $FRONTEND_PID${NC}"
echo -e "${BLUE}  → Waiting for frontend to start...${NC}"

# Wait for frontend to be ready
for i in {1..30}; do
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Frontend started successfully${NC}"
        echo -e "${GREEN}  ✓ Frontend: http://localhost:3001${NC}"
        break
    fi

    if [ $i -eq 30 ]; then
        echo -e "${RED}  ✗ Frontend failed to start${NC}"
        echo -e "${RED}  Check logs: tail -f /tmp/algomentor-frontend.log${NC}"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi

    sleep 1
done
echo ""

# Success!
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✓ AlgoMentor Started Successfully! ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 URLs:${NC}"
echo -e "  ${GREEN}Frontend:${NC} http://localhost:3001"
echo -e "  ${GREEN}Backend:${NC}  http://localhost:3000"
echo -e "  ${GREEN}Chat UI:${NC}  http://localhost:3001/chat"
echo -e "  ${GREEN}Health:${NC}   http://localhost:3000/health"
echo ""
echo -e "${BLUE}📊 Logs:${NC}"
echo -e "  Backend:  ${YELLOW}tail -f /tmp/algomentor-backend.log${NC}"
echo -e "  Frontend: ${YELLOW}tail -f /tmp/algomentor-frontend.log${NC}"
echo ""
echo -e "${BLUE}🔧 Quick Actions:${NC}"
echo -e "  Test API: ${YELLOW}./test-api.sh${NC}"
echo -e "  Stop:     ${YELLOW}Press Ctrl+C${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers...${NC}"

# Keep script running
wait
