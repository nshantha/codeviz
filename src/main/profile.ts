import { getDb } from "./db";
import type { Profile } from "../shared/types";

const nowIso = () => new Date().toISOString();

export function getProfileInternal(): Profile | null {
  const row = getDb().prepare("SELECT data FROM profile WHERE id = 1").get() as { data: string } | undefined;
  return row ? (JSON.parse(row.data) as Profile) : null;
}

export function saveProfileInternal(p: Profile): Profile {
  const saved: Profile = { ...p, updatedAt: nowIso() };
  if (!p.createdAt) saved.createdAt = nowIso();
  getDb()
    .prepare(
      `INSERT INTO profile (id, data, updated_at) VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    )
    .run(JSON.stringify(saved), saved.updatedAt);
  return saved;
}
