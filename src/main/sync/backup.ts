import fs from "node:fs";
import { getDb, getDeviceId } from "../db";
import { appVersion, dataDir } from "../paths";
import type { Attempt, BackupData, DesignSession, ImportPreview, Profile, ReviewItem, Story } from "../../shared/types";
import { getProfileInternal } from "../profile";
import { listAttemptsInternal, getQuestionInternal } from "../learning/engine";
import { getPatternStatesInternal } from "../learning/scheduler";
import { calculateSM2, performanceToQuality, targetMsFor } from "../learning/sm2";
import { updateMastery, PRIOR } from "../learning/knowledge";

const nowIso = () => new Date().toISOString();

function all<T>(sql: string): T[] {
  return getDb().prepare(sql).all() as T[];
}

export function buildBackup(): BackupData {
  const attempts = listAttemptsInternal();
  const patternStates = getPatternStatesInternal();
  const reviewItems = all<ReviewItem>("SELECT question_id AS questionId, ease, interval_days AS intervalDays, next_review AS nextReview, review_count AS reviewCount, lapses, last_outcome AS lastOutcome, updated_at AS updatedAt FROM review_items");
  const designSessions = all<DesignSession>(
    "SELECT id, device_id AS deviceId, prompt, company, requirements, estimates, decisions, tradeoffs, feedback, followups, self_rating AS selfRating, started_at AS startedAt, ended_at AS endedAt, created_at AS createdAt, updated_at AS updatedAt, deleted FROM design_sessions WHERE deleted = 0",
  );
  const stories = all<Story>(
    "SELECT id, device_id AS deviceId, title, competencies, situation, task, action, result, rehearsal_count AS rehearsalCount, last_practiced AS lastPracticed, created_at AS createdAt, updated_at AS updatedAt, deleted FROM stories WHERE deleted = 0",
  ).map((s) => ({ ...s, competencies: JSON.parse((s.competencies as unknown as string) ?? "[]") }));

  const counts = {
    attempts: attempts.length,
    patternStates: patternStates.length,
    reviewItems: reviewItems.length,
    designSessions: designSessions.length,
    stories: stories.length,
  };

  return {
    manifest: {
      format: "algomentor-backup",
      version: 1,
      appVersion: appVersion(),
      deviceId: getDeviceId(),
      exportedAt: nowIso(),
      counts,
    },
    profile: getProfileInternal(),
    attempts,
    patternStates,
    reviewItems,
    designSessions,
    stories,
  };
}

export function writeBackup(filePath: string): { path: string; counts: Record<string, number> } {
  const data = buildBackup();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 1), "utf8");
  return { path: filePath, counts: data.manifest.counts };
}

export function readBackup(filePath: string): BackupData {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as BackupData;
  if (raw.manifest?.format !== "algomentor-backup" || raw.manifest?.version !== 1) {
    throw new Error("Not a valid .algomentor backup (bad manifest).");
  }
  return raw;
}

/** Dry-run: what would merge-import add, update, or skip? */
export function previewImport(filePath: string): ImportPreview {
  const data = readBackup(filePath);
  const db = getDb();

  const existingAttempts = new Set(
    (db.prepare("SELECT id FROM attempts").all() as { id: string }[]).map((r) => r.id),
  );
  let addA = 0, skipA = 0;
  for (const a of data.attempts) {
    if (existingAttempts.has(a.id)) skipA++;
    else addA++;
  }

  const previewEditable = (table: string, items: { id: string; updatedAt: string }[]) => {
    const rows = db.prepare(`SELECT id, updated_at AS updatedAt FROM ${table} WHERE deleted = 0`).all() as { id: string; updatedAt: string }[];
    const map = new Map(rows.map((r) => [r.id, r.updatedAt]));
    let add = 0, update = 0, skip = 0;
    for (const it of items) {
      const cur = map.get(it.id);
      if (!cur) add++;
      else if (it.updatedAt > cur) update++;
      else skip++;
    }
    return { add, update, skip };
  };

  return {
    attempts: { add: addA, skip: skipA },
    designSessions: previewEditable("design_sessions", data.designSessions),
    stories: previewEditable("stories", data.stories),
    patternStates: { recompute: data.attempts.length },
    reviewItems: { recompute: data.attempts.length },
  };
}

/**
 * Merge import: union immutable attempts by id; newest-wins for editable
 * design sessions and stories (keeping a conflict copy when both sides
 * changed the same base — see sync engine). Pattern/review state is
 * recomputed from the merged attempt log, never copied.
 */
export function importBackup(filePath: string, mode: "merge" | "replace"): { imported: Record<string, number> } {
  const data = readBackup(filePath);
  const db = getDb();

  if (mode === "replace") {
    // Automatic local backup first
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safety = `${dataDir()}/pre-replace-backup-${stamp}.algomentor`;
    writeBackup(safety);
    db.exec("DELETE FROM attempts; DELETE FROM pattern_state; DELETE FROM review_items; DELETE FROM design_sessions; DELETE FROM stories; DELETE FROM profile;");
  }

  const imported = { attempts: 0, designSessions: 0, stories: 0 };

  const tx = db.transaction(() => {
    const insAttempt = db.prepare(
      `INSERT OR IGNORE INTO attempts (id, device_id, question_id, started_at, ended_at, active_ms, elapsed_ms,
        outcome, hints_used, confidence, pattern_identified_unaided, label_shown, notes, created_at)
       VALUES (@id, @deviceId, @questionId, @startedAt, @endedAt, @activeMs, @elapsedMs,
        @outcome, @hintsUsed, @confidence, @patternIdentifiedUnaided, @labelShown, @notes, @createdAt)`,
    );
    for (const a of data.attempts) {
      const r = insAttempt.run({
        ...a,
        patternIdentifiedUnaided: a.patternIdentifiedUnaided === null ? null : a.patternIdentifiedUnaided ? 1 : 0,
        labelShown: a.labelShown ? 1 : 0,
      });
      imported.attempts += r.changes;
    }

    const upsertDesign = db.prepare(
      `INSERT INTO design_sessions (id, device_id, prompt, company, requirements, estimates, decisions, tradeoffs, feedback, followups, self_rating, started_at, ended_at, created_at, updated_at, deleted)
       VALUES (@id, @deviceId, @prompt, @company, @requirements, @estimates, @decisions, @tradeoffs, @feedback, @followups, @selfRating, @startedAt, @endedAt, @createdAt, @updatedAt, 0)
       ON CONFLICT(id) DO UPDATE SET
         prompt=excluded.prompt, company=excluded.company, requirements=excluded.requirements,
         estimates=excluded.estimates, decisions=excluded.decisions, tradeoffs=excluded.tradeoffs,
         feedback=excluded.feedback, followups=excluded.followups, self_rating=excluded.self_rating,
         ended_at=excluded.ended_at, updated_at=excluded.updated_at
       WHERE excluded.updated_at > design_sessions.updated_at`,
    );
    for (const s of data.designSessions) {
      const r = upsertDesign.run({ ...s, company: s.company ?? null, selfRating: s.selfRating ?? null, endedAt: s.endedAt ?? null });
      imported.designSessions += r.changes;
    }

    const upsertStory = db.prepare(
      `INSERT INTO stories (id, device_id, title, competencies, situation, task, action, result, rehearsal_count, last_practiced, created_at, updated_at, deleted)
       VALUES (@id, @deviceId, @title, @competencies, @situation, @task, @action, @result, @rehearsalCount, @lastPracticed, @createdAt, @updatedAt, 0)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title, competencies=excluded.competencies, situation=excluded.situation,
         task=excluded.task, action=excluded.action, result=excluded.result,
         rehearsal_count=excluded.rehearsal_count, last_practiced=excluded.last_practiced,
         updated_at=excluded.updated_at
       WHERE excluded.updated_at > stories.updated_at`,
    );
    for (const s of data.stories) {
      const r = upsertStory.run({
        ...s,
        competencies: JSON.stringify(s.competencies ?? []),
        lastPracticed: s.lastPracticed ?? null,
      });
      imported.stories += r.changes;
    }
  });
  tx();

  // Recompute derived state from the merged attempt log (never copy cached ratings)
  recomputeDerivedState();

  return { imported };
}

export function recomputeDerivedState(): void {
  const db = getDb();
  db.exec("DELETE FROM pattern_state; DELETE FROM review_items;");
  // Replay attempts in chronological order through the same pure functions used live.
  const rows = db.prepare("SELECT * FROM attempts ORDER BY created_at ASC").all() as {
    question_id: number; active_ms: number; outcome: string; hints_used: number;
    pattern_identified_unaided: number | null;
  }[];

  const patterns = new Map<string, { mastery: number; ease: number; interval: number; count: number; attempted: number; solved: number; lapses: number; next: string }>();
  const questions = new Map<number, { ease: number; interval: number; count: number; lapses: number; next: string; last: string }>();

  for (const r of rows) {
    const q = getQuestionInternal(r.question_id);
    if (!q) continue;
    const solved = r.outcome === "solved";
    const timeRatio = r.active_ms / targetMsFor(q.difficulty);
    const qState = questions.get(r.question_id) ?? { ease: 2.5, interval: 1, count: 0, lapses: 0, next: "", last: "" };
    const quality = performanceToQuality({ solved, hintsUsed: r.hints_used, timeRatio, previousAttempts: qState.count });

    const p = patterns.get(q.pattern) ?? { mastery: PRIOR, ease: 2.5, interval: 1, count: 0, attempted: 0, solved: 0, lapses: 0, next: "" };
    p.mastery = updateMastery(p.mastery, {
      solved,
      hintsUsed: r.hints_used,
      timeRatio,
      identifiedUnaided: r.pattern_identified_unaided === 1,
    });
    const sm2p = calculateSM2(quality, p.interval, p.ease, p.count);
    p.ease = sm2p.ease; p.interval = sm2p.intervalDays; p.count = sm2p.reviewCount;
    p.next = sm2p.nextReview.toISOString().slice(0, 10);
    p.attempted += 1; if (solved) p.solved += 1;
    if (quality < 3 && p.count > 0) p.lapses += 1;
    patterns.set(q.pattern, p);

    const sm2q = calculateSM2(quality, qState.interval, qState.ease, qState.count);
    qState.ease = sm2q.ease; qState.interval = sm2q.intervalDays; qState.count = sm2q.reviewCount;
    qState.next = sm2q.nextReview.toISOString().slice(0, 10);
    qState.last = r.outcome;
    if (quality < 3 && qState.count > 0) qState.lapses += 1;
    questions.set(r.question_id, qState);
  }

  const now = nowIso();
  const insP = db.prepare(
    `INSERT INTO pattern_state (pattern, mastery, ease, interval_days, next_review, review_count, lapses, problems_attempted, problems_solved, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insQ = db.prepare(
    `INSERT INTO review_items (question_id, ease, interval_days, next_review, review_count, lapses, last_outcome, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const tx = db.transaction(() => {
    for (const [pattern, p] of patterns) {
      insP.run(pattern, p.mastery, p.ease, p.interval, p.next || null, p.count, p.lapses, p.attempted, p.solved, now);
    }
    for (const [qid, q] of questions) {
      insQ.run(qid, q.ease, q.interval, q.next, q.count, q.lapses, q.last || null, now);
    }
  });
  tx();
}
