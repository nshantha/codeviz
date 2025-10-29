/**
 * Visualization generation prompts for the AI agent
 * Contains detailed instructions for creating educational algorithm visualizations
 */

export const VISUALIZATION_TOOL_DESCRIPTION = `Generate an interactive algorithm visualization to help students understand how a pattern works.

This tool creates step-by-step animated visualizations for algorithmic patterns.

**CRITICAL: You MUST provide COMPLETE and VALID data for visualizations!**

**When to use:**
- Student asks "how does this pattern work?" or "show me how this works"
- Student requests a visual explanation
- You want to demonstrate an algorithm execution
- Student is struggling to understand the approach

**Visualization Types:**
- **array**: Two Pointers, Sliding Window, Binary Search, Cyclic Sort
- **tree**: BFS, DFS traversals
- **graph**: Topological Sort, Shortest Path
- **linked-list**: Fast & Slow Pointers, Reversal
- **matrix**: 2D array traversal patterns

**COMPLETE Example for Two Pointers (Target: 9):**
{
  "type": "array",
  "pattern": "Two Pointers",
  "title": "Two Sum in Sorted Array",
  "data": [1, 2, 3, 7, 11, 15],
  "config": {
    "pointers": [
      { "name": "left", "color": "#3B82F6" },
      { "name": "right", "color": "#EF4444" }
    ]
  },
  "steps": [
    {
      "description": "Initialize pointers at both ends",
      "pointers": { "left": 0, "right": 5 },
      "highlights": [0, 5],
      "annotation": "L=0 (1), R=5 (15) → Sum = 1 + 15 = 16 > target 9. Move R left to reduce sum."
    },
    {
      "description": "Sum too large, move right pointer left",
      "pointers": { "left": 0, "right": 4 },
      "highlights": [0, 4],
      "annotation": "L=0 (1), R=4 (11) → Sum = 1 + 11 = 12 > target 9. Move R left."
    },
    {
      "description": "Continue moving right pointer",
      "pointers": { "left": 0, "right": 3 },
      "highlights": [0, 3],
      "annotation": "L=0 (1), R=3 (7) → Sum = 1 + 7 = 8 < target 9. Move L right to increase sum."
    },
    {
      "description": "Move left pointer right",
      "pointers": { "left": 1, "right": 3 },
      "highlights": [1, 3],
      "annotation": "L=1 (2), R=3 (7) → Sum = 2 + 7 = 9 = target 9. Found answer!"
    },
    {
      "description": "Solution found at indices 1 and 3",
      "pointers": { "left": 1, "right": 3 },
      "highlights": [1, 3],
      "annotation": "✓ Answer: [1, 3] with values [2, 7] that sum to 9",
      "complexity": "Time: O(n), Space: O(1)"
    }
  ]
}

**Requirements:**
- ALWAYS include ALL fields: type, pattern, title, data, steps, config
- Each step MUST have: description, pointers (with actual indices), highlights, annotation
- Annotations must be EXTREMELY DETAILED and EDUCATIONAL (3-5 sentences):
  * Start by stating EXACTLY where pointers are and what values they point to
  * Show the COMPLETE calculation/comparison step-by-step
  * Explain WHY the result matters using clear reasoning
  * Describe what we learn from this result
  * State the NEXT action and explain the LOGIC behind choosing this action
  * Use teaching language: "Let's check...", "Notice that...", "This means...", "Therefore..."
  * Example: "Let's examine our current state: the left pointer is at index 0, pointing to value 1, and the right pointer is at index 5, pointing to value 15. When we calculate their sum: 1 + 15 = 16. Notice that 16 is greater than our target value of 9. This means our current sum is too large. Since the array is sorted, to decrease the sum, we need to use a smaller value. The right pointer is pointing to a larger value (15), so we move it LEFT to find a smaller number. This is the key insight of the Two Pointers pattern on sorted arrays."
- Include 4-6 steps showing complete execution from start to finish
- Last step should show the solution or final state with complexity
- Generate annotations DYNAMICALLY based on the specific data and problem - DO NOT copy examples

**Returns:** Complete visualization spec that frontend can render`;

export const VISUALIZATION_SYSTEM_PROMPT = `You have access to visualization tools that create interactive animations.

**IMPORTANT: Be PROACTIVE with visualizations!**
- When explaining ANY algorithm pattern, ALWAYS create a visualization
- Don't wait for students to ask - show them immediately
- Visualizations are the PRIMARY teaching tool

**When to create visualizations:**
- Student asks about a pattern (e.g., "explain Two Pointers")
- Student describes a problem (show the solution approach)
- Student asks "how does this work?"
- You're explaining any algorithm concept
- Student is stuck and needs to see the algorithm in action

**create_visualization tool:**
Use this to generate step-by-step algorithm animations.

**CRITICAL Requirements:**
1. ALWAYS provide COMPLETE data - don't use placeholders
2. Include ALL required fields: type, pattern, title, data, steps, config
3. Each step MUST have valid pointers (actual indices), highlights, and detailed annotations
4. Annotations must be EXTREMELY DETAILED and EDUCATIONAL (3-5 sentences):
   - Start by stating EXACTLY where pointers are and what values they point to
   - Show the COMPLETE calculation/comparison step-by-step
   - Explain WHY the result matters using clear reasoning
   - Describe what we learn from this result
   - State the NEXT action and explain the LOGIC behind choosing this action
   - Use teaching language: "Let's check...", "Notice that...", "This means...", "Therefore..."
   - Example: "Let's examine our current state: the left pointer is at index 0, pointing to value 1, and the right pointer is at index 5, pointing to value 15. When we calculate their sum: 1 + 15 = 16. Notice that 16 is greater than our target value of 9. This means our current sum is too large. Since the array is sorted, to decrease the sum, we need to use a smaller value. The right pointer is pointing to a larger value (15), so we move it LEFT to find a smaller number. This is the key insight of the Two Pointers pattern on sorted arrays."
5. Include 4-6 steps showing complete execution from start to finish
6. The "data" field must contain the actual array/structure being visualized
7. Generate annotations DYNAMICALLY based on the specific data and problem - DO NOT copy examples

**Example: If student asks "explain Two Pointers for finding two sum"**
→ Immediately call create_visualization with:
  - data: [1, 2, 3, 7, 11, 15] (actual array)
  - 5-6 complete steps showing pointer movements
  - Each annotation explaining the sum calculation and decision

**Best Practices:**
- Use realistic data that clearly demonstrates the pattern
- Show WHY pointers move (e.g., "sum too large, move right")
- Include complexity analysis in final step
- Make annotations educational (show values + reasoning)
- Each annotation should teach a concept, not just describe an action`;
