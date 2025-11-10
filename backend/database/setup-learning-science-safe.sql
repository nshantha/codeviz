-- Safe Learning Science Setup
-- This script safely handles existing tables and adds missing columns

-- ============================================================
-- STEP 1: DROP EXISTING TABLES (SAFE - RECREATE CLEANLY)
-- ============================================================

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS subskill_mastery CASCADE;
DROP TABLE IF EXISTS pattern_subskills CASCADE;
DROP TABLE IF EXISTS misconceptions CASCADE;
DROP TABLE IF EXISTS review_schedule CASCADE;
DROP TABLE IF EXISTS breakthroughs CASCADE;
DROP TABLE IF EXISTS learning_sessions CASCADE;
DROP TABLE IF EXISTS student_preferences CASCADE;
DROP TABLE IF EXISTS user_goals CASCADE;

-- ============================================================
-- STEP 2: CREATE TABLES WITH CORRECT SCHEMA
-- ============================================================

-- PATTERN SUBSKILLS
CREATE TABLE pattern_subskills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pattern_subskills_pattern ON pattern_subskills(pattern_id);
CREATE INDEX idx_pattern_subskills_order ON pattern_subskills(pattern_id, order_index);

-- SUBSKILL MASTERY
CREATE TABLE subskill_mastery (
  user_id TEXT NOT NULL,
  subskill_id UUID REFERENCES pattern_subskills(id) ON DELETE CASCADE,
  mastery_level DECIMAL DEFAULT 0.0 CHECK (mastery_level >= 0 AND mastery_level <= 1),
  last_practiced TIMESTAMPTZ DEFAULT NOW(),
  practice_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, subskill_id)
);

CREATE INDEX idx_subskill_mastery_user ON subskill_mastery(user_id);

-- MISCONCEPTIONS
CREATE TABLE misconceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  first_detected TIMESTAMPTZ DEFAULT NOW(),
  last_observed TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolution_date TIMESTAMPTZ,
  occurrence_count INTEGER DEFAULT 1,
  correction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_misconceptions_user ON misconceptions(user_id);
CREATE INDEX idx_misconceptions_pattern ON misconceptions(pattern_id);
CREATE INDEX idx_misconceptions_resolved ON misconceptions(user_id, resolved);

-- REVIEW SCHEDULE (Spaced Repetition)
CREATE TABLE review_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  next_review_date TIMESTAMPTZ NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor DECIMAL NOT NULL DEFAULT 2.5,
  review_count INTEGER DEFAULT 0,
  last_review_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pattern_id)
);

CREATE INDEX idx_review_schedule_user ON review_schedule(user_id);
CREATE INDEX idx_review_schedule_due ON review_schedule(user_id, next_review_date);

-- BREAKTHROUGHS
CREATE TABLE breakthroughs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  insight TEXT NOT NULL,
  mastery_before DECIMAL NOT NULL,
  mastery_after DECIMAL NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_breakthroughs_user ON breakthroughs(user_id);
CREATE INDEX idx_breakthroughs_pattern ON breakthroughs(pattern_id);
CREATE INDEX idx_breakthroughs_timestamp ON breakthroughs(user_id, timestamp DESC);

-- LEARNING SESSIONS
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,
  pattern_id UUID REFERENCES patterns(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  attempts_count INTEGER DEFAULT 0,
  hints_requested INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  success BOOLEAN DEFAULT FALSE,
  frustration_score DECIMAL,
  notes TEXT
);

CREATE INDEX idx_learning_sessions_user ON learning_sessions(user_id);
CREATE INDEX idx_learning_sessions_start ON learning_sessions(user_id, start_time DESC);
CREATE INDEX idx_learning_sessions_pattern ON learning_sessions(pattern_id);

-- STUDENT PREFERENCES
CREATE TABLE student_preferences (
  user_id TEXT PRIMARY KEY,
  preferred_explanation_style TEXT DEFAULT 'balanced' CHECK (preferred_explanation_style IN ('visual', 'verbal', 'code-first', 'balanced')),
  pace_preference TEXT DEFAULT 'moderate' CHECK (pace_preference IN ('fast', 'moderate', 'thorough')),
  difficulty_preference TEXT DEFAULT 'comfortable' CHECK (difficulty_preference IN ('challenging', 'comfortable', 'easy')),
  hint_aggressiveness TEXT DEFAULT 'moderate' CHECK (hint_aggressiveness IN ('minimal', 'moderate', 'proactive')),
  visualization_preference BOOLEAN DEFAULT TRUE,
  code_language_preferences TEXT[] DEFAULT ARRAY['javascript', 'python'],
  study_time_preference TEXT,
  session_length_preference INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER GOALS
CREATE TABLE user_goals (
  user_id TEXT PRIMARY KEY,
  target_role TEXT NOT NULL,
  target_companies TEXT[],
  target_date DATE,
  weekly_time_commitment INTEGER NOT NULL DEFAULT 10,
  current_level TEXT DEFAULT 'intermediate' CHECK (current_level IN ('beginner', 'intermediate', 'advanced')),
  interviews_scheduled JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update knowledge_state table to add user_id if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_state' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE knowledge_state ADD COLUMN user_id TEXT DEFAULT 'default-user';
    ALTER TABLE knowledge_state DROP CONSTRAINT IF EXISTS knowledge_state_pattern_id_key;
    ALTER TABLE knowledge_state ADD CONSTRAINT knowledge_state_user_pattern_unique UNIQUE(user_id, pattern_id);
  END IF;
END $$;

-- ============================================================
-- STEP 3: SEED DATA
-- ============================================================

-- Two Pointers subskills
INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Pointer Initialization', 'Setting up pointers at correct starting positions', 1
FROM patterns WHERE name = 'Two Pointers';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Movement Strategy', 'Understanding when and how to move each pointer', 2
FROM patterns WHERE name = 'Two Pointers';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Termination Condition', 'Knowing when pointers should stop', 3
FROM patterns WHERE name = 'Two Pointers';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'State Management', 'Tracking and updating state while pointers move', 4
FROM patterns WHERE name = 'Two Pointers';

-- Sliding Window subskills
INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Window Definition', 'Identifying what constitutes a valid window', 1
FROM patterns WHERE name = 'Sliding Window';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Window Expansion', 'Growing the window by moving right pointer', 2
FROM patterns WHERE name = 'Sliding Window';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Window Contraction', 'Shrinking window by moving left pointer', 3
FROM patterns WHERE name = 'Sliding Window';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Window State Tracking', 'Maintaining window properties', 4
FROM patterns WHERE name = 'Sliding Window';

-- Dynamic Programming subskills
INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'State Definition', 'Defining what dp[i] represents', 1
FROM patterns WHERE name = 'Dynamic Programming';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Base Cases', 'Identifying and initializing base cases', 2
FROM patterns WHERE name = 'Dynamic Programming';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Recurrence Relation', 'Deriving the formula', 3
FROM patterns WHERE name = 'Dynamic Programming';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Iteration Order', 'Determining order to fill DP table', 4
FROM patterns WHERE name = 'Dynamic Programming';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Space Optimization', 'Reducing 2D to 1D when possible', 5
FROM patterns WHERE name = 'Dynamic Programming';

-- Binary Search subskills
INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Search Space Definition', 'Identifying the range to search', 1
FROM patterns WHERE name = 'Binary Search';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Mid Calculation', 'Computing mid safely without overflow', 2
FROM patterns WHERE name = 'Binary Search';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Comparison Logic', 'Deciding which half to eliminate', 3
FROM patterns WHERE name = 'Binary Search';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Boundary Handling', 'Handling boundaries and edge cases', 4
FROM patterns WHERE name = 'Binary Search';

-- Backtracking subskills
INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Choice Identification', 'Recognizing choices at each step', 1
FROM patterns WHERE name = 'Backtracking';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Constraint Checking', 'Validating if choice is valid', 2
FROM patterns WHERE name = 'Backtracking';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'State Modification', 'Making and tracking changes', 3
FROM patterns WHERE name = 'Backtracking';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'State Restoration', 'Undoing changes when backtracking', 4
FROM patterns WHERE name = 'Backtracking';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Base Case Recognition', 'Identifying complete solution', 5
FROM patterns WHERE name = 'Backtracking';

-- Graph Traversal subskills
INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Graph Representation', 'Choosing representation', 1
FROM patterns WHERE name = 'Graph Traversal';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'BFS vs DFS Selection', 'Deciding traversal method', 2
FROM patterns WHERE name = 'Graph Traversal';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Visited Tracking', 'Maintaining visited set', 3
FROM patterns WHERE name = 'Graph Traversal';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Neighbor Exploration', 'Iterating through adjacent nodes', 4
FROM patterns WHERE name = 'Graph Traversal';

INSERT INTO pattern_subskills (pattern_id, name, description, order_index)
SELECT id, 'Path Reconstruction', 'Tracking parent pointers', 5
FROM patterns WHERE name = 'Graph Traversal';

-- Default student preferences
INSERT INTO student_preferences (
  user_id, preferred_explanation_style, pace_preference,
  difficulty_preference, hint_aggressiveness,
  visualization_preference, code_language_preferences
)
VALUES (
  'default-user', 'balanced', 'moderate',
  'comfortable', 'moderate',
  true, ARRAY['javascript', 'python', 'java']
);

-- Default user goals
INSERT INTO user_goals (
  user_id, target_role, target_companies,
  weekly_time_commitment, current_level
)
VALUES (
  'default-user', 'Software Engineer',
  ARRAY['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple'],
  10, 'intermediate'
);

-- Initialize knowledge state
INSERT INTO knowledge_state (user_id, pattern_id, mastery_probability, problems_solved, problems_attempted, status)
SELECT 'default-user', id, 0.1, 0, 0, 'Locked'
FROM patterns
ON CONFLICT (user_id, pattern_id) DO NOTHING;

-- Set first pattern as Introduced
UPDATE knowledge_state
SET status = 'Introduced', mastery_probability = 0.2
WHERE user_id = 'default-user'
AND pattern_id = (SELECT id FROM patterns WHERE name = 'Two Pointers' LIMIT 1);

-- Create initial review schedule
INSERT INTO review_schedule (
  user_id, pattern_id, next_review_date,
  interval_days, ease_factor, review_count
)
SELECT
  'default-user', id, CURRENT_DATE + INTERVAL '1 day',
  1, 2.5, 0
FROM patterns WHERE name = 'Two Pointers';

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
DECLARE
  subskill_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO subskill_count FROM pattern_subskills;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Learning science setup complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created: 8';
  RAISE NOTICE 'Subskills inserted: %', subskill_count;
  RAISE NOTICE 'User: default-user initialized';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run ./test-learning-science.sh';
  RAISE NOTICE '========================================';
END $$;
