import { randomUUID } from "node:crypto";
import { getDb, getDeviceId } from "./db";
import { appendEvent } from "./sync/events";
import { catalogMeta } from "./data/seed";
import type { BehavioralQuestion, Company, Story } from "../shared/types";

const nowIso = () => new Date().toISOString();

function rowToStory(r: Record<string, unknown>): Story {
  return {
    id: r.id as string,
    deviceId: r.device_id as string,
    title: r.title as string,
    competencies: JSON.parse((r.competencies as string) ?? "[]"),
    situation: (r.situation as string) ?? "",
    task: (r.task as string) ?? "",
    action: (r.action as string) ?? "",
    result: (r.result as string) ?? "",
    rehearsalCount: (r.rehearsal_count as number) ?? 0,
    lastPracticed: (r.last_practiced as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function listStoriesInternal(): Story[] {
  const rows = getDb().prepare("SELECT * FROM stories WHERE deleted = 0 ORDER BY updated_at DESC").all() as Record<string, unknown>[];
  return rows.map(rowToStory);
}

export function saveStoryInternal(input: Partial<Story> & { title: string }): Story {
  const db = getDb();
  const now = nowIso();
  const existing = input.id
    ? (db.prepare("SELECT * FROM stories WHERE id = ?").get(input.id) as Record<string, unknown> | undefined)
    : undefined;

  const story: Story = {
    id: input.id ?? randomUUID(),
    deviceId: input.deviceId ?? getDeviceId(),
    title: input.title,
    competencies: input.competencies ?? JSON.parse((existing?.competencies as string) ?? "[]"),
    situation: input.situation ?? (existing?.situation as string) ?? "",
    task: input.task ?? (existing?.task as string) ?? "",
    action: input.action ?? (existing?.action as string) ?? "",
    result: input.result ?? (existing?.result as string) ?? "",
    rehearsalCount: input.rehearsalCount ?? (existing?.rehearsal_count as number) ?? 0,
    lastPracticed: input.lastPracticed ?? (existing?.last_practiced as string | null) ?? null,
    createdAt: (existing?.created_at as string) ?? now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO stories (id, device_id, title, competencies, situation, task, action, result, rehearsal_count, last_practiced, created_at, updated_at, deleted)
     VALUES (@id, @deviceId, @title, @competencies, @situation, @task, @action, @result, @rehearsalCount, @lastPracticed, @createdAt, @updatedAt, 0)
     ON CONFLICT(id) DO UPDATE SET
       title=excluded.title, competencies=excluded.competencies, situation=excluded.situation,
       task=excluded.task, action=excluded.action, result=excluded.result,
       rehearsal_count=excluded.rehearsal_count, last_practiced=excluded.last_practiced,
       updated_at=excluded.updated_at`,
  ).run({ ...story, competencies: JSON.stringify(story.competencies), lastPracticed: story.lastPracticed ?? null });

  appendEvent("story", "upsert", { ...story });
  return story;
}

export function deleteStoryInternal(id: string): void {
  const db = getDb();
  db.prepare("UPDATE stories SET deleted = 1, updated_at = ? WHERE id = ?").run(nowIso(), id);
  appendEvent("tombstone", "delete", { id, entity: "story" });
}

export function rehearseStoryInternal(id: string): Story {
  const db = getDb();
  const now = nowIso();
  db.prepare("UPDATE stories SET rehearsal_count = rehearsal_count + 1, last_practiced = ?, updated_at = ? WHERE id = ?").run(now, now, id);
  const row = db.prepare("SELECT * FROM stories WHERE id = ?").get(id) as Record<string, unknown>;
  const story = rowToStory(row);
  appendEvent("story", "upsert", { ...story });
  return story;
}

/** Concrete behavioral questions per company, from the FAANG research (section 5). */
export function listBehavioralQuestionsInternal(company?: Company): BehavioralQuestion[] {
  const meta = catalogMeta();
  const out: BehavioralQuestion[] = [];

  // Prefer structured research shelves (clean questions + signal tags).
  const shelves = (meta.researchShelves ?? []).filter(
    (s) => s.type === "behavioral" && (!company || s.company === company),
  );
  for (const s of shelves) {
    const tags = s.body ? [s.body.split(".")[0]] : [];
    out.push({ question: s.title, company: (s.company as Company) || null, tags });
  }

  // Fall back to parsed report bullets when a company has no shelves.
  if (out.length === 0) {
    const beh = meta.behavioral;
    const companies = company ? [company] : Object.keys(beh);
    for (const c of companies) {
      const bullets = beh[c]?.bullets ?? [];
      for (const b of bullets) {
        // strip markdown emphasis and parenthetical LP mappings for the question text
        const tags: string[] = [];
        const tagMatch = b.match(/\*\(([^)]+)\)\*$/);
        const question = (tagMatch ? b.slice(0, tagMatch.index) : b).replace(/\*\*/g, "").trim();
        if (tagMatch) tags.push(tagMatch[1]);
        out.push({ question, company: c as Company, tags });
      }
    }
  }
  return out;
}
