import fs from "node:fs";
import { getDb, getDeviceId, getMetaValue, setMetaValue } from "../db";
import { importBackup, readBackup, buildBackup, recomputeDerivedState } from "./backup";
import { getSyncFolder, readAllEvents, deviceLogPathFor, type SyncEvent } from "./events";

/**
 * Milestone 3 — synced-folder event log sync.
 *
 * Each device writes ONLY to its own append-only JSONL file inside a
 * user-selected folder (OneDrive/Dropbox). The app merges all device logs by
 * importing unseen event UUIDs. The live SQLite file is never synced.
 *
 * Event model: { event_id, device_id, ts, entity, action, payload }
 * - attempts: immutable, unioned by event_id (= attempt id)
 * - design_sessions / stories: newest-wins by updated_at; when both sides
 *   changed the same base revision, keep a conflict copy
 * - deletes: tombstone events so deletes don't resurrect
 */


/**
 * Deterministic merge of all device logs into the local database.
 * - attempts: union by id (immutable)
 * - design_sessions/stories: newest updated_at wins; divergent edits of the
 *   same base keep a conflict copy (title suffixed " (conflict <device>)")
 * - tombstones: mark deleted so the row doesn't reappear
 * Returns { merged, conflicts }.
 */
export function mergeSyncFolder(): { merged: number; conflicts: number } {
  const folder = getSyncFolder();
  if (!folder) throw new Error("No sync folder configured.");
  const db = getDb();
  const seenKey = "sync_seen_ids";
  const seen: Set<string> = new Set(JSON.parse(getMetaValue(seenKey) ?? "[]"));
  let merged = 0;
  let conflicts = 0;

  const tx = db.transaction(() => {
    for (const e of readAllEvents(folder)) {
      if (seen.has(e.event_id)) continue;
      seen.add(e.event_id);

      if (e.entity === "attempt" && e.action === "upsert") {
        const p = e.payload as Record<string, number | string | null>;
        const r = db.prepare(
          `INSERT OR IGNORE INTO attempts (id, device_id, question_id, started_at, ended_at, active_ms, elapsed_ms,
             outcome, hints_used, confidence, pattern_identified_unaided, label_shown, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          e.event_id, e.device_id, p.question_id, p.started_at, p.ended_at, p.active_ms, p.elapsed_ms,
          p.outcome, p.hints_used, p.confidence, p.pattern_identified_unaided, p.label_shown, p.notes, e.ts,
        );
        merged += r.changes;
      } else if ((e.entity === "design_session" || e.entity === "story") && e.action === "upsert") {
        const table = e.entity === "design_session" ? "design_sessions" : "stories";
        const p = e.payload as Record<string, string | number | null>;
        const cur = db.prepare(`SELECT updated_at AS updatedAt, device_id AS deviceId FROM ${table} WHERE id = ?`).get(e.event_id) as
          | { updatedAt: string; deviceId: string } | undefined;
        if (!cur) {
          insertEditable(table, e);
          merged++;
        } else if ((p.updated_at as string) > cur.updatedAt) {
          if (cur.deviceId !== e.device_id && baseRevisionChanged(table, e.event_id, p)) {
            // Both sides edited the same base — keep a conflict copy, apply newest
            insertConflictCopy(table, e);
            conflicts++;
          }
          updateEditable(table, e);
          merged++;
        }
      } else if (e.action === "delete") {
        const table = e.entity === "design_session" ? "design_sessions" : e.entity === "story" ? "stories" : null;
        if (table) {
          const r = db.prepare(`UPDATE ${table} SET deleted = 1 WHERE id = ?`).run(e.event_id);
          merged += r.changes;
        }
      }
    }
  });
  tx();

  setMetaValue(seenKey, JSON.stringify([...seen].slice(-20000))); // cap memory
  setMetaValue("last_merge_at", new Date().toISOString());

  // Derived state is always recomputed from merged attempts
  recomputeDerivedState();

  return { merged, conflicts };
}

function insertEditable(table: string, e: SyncEvent): void {
  const p = e.payload as Record<string, string | number | null>;
  if (table === "design_sessions") {
    getDb().prepare(
      `INSERT OR IGNORE INTO design_sessions (id, device_id, prompt, company, requirements, estimates, decisions, tradeoffs, feedback, followups, self_rating, started_at, ended_at, created_at, updated_at, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ).run(e.event_id, e.device_id, p.prompt, p.company, p.requirements, p.estimates, p.decisions, p.tradeoffs, p.feedback, p.followups, p.self_rating, p.started_at, p.ended_at, e.ts, p.updated_at);
  } else {
    getDb().prepare(
      `INSERT OR IGNORE INTO stories (id, device_id, title, competencies, situation, task, action, result, rehearsal_count, last_practiced, created_at, updated_at, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ).run(e.event_id, e.device_id, p.title, p.competencies, p.situation, p.task, p.action, p.result, p.rehearsal_count, p.last_practiced, e.ts, p.updated_at);
  }
}

function updateEditable(table: string, e: SyncEvent): void {
  const p = e.payload as Record<string, string | number | null>;
  if (table === "design_sessions") {
    getDb().prepare(
      `UPDATE design_sessions SET prompt=?, company=?, requirements=?, estimates=?, decisions=?, tradeoffs=?, feedback=?, followups=?, self_rating=?, ended_at=?, updated_at=?, device_id=? WHERE id=?`,
    ).run(p.prompt, p.company, p.requirements, p.estimates, p.decisions, p.tradeoffs, p.feedback, p.followups, p.self_rating, p.ended_at, p.updated_at, e.device_id, e.event_id);
  } else {
    getDb().prepare(
      `UPDATE stories SET title=?, competencies=?, situation=?, task=?, action=?, result=?, rehearsal_count=?, last_practiced=?, updated_at=?, device_id=? WHERE id=?`,
    ).run(p.title, p.competencies, p.situation, p.task, p.action, p.result, p.rehearsal_count, p.last_practiced, p.updated_at, e.device_id, e.event_id);
  }
}

/** True when the incoming edit's base differs from what we have (both sides moved). */
function baseRevisionChanged(table: string, id: string, incoming: Record<string, string | number | null>): boolean {
  // Without per-field base tracking, treat "both devices edited and timestamps differ
  // within the merge window" as a conflict. Conservative: only flag when the local
  // row was also modified after the last successful merge.
  const lastMerge = getMetaValue("last_merge_at");
  if (!lastMerge) return false;
  const cur = getDb().prepare(`SELECT updated_at AS updatedAt FROM ${table} WHERE id = ?`).get(id) as { updatedAt: string } | undefined;
  return !!cur && cur.updatedAt > lastMerge && (incoming.updated_at as string) > lastMerge;
}

function insertConflictCopy(table: string, e: SyncEvent): void {
  const p = { ...(e.payload as Record<string, string | number | null>) };
  const conflictId = `${e.event_id}-conflict-${e.device_id.slice(0, 6)}`;
  if (table === "design_sessions") {
    getDb().prepare(
      `INSERT OR IGNORE INTO design_sessions (id, device_id, prompt, company, requirements, estimates, decisions, tradeoffs, feedback, followups, self_rating, started_at, ended_at, created_at, updated_at, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ).run(conflictId, e.device_id, `${p.prompt} (conflict ${e.device_id.slice(0, 6)})`, p.company, p.requirements, p.estimates, p.decisions, p.tradeoffs, p.feedback, p.followups, p.self_rating, p.started_at, p.ended_at, e.ts, p.updated_at);
  } else {
    getDb().prepare(
      `INSERT OR IGNORE INTO stories (id, device_id, title, competencies, situation, task, action, result, rehearsal_count, last_practiced, created_at, updated_at, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ).run(conflictId, e.device_id, `${p.title} (conflict ${e.device_id.slice(0, 6)})`, p.competencies, p.situation, p.task, p.action, p.result, p.rehearsal_count, p.last_practiced, e.ts, p.updated_at);
  }
}

/** Write the full local state as this device's own log (bootstrap / repair). */
export function rewriteDeviceLog(): { events: number } {
  const folder = getSyncFolder();
  if (!folder) throw new Error("No sync folder configured.");
  const backup = buildBackup();
  const deviceId = getDeviceId();
  const lines: string[] = [];
  for (const a of backup.attempts) {
    if (a.deviceId !== deviceId) continue;
    lines.push(JSON.stringify({ event_id: a.id, device_id: deviceId, ts: a.createdAt, entity: "attempt", action: "upsert", payload: a }));
  }
  for (const s of [...backup.designSessions, ...backup.stories]) {
    if (s.deviceId !== deviceId) continue;
    const entity = "prompt" in s ? "design_session" : "story";
    lines.push(JSON.stringify({ event_id: s.id, device_id: deviceId, ts: s.createdAt, entity, action: "upsert", payload: s }));
  }
  fs.writeFileSync(deviceLogPathFor(folder, deviceId), lines.join("\n") + (lines.length ? "\n" : ""), "utf8");
  return { events: lines.length };
}

export function getSyncStatusInternal(): { folder: string | null; deviceId: string; pendingEvents: number; lastMerge: string | null } {
  const folder = getSyncFolder();
  let pending = 0;
  if (folder) {
    const seen: Set<string> = new Set(JSON.parse(getMetaValue("sync_seen_ids") ?? "[]"));
    for (const e of readAllEvents(folder)) {
      if (!seen.has(e.event_id)) pending++;
    }
  }
  return {
    folder,
    deviceId: getDeviceId(),
    pendingEvents: pending,
    lastMerge: getMetaValue("last_merge_at"),
  };
}

// Re-export for IPC convenience
export { readBackup, importBackup };

