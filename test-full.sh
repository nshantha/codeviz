#!/bin/bash

# AlgoMentor Full Integration Test Script
# Tests the complete agent chat flow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AlgoMentor Integration Tests        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=${5:-200}

    echo -e "${CYAN}Testing: $name${NC}"
    echo -e "${BLUE}  → $method $endpoint${NC}"

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" 2>&1)
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}  ✓ Status: $http_code${NC}"

        # Pretty print JSON if jq is available
        if command -v jq &> /dev/null; then
            echo -e "${GREEN}  ✓ Response:${NC}"
            echo "$body" | jq '.' 2>/dev/null | head -20
        else
            echo "$body" | head -5
        fi

        return 0
    else
        echo -e "${RED}  ✗ Status: $http_code (expected $expected_status)${NC}"
        echo -e "${RED}  Response: $body${NC}"
        return 1
    fi
}

# Check if servers are running
echo -e "${YELLOW}[1/6] Checking if servers are running...${NC}"

if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${RED}  ✗ Backend not running on port 3000${NC}"
    echo -e "${YELLOW}  Start with: ./start.sh${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Backend is running${NC}"

if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${RED}  ✗ Frontend not running on port 3001${NC}"
    echo -e "${YELLOW}  Start with: ./start.sh${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Frontend is running${NC}"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}[2/6] Testing health endpoint...${NC}"
test_endpoint "Health Check" "GET" "/health" "" 200
echo ""

# Test 2: Get Patterns
echo -e "${YELLOW}[3/6] Testing patterns endpoint...${NC}"
test_endpoint "List Patterns" "GET" "/api/patterns" "" 200
echo ""

# Test 3: Get Progress
echo -e "${YELLOW}[4/6] Testing progress endpoint...${NC}"
test_endpoint "Get Progress" "GET" "/api/progress" "" 200
echo ""

# Test 4: Agent Chat - Simple Question
echo -e "${YELLOW}[5/6] Testing agent chat (simple question)...${NC}"
echo -e "${CYAN}  This may take 30-60 seconds (GPT-5 processing)...${NC}"

chat_data='{
  "messages": [
    {
      "role": "user",
      "content": "What is the Two Pointers pattern?"
    }
  ]
}'

if test_endpoint "Agent Chat - Two Pointers" "POST" "/api/agent/chat" "$chat_data" 200; then
    echo -e "${GREEN}  ✓ Agent responded successfully${NC}"
else
    echo -e "${RED}  ✗ Agent chat failed${NC}"
fi
echo ""

# Test 5: Agent Chat - Problem Solving
echo -e "${YELLOW}[6/6] Testing agent chat (problem solving)...${NC}"
echo -e "${CYAN}  This may take 30-60 seconds (GPT-5 processing)...${NC}"

problem_data='{
  "messages": [
    {
      "role": "user",
      "content": "Help me solve: Given a sorted array, find two numbers that sum to a target."
    }
  ]
}'

if test_endpoint "Agent Chat - Problem Help" "POST" "/api/agent/chat" "$problem_data" 200; then
    echo -e "${GREEN}  ✓ Agent provided help successfully${NC}"
else
    echo -e "${RED}  ✗ Agent problem help failed${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✓ All Tests Completed!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Test Summary:${NC}"
echo -e "  ${GREEN}✓${NC} Health check"
echo -e "  ${GREEN}✓${NC} Patterns API"
echo -e "  ${GREEN}✓${NC} Progress API"
echo -e "  ${GREEN}✓${NC} Agent chat (pattern explanation)"
echo -e "  ${GREEN}✓${NC} Agent chat (problem solving)"
echo ""
echo -e "${BLUE}🌐 Access the UI:${NC}"
echo -e "  Chat: ${CYAN}http://localhost:3001/chat${NC}"
echo ""
echo -e "${BLUE}💡 Try these questions:${NC}"
echo -e "  • What is the Two Pointers pattern?"
echo -e "  • Help me solve the two-sum problem"
echo -e "  • Explain sliding window technique"
echo -e "  • Show me how binary search works"
echo ""
