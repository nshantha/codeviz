/**
 * SQLite schema + versioned migrations.
 * The live database file is NEVER synced across machines (see sync engine);
 * cross-device movement happens through versioned .algomentor backups and
 * append-only event logs.
 */

export const SCHEMA_VERSION = 3;

export interface Migration {
  version: number;
  description: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: "Initial schema: profile, questions, attempts, pattern state, review items",
    sql: `
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,          -- JSON Profile
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      leetcode_id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      pattern TEXT NOT NULL,
      leetcode_url TEXT NOT NULL,
      neetcode150 INTEGER NOT NULL DEFAULT 0,
      companies TEXT NOT NULL      -- JSON QuestionCompanyTag[]
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,         -- uuid, stable across devices
      device_id TEXT NOT NULL,
      question_id INTEGER NOT NULL REFERENCES questions(leetcode_id),
      started_at TEXT NOT NULL,
      ended_at TEXT NOT NULL,
      active_ms INTEGER NOT NULL,
      elapsed_ms INTEGER NOT NULL,
      outcome TEXT NOT NULL,       -- solved | gave_up | partial
      hints_used INTEGER NOT NULL DEFAULT 0,
      confidence INTEGER NOT NULL DEFAULT 3,
      pattern_identified_unaided INTEGER,  -- null/0/1
      label_shown INTEGER NOT NULL DEFAULT 1,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_attempts_question ON attempts(question_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_created ON attempts(created_at);

    CREATE TABLE IF NOT EXISTS pattern_state (
      pattern TEXT PRIMARY KEY,
      mastery REAL NOT NULL DEFAULT 0.1,
      ease REAL NOT NULL DEFAULT 2.5,
      interval_days INTEGER NOT NULL DEFAULT 1,
      next_review TEXT,             -- ISO date, nullable until first attempt
      review_count INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      problems_attempted INTEGER NOT NULL DEFAULT 0,
      problems_solved INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS review_items (
      question_id INTEGER PRIMARY KEY REFERENCES questions(leetcode_id),
      ease REAL NOT NULL DEFAULT 2.5,
      interval_days INTEGER NOT NULL DEFAULT 1,
      next_review TEXT NOT NULL,    -- ISO date
      review_count INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      last_outcome TEXT,
      updated_at TEXT NOT NULL
    );
    `,
  },
  {
    version: 2,
    description: "System design sessions, behavioral story bank, AI session log",
    sql: `
    CREATE TABLE IF NOT EXISTS design_sessions (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      company TEXT,
      requirements TEXT NOT NULL DEFAULT '',
      estimates TEXT NOT NULL DEFAULT '',
      decisions TEXT NOT NULL DEFAULT '',
      tradeoffs TEXT NOT NULL DEFAULT '',
      feedback TEXT NOT NULL DEFAULT '',
      followups TEXT NOT NULL DEFAULT '',
      self_rating INTEGER,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      title TEXT NOT NULL,
      competencies TEXT NOT NULL DEFAULT '[]',  -- JSON string[]
      situation TEXT NOT NULL DEFAULT '',
      task TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL DEFAULT '',
      result TEXT NOT NULL DEFAULT '',
      rehearsal_count INTEGER NOT NULL DEFAULT 0,
      last_practiced TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ai_sessions (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      kind TEXT NOT NULL,          -- coding | system-design | behavioral
      reference TEXT NOT NULL DEFAULT '',
      transcript TEXT NOT NULL DEFAULT '[]',  -- JSON TutorTurn[]
      created_at TEXT NOT NULL
    );
    `,
  },
  {
    version: 3,
    description: "Sync metadata: device id, sync folder, merge watermark",
    sql: `
    -- meta table (from v1) stores: schema_version, device_id, sync_folder, last_merge_at
    CREATE INDEX IF NOT EXISTS idx_attempts_device ON attempts(device_id);
    `,
  },
];
