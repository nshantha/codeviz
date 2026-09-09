import { randomUUID } from "node:crypto";
import { getDb, getDeviceId } from "./db";
import { evaluateNewAchievements } from "./game";
import type { Achievement, MockKind, MockSession } from "../shared/types";

/**
 * Friday Mock sessions: timed mock interviews (coding, system-design,
 * behavioral) run by the AI interviewer, scored at debrief.
 * Completing a mock awards XP (via the game engine) and an achievement.
 */

function rowToMock(r: {
  id: string; device_id: string; kind: string; reference: string; score: number | null;
  notes: string; duration_ms: number | null; started_at: string; ended_at: string | null; created_at: string;
}): MockSession {
  return {
    id: r.id,
    deviceId: r.device_id,
    kind: r.kind as MockKind,
    reference: r.reference,
    score: r.score,
    notes: r.notes,
    durationMs: r.duration_ms,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    createdAt: r.created_at,
  };
}

export function saveMockSessionInternal(
  input: Partial<MockSession> & { kind: MockKind; reference: string },
): { session: MockSession; newAchievements: Achievement[] } {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = input.id
    ? (db.prepare("SELECT * FROM mock_sessions WHERE id = ?").get(input.id) as never | undefined)
    : undefined;

  const session: MockSession = {
    id: input.id ?? randomUUID(),
    deviceId: getDeviceId(),
    kind: input.kind,
    reference: input.reference,
    score: input.score ?? null,
    notes: input.notes ?? "",
    durationMs: input.durationMs ?? null,
    startedAt: input.startedAt ?? now,
    endedAt: input.endedAt ?? null,
    createdAt: now,
  };

  if (existing) {
    db.prepare(
      `UPDATE mock_sessions SET kind=@kind, reference=@reference, score=@score, notes=@notes,
        duration_ms=@durationMs, started_at=@startedAt, ended_at=@endedAt WHERE id=@id`,
    ).run({ ...session });
  } else {
    db.prepare(
      `INSERT INTO mock_sessions (id, device_id, kind, reference, score, notes, duration_ms, started_at, ended_at, created_at)
       VALUES (@id, @deviceId, @kind, @reference, @score, @notes, @durationMs, @startedAt, @endedAt, @createdAt)`,
    ).run({ ...session });
  }

  const newAchievements = session.endedAt ? evaluateNewAchievements() : [];
  return { session, newAchievements };
}

export function listMockSessionsInternal(): MockSession[] {
  const rows = getDb().prepare("SELECT * FROM mock_sessions ORDER BY created_at DESC").all() as never[];
  return (rows as Parameters<typeof rowToMock>[0][]).map(rowToMock);
}
