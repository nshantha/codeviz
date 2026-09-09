import type { Company, TutorRequest } from "../../shared/types";
import { getPatternLesson } from "../data/patterns";

/**
 * Built-in Socratic prompts sent to CLI tutors.
 * Ported from the archived competition codebase (backend/src/prompts/socratic-hints.ts):
 * five progressive hint levels; the tutor must teach, never hand over solutions.
 */

const SOCRATIC_CORE = `You are a patient coding-interview coach using the Socratic method.
Rules you MUST follow:
- NEVER give direct answers or complete solutions. Ask guiding questions that lead to discovery.
- Start with easier questions before harder ones; build on what the student already knows.
- Celebrate small wins; redirect gently when off track.
- Use compact ASCII traces, tables, or state diagrams when they improve understanding.
- Always require the student to state time and space complexity and to test edge cases manually.
- End with a short recall prompt (one question to remember the key idea).
- Adapt feedback to the target company and interview format named below.`;

const HINT_LEVEL_GUIDE = [
  "Level 1 — Clarifying: make sure they understand the problem and constraints. No pattern hints yet.",
  "Level 2 — Probing: guide toward pattern recognition. Ask what the input structure suggests.",
  "Level 3 — Implication: explore consequences of their approach. What breaks? What is the cost?",
  "Level 4 — Viewpoint: alternative perspectives. How else could this be viewed?",
  "Level 5 — Consequence: complexity, trade-offs, edge cases. Demand the analysis.",
];

export function buildTutorPrompt(req: TutorRequest): string {
  const ctx = req.context;
  const lines: string[] = [SOCRATIC_CORE, ""];

  if (req.kind === "coding") {
    lines.push(`Mode: CODING interview practice (Socratic tutoring).`);
    if (ctx.pattern) {
      const lesson = getPatternLesson(ctx.pattern);
      lines.push(`Problem pattern family: ${ctx.pattern}.`);
      if (lesson) {
        lines.push(`Recognition triggers for this pattern: ${lesson.triggers.join(" | ")}`);
        lines.push(`Common pitfalls: ${lesson.pitfalls.join(" | ")}`);
      }
    }
    if (ctx.difficulty) lines.push(`Difficulty: ${ctx.difficulty}.`);
    if (ctx.elapsedMs !== undefined) lines.push(`Elapsed solve time so far: ${Math.round(ctx.elapsedMs / 60000)} min.`);
    if (ctx.hintLevel !== undefined && ctx.hintLevel > 0) {
      lines.push(`Current hint level: ${ctx.hintLevel}/5. Follow this guide:\n${HINT_LEVEL_GUIDE.slice(0, ctx.hintLevel).join("\n")}`);
      lines.push(`Do NOT jump ahead of the hint level. One guiding question at a time.`);
    } else {
      lines.push(`Begin by asking for the student's understanding of the problem and their proposed approach.`);
    }
  } else if (req.kind === "system-design") {
    lines.push(`Mode: SYSTEM DESIGN interviewer.`);
    lines.push(`Withhold critique until natural checkpoints (after requirements, after high-level design, after deep dive).`);
    lines.push(`Probe trade-offs, failure modes, consistency choices, and capacity math. Ask "what breaks at 10x?"`);
    if (ctx.company) lines.push(`Company style: ${ctx.company} — adapt to its known grading tendencies.`);
  } else {
    lines.push(`Mode: BEHAVIORAL interviewer.`);
    lines.push(`Probe the user's REAL story only. Check evidence, personal ownership ("what did YOU do?"), and measurable outcomes.`);
    lines.push(`NEVER invent accomplishments or details for the candidate. If the story is thin, say so and ask for specifics.`);
    if (ctx.company) lines.push(`Company: ${ctx.company} — map follow-ups to its known values/signals.`);
  }

  if (ctx.company && req.kind === "coding") {
    lines.push(`Target company: ${ctx.company}.`);
  }

  lines.push("", "Conversation so far:");
  for (const t of req.history.slice(-10)) {
    lines.push(`${t.role === "user" ? "Student" : "Coach"}: ${t.text}`);
  }
  lines.push(`Student: ${req.userMessage}`, `Coach:`);
  return lines.join("\n");
}

export const COMPANY_LABEL: Record<Company, string> = {
  meta: "Meta",
  amazon: "Amazon",
  google: "Google",
  apple: "Apple",
  netflix: "Netflix",
};
