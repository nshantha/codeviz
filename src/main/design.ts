import { randomUUID } from "node:crypto";
import { getDb, getDeviceId } from "./db";
import { appendEvent } from "./sync/events";
import { catalogMeta } from "./data/seed";
import type { Company, DesignSession } from "../shared/types";

const nowIso = () => new Date().toISOString();

function rowToSession(r: Record<string, unknown>): DesignSession {
  return {
    id: r.id as string,
    deviceId: r.device_id as string,
    prompt: r.prompt as string,
    company: (r.company as DesignSession["company"]) ?? null,
    requirements: (r.requirements as string) ?? "",
    estimates: (r.estimates as string) ?? "",
    decisions: (r.decisions as string) ?? "",
    tradeoffs: (r.tradeoffs as string) ?? "",
    feedback: (r.feedback as string) ?? "",
    followups: (r.followups as string) ?? "",
    selfRating: (r.self_rating as number | null) ?? null,
    startedAt: r.started_at as string,
    endedAt: (r.ended_at as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function listDesignSessionsInternal(): DesignSession[] {
  const rows = getDb().prepare("SELECT * FROM design_sessions WHERE deleted = 0 ORDER BY updated_at DESC").all() as Record<string, unknown>[];
  return rows.map(rowToSession);
}

export function saveDesignSessionInternal(input: Partial<DesignSession> & { prompt: string }): DesignSession {
  const db = getDb();
  const now = nowIso();
  const existing = input.id
    ? (db.prepare("SELECT * FROM design_sessions WHERE id = ?").get(input.id) as Record<string, unknown> | undefined)
    : undefined;

  const session: DesignSession = {
    id: input.id ?? randomUUID(),
    deviceId: input.deviceId ?? getDeviceId(),
    prompt: input.prompt,
    company: input.company ?? existing?.company as DesignSession["company"] ?? null,
    requirements: input.requirements ?? (existing?.requirements as string) ?? "",
    estimates: input.estimates ?? (existing?.estimates as string) ?? "",
    decisions: input.decisions ?? (existing?.decisions as string) ?? "",
    tradeoffs: input.tradeoffs ?? (existing?.tradeoffs as string) ?? "",
    feedback: input.feedback ?? (existing?.feedback as string) ?? "",
    followups: input.followups ?? (existing?.followups as string) ?? "",
    selfRating: input.selfRating ?? (existing?.self_rating as number | null) ?? null,
    startedAt: input.startedAt ?? (existing?.started_at as string) ?? now,
    endedAt: input.endedAt ?? (existing?.ended_at as string | null) ?? null,
    createdAt: (existing?.created_at as string) ?? now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO design_sessions (id, device_id, prompt, company, requirements, estimates, decisions, tradeoffs, feedback, followups, self_rating, started_at, ended_at, created_at, updated_at, deleted)
     VALUES (@id, @deviceId, @prompt, @company, @requirements, @estimates, @decisions, @tradeoffs, @feedback, @followups, @selfRating, @startedAt, @endedAt, @createdAt, @updatedAt, 0)
     ON CONFLICT(id) DO UPDATE SET
       prompt=excluded.prompt, company=excluded.company, requirements=excluded.requirements,
       estimates=excluded.estimates, decisions=excluded.decisions, tradeoffs=excluded.tradeoffs,
       feedback=excluded.feedback, followups=excluded.followups, self_rating=excluded.self_rating,
       ended_at=excluded.ended_at, updated_at=excluded.updated_at`,
  ).run({ ...session, company: session.company ?? null, selfRating: session.selfRating ?? null, endedAt: session.endedAt ?? null });

  appendEvent("design_session", "upsert", { ...session });
  return session;
}

/** System design prompts per company, from the FAANG research (section 4). */
export function listDesignPromptsInternal(company?: string): { prompt: string; company: Company | null; grading: string[] }[] {
  const meta = catalogMeta();
  const out: { prompt: string; company: Company | null; grading: string[] }[] = [];

  // Prefer structured research shelves (clean titles + grading).
  const shelves = (meta.researchShelves ?? []).filter(
    (s: { type: string; company: string }) => s.type === "system-design" && (!company || s.company === company),
  );
  for (const s of shelves as { title: string; body: string; company: string }[]) {
    const grading = s.body.split(".").slice(1).join(".").trim();
    out.push({
      prompt: s.title,
      company: (s.company as Company) || null,
      grading: grading ? [grading] : [],
    });
  }

  // Fall back to parsed report bullets when a company has no shelves.
  if (out.length === 0) {
    const sd = meta.system_design;
    const companies = company ? [company] : Object.keys(sd);
    for (const c of companies) {
      const d = sd[c];
      if (!d) continue;
      for (const p of d.prompts) {
        out.push({ prompt: p, company: (c as Company) || null, grading: d.grading });
      }
    }
  }

  if (out.length === 0) {
    // Absolute fallback: generic prompts (never empty UI)
    out.push(
      { prompt: "Design a URL shortener", company: null, grading: ["Scale math", "Trade-off reasoning"] },
    );
  }
  return out;
}
