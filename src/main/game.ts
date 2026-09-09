import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { targetMsFor } from "./learning/sm2";
import { masteryBand } from "./learning/knowledge";
import { getPlanInternal } from "./learning/plan";
import { getProfileInternal } from "./profile";
import type {
  Achievement,
  AttemptOutcome,
  Difficulty,
  GameState,
  JourneyDay,
  JourneyWeek,
  PatternRing,
  RingTier,
} from "../shared/types";

/**
 * Game layer: XP, levels, rings, achievements, heatmap, journey map.
 *
 * Everything here is DERIVED from the append-only attempt log (plus the
 * drill-completion and mock-session logs). Nothing is stored as primary
 * truth except the unlocked-achievement markers, which are idempotent
 * (re-derivable by re-running evaluation).
 *
 * The economy is deliberately stingy: XP flows to learning behaviors
 * (unaided identification, no-hint solves, on-time reviews, mixed-mode
 * solves, beating target time) and is halved for re-solves, so the game
 * fights "solve 150 once and move on" instead of feeding it.
 */

interface AttemptRow {
  id: string;
  question_id: number;
  active_ms: number;
  outcome: AttemptOutcome;
  hints_used: number;
  pattern_identified_unaided: number | null;
  label_shown: number;
  created_at: string;
  ended_at: string;
  difficulty: Difficulty;
}

function allAttemptRows(): AttemptRow[] {
  const rows = getDb()
    .prepare(
      `SELECT a.id, a.question_id, a.active_ms, a.outcome, a.hints_used,
              a.pattern_identified_unaided, a.label_shown, a.created_at, a.ended_at,
              q.difficulty
       FROM attempts a JOIN questions q ON q.leetcode_id = a.question_id
       ORDER BY a.created_at ASC`,
    )
    .all() as {
    id: string; question_id: number; active_ms: number; outcome: string;
    hints_used: number; pattern_identified_unaided: number | null; label_shown: number;
    created_at: string; ended_at: string; difficulty: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    question_id: r.question_id,
    active_ms: r.active_ms,
    outcome: r.outcome as AttemptOutcome,
    hints_used: r.hints_used,
    pattern_identified_unaided: r.pattern_identified_unaided,
    label_shown: r.label_shown,
    created_at: r.created_at,
    ended_at: r.ended_at,
    difficulty: r.difficulty as Difficulty,
  }));
}

/** XP for one attempt. `seen` tracks question ids already counted (for re-solve dampening). */
function xpForAttempt(a: AttemptRow, seen: Set<number>): number {
  const isFirst = !seen.has(a.question_id);
  const solved = a.outcome === "solved";
  let xp = solved ? 10 : a.outcome === "partial" ? 5 : 2;

  if (a.hints_used < 3) {
    if (a.pattern_identified_unaided === 1) xp += 50; // unaided pattern identification
    if (solved && a.hints_used === 0) xp += 40; // clean solve
    if (solved && !isFirst && a.hints_used <= 1) xp += 30; // on-time review pass
    if (solved && a.label_shown === 0) xp += 25; // hidden-label mixed-mode solve
    if (solved && a.active_ms < targetMsFor(a.difficulty)) xp += 20; // beat the clock
  }
  if (!isFirst) xp = Math.round(xp * 0.5); // re-solves earn half
  return Math.min(xp, 150);
}

/** Total XP across attempts, drill completions, and finished mocks. */
export function totalXp(): number {
  const rows = allAttemptRows();
  const seen = new Set<number>();
  let xp = 0;
  for (const r of rows) {
    xp += xpForAttempt(r, seen);
    seen.add(r.question_id);
  }
  const drills = getDb().prepare("SELECT COUNT(*) AS c FROM drill_completions").get() as { c: number };
  xp += drills.c * 15;
  const mocks = getDb().prepare("SELECT COUNT(*) AS c FROM mock_sessions WHERE ended_at IS NOT NULL").get() as { c: number };
  xp += mocks.c * 100;
  return xp;
}

/** XP needed to REACH level n (level 1 = 0 XP). */
export function xpForLevel(n: number): number {
  return 50 * n * (n - 1);
}

export function levelForXp(xp: number): number {
  let n = 1;
  while (xp >= xpForLevel(n + 1)) n++;
  return n;
}

// ---------------------------------------------------------------- achievements

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  check: (ctx: AchievementCtx) => boolean;
}

interface AchievementCtx {
  attempts: AttemptRow[];
  drillCount: number;
  completedMocks: number;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: "first-blood", name: "First Blood", description: "Solve your first problem.", check: (c) => c.attempts.some((a) => a.outcome === "solved") },
  { id: "clean-solve", name: "Clean Solve", description: "Solve a problem with zero hints.", check: (c) => c.attempts.some((a) => a.outcome === "solved" && a.hints_used === 0) },
  { id: "pattern-eye", name: "Pattern Eye", description: "Identify a pattern unaided in mixed mode.", check: (c) => c.attempts.some((a) => a.pattern_identified_unaided === 1) },
  { id: "mixed-mode", name: "Mixed Martial Artist", description: "Solve a problem with the pattern label hidden.", check: (c) => c.attempts.some((a) => a.outcome === "solved" && a.label_shown === 0) },
  { id: "speedster", name: "Speedster", description: "Beat the target time on a Medium or Hard.", check: (c) => c.attempts.some((a) => a.outcome === "solved" && a.difficulty !== "Easy" && a.active_ms < targetMsFor(a.difficulty)) },
  { id: "pair-slayer", name: "Pair Slayer", description: "Complete a confusable-pair discrimination drill.", check: (c) => c.drillCount >= 1 },
  {
    id: "retention-7", name: "Steel Trap", description: "Re-solve a problem 7+ days after first seeing it.",
    check: (c) => {
      const firstSeen = new Map<number, string>();
      for (const a of c.attempts) {
        const f = firstSeen.get(a.question_id);
        if (!f) { firstSeen.set(a.question_id, a.created_at); continue; }
        if (a.outcome === "solved" && daysBetween(f, a.created_at) >= 7) return true;
      }
      return false;
    },
  },
  {
    id: "week-warrior", name: "Week Warrior", description: "Practice on 5+ days in a single week.",
    check: (c) => {
      const byWeek = new Map<string, Set<string>>();
      for (const a of c.attempts) {
        const d = new Date(a.created_at);
        const wk = weekKey(d);
        if (!byWeek.has(wk)) byWeek.set(wk, new Set());
        byWeek.get(wk)!.add(a.created_at.slice(0, 10));
      }
      return [...byWeek.values()].some((days) => days.size >= 5);
    },
  },
  { id: "mock-complete", name: "Boss Fight Cleared", description: "Complete a Friday Mock interview.", check: (c) => c.completedMocks >= 1 },
  { id: "grinder", name: "Grinder", description: "Log 50 attempts.", check: (c) => c.attempts.length >= 50 },
  {
    id: "comeback", name: "Comeback", description: "Solve a problem you once gave up on.",
    check: (c) => {
      const gaveUp = new Set<number>();
      for (const a of c.attempts) {
        if (a.outcome === "gave_up") gaveUp.add(a.question_id);
        else if (a.outcome === "solved" && gaveUp.has(a.question_id)) return true;
      }
      return false;
    },
  },
];

function daysBetween(aIso: string, bIso: string): number {
  return (new Date(bIso).getTime() - new Date(aIso).getTime()) / 86_400_000;
}

function weekKey(d: Date): string {
  const monday = new Date(d);
  const dow = (d.getDay() + 6) % 7;
  monday.setDate(d.getDate() - dow);
  return monday.toISOString().slice(0, 10);
}

function achievementCtx(): AchievementCtx {
  const drills = getDb().prepare("SELECT COUNT(*) AS c FROM drill_completions").get() as { c: number };
  const mocks = getDb().prepare("SELECT COUNT(*) AS c FROM mock_sessions WHERE ended_at IS NOT NULL").get() as { c: number };
  return { attempts: allAttemptRows(), drillCount: drills.c, completedMocks: mocks.c };
}

/**
 * Evaluate all achievements against the logs, persist newly unlocked ones,
 * and return the newly unlocked set (for celebration UI).
 */
export function evaluateNewAchievements(): Achievement[] {
  const ctx = achievementCtx();
  const unlockedRows = getDb().prepare("SELECT id, unlocked_at FROM achievements").all() as { id: string; unlocked_at: string }[];
  const have = new Set(unlockedRows.map((r) => r.id));
  const now = new Date().toISOString();
  const fresh: Achievement[] = [];
  const insert = getDb().prepare("INSERT OR IGNORE INTO achievements (id, unlocked_at) VALUES (?, ?)");
  for (const def of ACHIEVEMENT_DEFS) {
    if (have.has(def.id)) continue;
    let ok = false;
    try { ok = def.check(ctx); } catch { ok = false; }
    if (ok) {
      insert.run(def.id, now);
      fresh.push({ id: def.id, name: def.name, description: def.description, unlockedAt: now });
    }
  }
  return fresh;
}

export function listAchievements(): Achievement[] {
  const rows = getDb().prepare("SELECT id, unlocked_at FROM achievements").all() as { id: string; unlocked_at: string }[];
  const map = new Map(rows.map((r) => [r.id, r.unlocked_at]));
  return ACHIEVEMENT_DEFS.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    unlockedAt: map.get(d.id) ?? null,
  }));
}

// ---------------------------------------------------------------- rings

const BAND_TO_RING: Record<string, RingTier> = {
  unstarted: "none",
  learning: "bronze",
  practicing: "silver",
  strong: "gold",
  mastered: "mastered",
};

function patternRings(): PatternRing[] {
  const rows = getDb().prepare("SELECT pattern, mastery, problems_attempted, problems_solved FROM pattern_state").all() as {
    pattern: string; mastery: number; problems_attempted: number; problems_solved: number;
  }[];
  return rows.map((r) => ({
    pattern: r.pattern,
    tier: BAND_TO_RING[masteryBand(r.mastery, r.problems_attempted)] ?? "none",
    mastery: r.mastery,
    attempted: r.problems_attempted,
    solved: r.problems_solved,
  }));
}

// ---------------------------------------------------------------- heatmap & weekly ring

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function heatmap(days = 120): Record<string, number> {
  const out: Record<string, number> = {};
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out[dateKey(d)] = 0;
  }
  const rows = getDb()
    .prepare(
      `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS c FROM attempts
       WHERE created_at >= date('now', ?) GROUP BY day`,
      // date('now', '-120 days')
    )
    .all(`-${days} days`) as { day: string; c: number }[];
  for (const r of rows) if (r.day in out) out[r.day] = r.c;
  return out;
}

/** Monday..Sunday of the current week. */
function weeklyDays(): JourneyDay[] {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow);
  const rows = getDb()
    .prepare(
      `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS c FROM attempts
       WHERE created_at >= date('now', 'weekday 0', '-7 days') GROUP BY day`,
    )
    .all() as { day: string; c: number }[];
  const counts = new Map(rows.map((r) => [r.day, r.c]));
  const days: JourneyDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = dateKey(d);
    const c = counts.get(key) ?? 0;
    days.push({ date: key, active: c > 0, attempts: c });
  }
  return days;
}

// ---------------------------------------------------------------- journey map

function journey(): { weeks: JourneyWeek[]; currentWeek: number } {
  const plan = getPlanInternal();
  const profile = getProfileInternal();
  if (!plan || !profile) return { weeks: [], currentWeek: 1 };

  const start = new Date(profile.createdAt);
  const daysSince = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000));
  const currentWeek = Math.min(8, Math.floor(daysSince / 7) + 1);

  const rows = getDb()
    .prepare(`SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS c FROM attempts GROUP BY day`)
    .all() as { day: string; c: number }[];
  const counts = new Map(rows.map((r) => [r.day, r.c]));

  const weeks: JourneyWeek[] = plan.weeks.slice(0, 8).map((w) => {
    const days: JourneyDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + (w.week - 1) * 7 + i);
      const key = dateKey(d);
      const c = counts.get(key) ?? 0;
      days.push({ date: key, active: c > 0, attempts: c });
    }
    return {
      week: w.week,
      title: w.title,
      focus: w.focus,
      days,
      isCurrent: w.week === currentWeek,
      isPast: w.week < currentWeek,
    };
  });
  return { weeks, currentWeek };
}

// ---------------------------------------------------------------- public API

export function getGameStateInternal(): GameState {
  evaluateNewAchievements(); // backfill anything unlocked by imports/merges
  const xp = totalXp();
  const level = levelForXp(xp);
  const weekly = weeklyDays();
  const attempts = allAttemptRows();
  return {
    xp,
    level,
    xpIntoLevel: xp - xpForLevel(level),
    xpForNextLevel: xpForLevel(level + 1) - xpForLevel(level),
    rings: patternRings(),
    weeklyDays: weekly,
    weeklyActiveCount: weekly.filter((d) => d.active).length,
    heatmap: heatmap(120),
    achievements: listAchievements(),
    journey: journey(),
    totals: {
      attempts: attempts.length,
      solved: attempts.filter((a) => a.outcome === "solved").length,
      unaidedIds: attempts.filter((a) => a.pattern_identified_unaided === 1).length,
      noHintSolves: attempts.filter((a) => a.outcome === "solved" && a.hints_used === 0).length,
    },
  };
}

/** Record a finished confusable-pair drill. Returns newly unlocked achievements. */
export function recordDrillCompletionInternal(pairA: string, pairB: string): { unlocked: Achievement[] } {
  getDb()
    .prepare("INSERT INTO drill_completions (id, pair_a, pair_b, completed_at) VALUES (?, ?, ?, ?)")
    .run(randomUUID(), pairA, pairB, new Date().toISOString());
  return { unlocked: evaluateNewAchievements() };
}
