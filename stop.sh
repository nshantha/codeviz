#!/bin/bash

# AlgoMentor Stop Script
# This script stops both backend and frontend servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     AlgoMentor Stop Script            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to kill process on port
kill_port() {
    local port=$1
    local name=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}Stopping $name on port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1

        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
            echo -e "${RED}  ✗ Failed to stop $name${NC}"
        else
            echo -e "${GREEN}  ✓ $name stopped${NC}"
        fi
    else
        echo -e "${BLUE}  → $name not running${NC}"
    fi
}

# Stop backend
kill_port 3000 "Backend"

# Stop frontend
kill_port 3001 "Frontend"

echo ""
echo -e "${GREEN}✓ All servers stopped${NC}"
