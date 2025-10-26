-- AlgoMentor Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patterns table (coding + system design)
CREATE TABLE IF NOT EXISTS patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('coding', 'system_design')),
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  description TEXT NOT NULL,
  time_complexity TEXT,
  space_complexity TEXT,
  use_cases TEXT[],
  code_templates JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  test_cases JSONB NOT NULL,
  hints TEXT[],
  optimal_solution JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problem-Pattern relationship (many-to-many)
CREATE TABLE IF NOT EXISTS problem_patterns (
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  PRIMARY KEY (problem_id, pattern_id)
);

-- Submissions table (simplified - no user auth for MVP)
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id),
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  result TEXT NOT NULL,
  execution_time INTEGER,
  hints_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge tracking table (simplified - no user auth)
CREATE TABLE IF NOT EXISTS knowledge_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id UUID REFERENCES patterns(id) UNIQUE,
  mastery_probability FLOAT DEFAULT 0.1 CHECK (mastery_probability >= 0 AND mastery_probability <= 1),
  problems_solved INTEGER DEFAULT 0,
  problems_attempted INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Locked' CHECK (status IN ('Locked', 'Introduced', 'Practicing', 'Mastered')),
  last_practiced TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patterns_type ON patterns(type);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_state_pattern ON knowledge_state(pattern_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_patterns_updated_at BEFORE UPDATE ON patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Disabled for MVP
-- Enable RLS on tables
-- ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE knowledge_state ENABLE ROW LEVEL SECURITY;

-- For MVP, allow anonymous access (will add auth later)
-- CREATE POLICY "Allow anonymous read on patterns" ON patterns FOR SELECT USING (true);
-- CREATE POLICY "Allow anonymous read on problems" ON problems FOR SELECT USING (true);
-- CREATE POLICY "Allow anonymous insert on submissions" ON submissions FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow anonymous all on knowledge_state" ON knowledge_state USING (true);
