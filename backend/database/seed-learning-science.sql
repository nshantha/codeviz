-- Learning Science Seed Data
-- Seed data for pattern subskills, common misconceptions, and default preferences

-- First, get pattern IDs (assumes patterns from seed.sql are already loaded)
-- Pattern subskills for each core pattern

-- ============================================================
-- PATTERN SUBSKILLS
-- ============================================================

-- Two Pointers subskills
INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Pointer Initialization', 'Setting up pointers at correct starting positions (start/end, slow/fast, etc.)', 1
FROM patterns WHERE name = 'Two Pointers';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Movement Strategy', 'Understanding when and how to move each pointer', 2
FROM patterns WHERE name = 'Two Pointers';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Termination Condition', 'Knowing when pointers should stop (meet, cross, reach end)', 3
FROM patterns WHERE name = 'Two Pointers';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'State Management', 'Tracking and updating necessary state while pointers move', 4
FROM patterns WHERE name = 'Two Pointers';

-- Sliding Window subskills
INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Window Definition', 'Identifying what constitutes a valid window', 1
FROM patterns WHERE name = 'Sliding Window';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Window Expansion', 'Growing the window by moving right pointer', 2
FROM patterns WHERE name = 'Sliding Window';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Window Contraction', 'Shrinking the window by moving left pointer when invalid', 3
FROM patterns WHERE name = 'Sliding Window';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Window State Tracking', 'Maintaining window properties (sum, count, frequency map, etc.)', 4
FROM patterns WHERE name = 'Sliding Window';

-- Dynamic Programming subskills
INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'State Definition', 'Defining what dp[i] or dp[i][j] represents', 1
FROM patterns WHERE name = 'Dynamic Programming';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Base Cases', 'Identifying and correctly initializing base cases', 2
FROM patterns WHERE name = 'Dynamic Programming';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Recurrence Relation', 'Deriving the formula to compute dp[i] from previous states', 3
FROM patterns WHERE name = 'Dynamic Programming';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Iteration Order', 'Determining correct order to fill DP table', 4
FROM patterns WHERE name = 'Dynamic Programming';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Space Optimization', 'Reducing 2D to 1D when possible', 5
FROM patterns WHERE name = 'Dynamic Programming';

-- Binary Search subskills
INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Search Space Definition', 'Identifying the range to search and what property is monotonic', 1
FROM patterns WHERE name = 'Binary Search';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Mid Calculation', 'Computing mid safely without overflow', 2
FROM patterns WHERE name = 'Binary Search';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Comparison Logic', 'Deciding which half to eliminate', 3
FROM patterns WHERE name = 'Binary Search';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Boundary Handling', 'Handling inclusive/exclusive boundaries and finding first/last occurrence', 4
FROM patterns WHERE name = 'Binary Search';

-- Backtracking subskills
INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Choice Identification', 'Recognizing what choices can be made at each step', 1
FROM patterns WHERE name = 'Backtracking';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Constraint Checking', 'Validating if a choice is valid before exploring', 2
FROM patterns WHERE name = 'Backtracking';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'State Modification', 'Making and tracking changes to current state', 3
FROM patterns WHERE name = 'Backtracking';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'State Restoration', 'Undoing changes when backtracking', 4
FROM patterns WHERE name = 'Backtracking';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Base Case Recognition', 'Identifying when a complete solution is found', 5
FROM patterns WHERE name = 'Backtracking';

-- Graph Traversal subskills
INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Graph Representation', 'Choosing between adjacency list, matrix, or implicit graph', 1
FROM patterns WHERE name = 'Graph Traversal';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'BFS vs DFS Selection', 'Deciding which traversal method to use', 2
FROM patterns WHERE name = 'Graph Traversal';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Visited Tracking', 'Maintaining visited set/array to avoid cycles', 3
FROM patterns WHERE name = 'Graph Traversal';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Neighbor Exploration', 'Iterating through adjacent nodes correctly', 4
FROM patterns WHERE name = 'Graph Traversal';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Path Reconstruction', 'Tracking parent pointers to rebuild paths', 5
FROM patterns WHERE name = 'Graph Traversal';

-- ============================================================
-- DEFAULT STUDENT PREFERENCES
-- ============================================================

INSERT INTO student_preferences (
  user_id,
  preferred_explanation_style,
  pace_preference,
  difficulty_preference,
  hint_aggressiveness,
  visualization_preference,
  code_language_preferences
)
VALUES (
  'default-user',
  'balanced',
  'moderate',
  'comfortable',
  'moderate',
  true,
  ARRAY['javascript', 'python', 'java']
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- DEFAULT USER GOALS
-- ============================================================

INSERT INTO user_goals (
  user_id,
  target_role,
  target_companies,
  weekly_time_commitment,
  current_level
)
VALUES (
  'default-user',
  'Software Engineer',
  ARRAY['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple'],
  10, -- 10 hours per week
  'intermediate'
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- INITIALIZE KNOWLEDGE STATE FOR DEFAULT USER
-- ============================================================

-- Insert knowledge state for all patterns for default user
INSERT INTO knowledge_state (user_id, pattern_id, mastery_probability, problems_solved, problems_attempted, status)
SELECT
  'default-user',
  id,
  0.1,
  0,
  0,
  'Locked'
FROM patterns
ON CONFLICT (user_id, pattern_id) DO NOTHING;

-- Initialize first pattern as "Introduced"
UPDATE knowledge_state
SET status = 'Introduced', mastery_probability = 0.2
WHERE user_id = 'default-user'
AND pattern_id = (SELECT id FROM patterns WHERE name = 'Two Pointers' LIMIT 1);

-- ============================================================
-- INITIALIZE SPACED REPETITION SCHEDULES
-- ============================================================

-- Create initial review schedule for introduced pattern
INSERT INTO review_schedule (
  user_id,
  pattern_id,
  next_review_date,
  interval_days,
  ease_factor,
  review_count
)
SELECT
  'default-user',
  id,
  CURRENT_DATE + INTERVAL '1 day',
  1,
  2.5, -- Initial ease factor from SM-2
  0
FROM patterns
WHERE name = 'Two Pointers'
ON CONFLICT (user_id, pattern_id) DO NOTHING;
