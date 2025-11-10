-- Learning Science Tables Migration
-- Creates all necessary tables for the AI tutor features

-- ============================================================
-- PATTERN SUBSKILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS pattern_subskills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pattern_subskills_pattern ON pattern_subskills(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_subskills_order ON pattern_subskills(pattern_id, order_index);

-- ============================================================
-- SUBSKILL MASTERY
-- ============================================================
CREATE TABLE IF NOT EXISTS subskill_mastery (
  user_id TEXT NOT NULL,
  subskill_id UUID REFERENCES pattern_subskills(id) ON DELETE CASCADE,
  mastery_level DECIMAL DEFAULT 0.0 CHECK (mastery_level >= 0 AND mastery_level <= 1),
  last_practiced TIMESTAMPTZ DEFAULT NOW(),
  practice_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, subskill_id)
);

CREATE INDEX IF NOT EXISTS idx_subskill_mastery_user ON subskill_mastery(user_id);

-- ============================================================
-- MISCONCEPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS misconceptions (
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

CREATE INDEX IF NOT EXISTS idx_misconceptions_user ON misconceptions(user_id);
CREATE INDEX IF NOT EXISTS idx_misconceptions_pattern ON misconceptions(pattern_id);
CREATE INDEX IF NOT EXISTS idx_misconceptions_resolved ON misconceptions(user_id, resolved);

-- ============================================================
-- REVIEW SCHEDULE (Spaced Repetition)
-- ============================================================
CREATE TABLE IF NOT EXISTS review_schedule (
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

CREATE INDEX IF NOT EXISTS idx_review_schedule_user ON review_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_review_schedule_due ON review_schedule(user_id, next_review_date);

-- ============================================================
-- BREAKTHROUGHS
-- ============================================================
CREATE TABLE IF NOT EXISTS breakthroughs (
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

CREATE INDEX IF NOT EXISTS idx_breakthroughs_user ON breakthroughs(user_id);
CREATE INDEX IF NOT EXISTS idx_breakthroughs_pattern ON breakthroughs(pattern_id);
CREATE INDEX IF NOT EXISTS idx_breakthroughs_timestamp ON breakthroughs(user_id, timestamp DESC);

-- ============================================================
-- LEARNING SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_sessions (
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

CREATE INDEX IF NOT EXISTS idx_learning_sessions_user ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_start ON learning_sessions(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_pattern ON learning_sessions(pattern_id);

-- ============================================================
-- STUDENT PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS student_preferences (
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

-- ============================================================
-- USER GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_goals (
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

-- ============================================================
-- UPDATE KNOWLEDGE_STATE TABLE (add user_id if needed)
-- ============================================================
-- Check if user_id column exists, if not add it
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
-- TRIGGERS FOR UPDATED_AT
-- ============================================================

-- Pattern subskills
CREATE OR REPLACE TRIGGER update_pattern_subskills_updated_at
  BEFORE UPDATE ON pattern_subskills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Subskill mastery
CREATE OR REPLACE TRIGGER update_subskill_mastery_updated_at
  BEFORE UPDATE ON subskill_mastery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Review schedule
CREATE OR REPLACE TRIGGER update_review_schedule_updated_at
  BEFORE UPDATE ON review_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Student preferences
CREATE OR REPLACE TRIGGER update_student_preferences_updated_at
  BEFORE UPDATE ON student_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User goals
CREATE OR REPLACE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DONE
-- ============================================================

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✓ Learning science tables created successfully!';
  RAISE NOTICE 'Next step: Run seed-learning-science.sql to populate data';
END $$;
