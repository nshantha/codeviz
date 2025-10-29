#!/bin/bash

# Test Agent with Visualization Capabilities
# This script tests the agent's ability to generate visualizations

echo "🧪 Testing Agent with Visualization Middleware"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Test: Agent generates visualization for Two Pointers
echo "Test: Agent Generates Two Pointers Visualization"
echo "-------------------------------------------------"
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Show me a visualization of how Two Pointers pattern works for finding two numbers that sum to 9 in the array [2, 7, 11, 15]"
      }
    ]
  }')

# Check if visualization was created
if [[ $RESPONSE == *"create_visualization"* ]] || [[ $RESPONSE == *"visualization"* ]]; then
  echo -e "${GREEN}✅ PASSED${NC} - Agent created visualization"
  echo ""
  echo "Response Preview:"
  echo $RESPONSE | python3 -m json.tool | head -50
else
  echo -e "${RED}❌ FAILED${NC} - No visualization created"
  echo "Response:"
  echo $RESPONSE | python3 -m json.tool
fi

echo ""
echo "=============================================="
echo ""

# Test: Agent uses multiple tools together
echo "Test: Agent Uses Multiple Tools (Pattern + Visualization + Hint)"
echo "----------------------------------------------------------------"
RESPONSE2=$(curl -s -X POST ${BASE_URL}/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "I need help solving a problem where I find two numbers in a sorted array that sum to a target. Can you identify the pattern, show me how it works visually, and give me a hint?"
      }
    ]
  }')

# Count tools used
PATTERN_USED=$(echo $RESPONSE2 | grep -o "identify_pattern" | wc -l | tr -d ' ')
VIZ_USED=$(echo $RESPONSE2 | grep -o "create_visualization" | wc -l | tr -d ' ')
HINT_USED=$(echo $RESPONSE2 | grep -o "generate_hint" | wc -l | tr -d ' ')

echo "Tools Used:"
echo "  - Pattern Recognition: $PATTERN_USED"
echo "  - Visualization: $VIZ_USED"
echo "  - Hint Generation: $HINT_USED"

if [[ $PATTERN_USED -gt 0 ]] && [[ $VIZ_USED -gt 0 ]]; then
  echo -e "${GREEN}✅ PASSED${NC} - Agent used multiple tools autonomously"
else
  echo -e "${YELLOW}⚠️  PARTIAL${NC} - Agent may not be using all tools"
fi

echo ""
echo "Metadata:"
echo $RESPONSE2 | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'metadata' in data:
    print(json.dumps(data['metadata'], indent=2))
" 2>/dev/null || echo "Could not parse metadata"

echo ""
echo "=============================================="
echo "Testing Complete!"
