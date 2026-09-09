import fs from "node:fs";
import path from "node:path";
import { getDb } from "../db";

interface CatalogQuestion {
  leetcode_id: number;
  title: string;
  difficulty: string;
  pattern: string;
  leetcode_url: string;
  neetcode150: boolean;
  companies: { company: string; section: string }[];
}

function catalogPath(): string {
  const candidates = [
    path.join(__dirname, "catalog.json"), // dist/main/data/catalog.json (built)
    path.join(__dirname, "data", "catalog.json"),
    // dev fallback: dist/main/data -> repo root -> src/main/data/catalog.json
    path.join(__dirname, "..", "..", "..", "src", "main", "data", "catalog.json"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(
    "catalog.json not found. Run `npm run build:data` (or `npm run build`) to copy it into dist.",
  );
}

/** Seed the question catalog on first run. Idempotent. */
export function seedCatalog(): { seeded: boolean; count: number } {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) AS c FROM questions").get() as { c: number };
  if (row.c > 0) return { seeded: false, count: row.c };

  const raw = JSON.parse(fs.readFileSync(catalogPath(), "utf8")) as { questions: CatalogQuestion[] };
  const insert = db.prepare(
    `INSERT INTO questions (leetcode_id, title, difficulty, pattern, leetcode_url, neetcode150, companies)
     VALUES (@leetcode_id, @title, @difficulty, @pattern, @leetcode_url, @neetcode150, @companies)`,
  );
  const tx = db.transaction(() => {
    for (const q of raw.questions) {
      insert.run({
        leetcode_id: q.leetcode_id,
        title: q.title,
        difficulty: q.difficulty,
        pattern: q.pattern,
        leetcode_url: q.leetcode_url,
        neetcode150: q.neetcode150 ? 1 : 0,
        companies: JSON.stringify(q.companies),
      });
    }
  });
  tx();
  return { seeded: true, count: raw.questions.length };
}

export interface ResearchShelf {
  type: "system-design" | "behavioral" | string;
  company: string;
  title: string;
  body: string;
}

export interface CatalogMeta {
  patterns: string[];
  banks: Record<string, { core: number[]; gaps: number[]; breadth: number[] }>;
  system_design: Record<string, { prompts: string[]; grading: string[]; caveats: string[] }>;
  behavioral: Record<string, { bullets: string[] }>;
  researchShelves?: ResearchShelf[];
}

export function catalogMeta(): CatalogMeta {
  const raw = JSON.parse(fs.readFileSync(catalogPath(), "utf8")) as CatalogMeta;
  return raw;
}
