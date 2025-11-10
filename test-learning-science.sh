#!/bin/bash

# Test script for new learning science features
# Tests spaced repetition, recommendations, student profile, and enhanced agent

PORT=3000
BASE_URL="http://localhost:$PORT"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AlgoMentor Learning Science Feature Tests     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"

  echo -e "${YELLOW}Testing: $name${NC}"

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -X $method -H "Content-Type: application/json" -d "$data" -w "\n%{http_code}" "$BASE_URL$endpoint")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
    echo "$body"
    ((TESTS_FAILED++))
  fi
  echo ""
}

echo -e "${BLUE}=== 1. Student Profile Endpoints ===${NC}"
echo ""

test_endpoint \
  "Get Student Profile" \
  "GET" \
  "/api/student/profile"

test_endpoint \
  "Get Student Preferences" \
  "GET" \
  "/api/student/preferences"

test_endpoint \
  "Update Student Preferences" \
  "PUT" \
  "/api/student/preferences" \
  '{"preferredExplanationStyle":"visual","pacePreference":"fast","visualizationPreference":true}'

test_endpoint \
  "Get Student Goals" \
  "GET" \
  "/api/student/goals"

test_endpoint \
  "Set Student Goals" \
  "PUT" \
  "/api/student/goals" \
  '{"targetRole":"Senior Software Engineer","targetCompanies":["Google","Meta"],"weeklyTimeCommitment":15,"currentLevel":"intermediate"}'

echo -e "${BLUE}=== 2. Learning & Spaced Repetition Endpoints ===${NC}"
echo ""

test_endpoint \
  "Get Due Reviews" \
  "GET" \
  "/api/learning/due-reviews"

test_endpoint \
  "Get Upcoming Reviews (7 days)" \
  "GET" \
  "/api/learning/upcoming-reviews?days=7"

test_endpoint \
  "Get Next Problem Recommendation" \
  "GET" \
  "/api/learning/next-problem"

test_endpoint \
  "Generate Weekly Study Plan" \
  "GET" \
  "/api/learning/weekly-plan"

echo -e "${BLUE}=== 3. Student Progress Endpoints ===${NC}"
echo ""

test_endpoint \
  "Get Breakthroughs" \
  "GET" \
  "/api/student/breakthroughs?limit=5"

test_endpoint \
  "Get Active Misconceptions" \
  "GET" \
  "/api/student/misconceptions"

test_endpoint \
  "Get Misconception Statistics" \
  "GET" \
  "/api/student/misconception-stats"

test_endpoint \
  "Generate Progress Narrative" \
  "GET" \
  "/api/student/narrative?timeframe=all-time"

echo -e "${BLUE}=== 4. Enhanced Agent Endpoint ===${NC}"
echo ""

test_endpoint \
  "Agent Chat (with learning science)" \
  "POST" \
  "/api/agent/chat" \
  '{
    "messages": [
      {"role": "user", "content": "I need help with the two-sum problem. Can you identify what pattern this is and give me a hint?"}
    ],
    "context": {
      "studentId": "default-user"
    }
  }'

echo -e "${BLUE}=== 5. Agent with Memory Test ===${NC}"
echo ""

test_endpoint \
  "Agent with History Recall" \
  "POST" \
  "/api/agent/chat" \
  '{
    "messages": [
      {"role": "user", "content": "What patterns am I currently struggling with? And what should I practice today?"}
    ],
    "context": {
      "studentId": "default-user"
    }
  }'

echo -e "${BLUE}=== 6. Legacy Endpoints (backward compatibility) ===${NC}"
echo ""

test_endpoint \
  "Get All Patterns" \
  "GET" \
  "/api/patterns"

test_endpoint \
  "Get Progress Overview" \
  "GET" \
  "/api/progress"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║             Test Results Summary                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
