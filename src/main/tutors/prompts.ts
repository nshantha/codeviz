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
  const mode = req.mode ?? "practice";
  const lines: string[] = [SOCRATIC_CORE, ""];

  if (mode === "mock") {
    lines.push(`Mode: TIMED MOCK INTERVIEWER. You are running a realistic mock interview, not a tutoring session.`);
    lines.push(`- Stay in character as the interviewer. Ask one question or present one problem at a time.`);
    lines.push(`- Do NOT teach, hint, or reveal solutions during the mock. Brief acknowledgments only.`);
    lines.push(`- If the candidate is stuck for a while, offer ONE small nudge, then move on — like a real interviewer.`);
    lines.push(`- Keep track of time pressure: remind them of remaining time at natural breaks.`);
    if (req.kind === "coding") lines.push(`- Start by presenting the coding problem clearly, then let them think aloud and code.`);
    if (req.kind === "system-design") lines.push(`- Run the design round: requirements first, then architecture, then deep dive and trade-offs.`);
    if (req.kind === "behavioral") lines.push(`- Ask behavioral questions one at a time and probe for specifics and personal ownership.`);
  } else if (mode === "debrief") {
    lines.push(`Mode: MOCK DEBRIEF. The mock interview is over. Now score the candidate honestly.`);
    lines.push(`Return your debrief in this exact structure:`);
    lines.push(`SCORE: <0-100>`);
    if (req.kind === "coding") {
      lines.push(`- Problem understanding (0-25): did they clarify and restate?`);
      lines.push(`- Approach & pattern recognition (0-25): right pattern, reasoned trade-offs?`);
      lines.push(`- Code correctness & edge cases (0-25): working solution, manual testing?`);
      lines.push(`- Complexity analysis & communication (0-25): Big-O stated, thought aloud?`);
    } else if (req.kind === "system-design") {
      lines.push(`- Requirements & estimation (0-25): scoped the problem, did the math?`);
      lines.push(`- Architecture (0-25): sensible components, data flow?`);
      lines.push(`- Deep dive & trade-offs (0-25): failure modes, consistency, 10x thinking?`);
      lines.push(`- Communication (0-25): structured, drove the conversation?`);
    } else {
      lines.push(`- STAR structure (0-25): clear situation/task/action/result?`);
      lines.push(`- Personal ownership (0-25): "I" not "we", specific decisions?`);
      lines.push(`- Evidence & outcomes (0-25): measurable results, real detail?`);
      lines.push(`- Relevance (0-25): answered the question asked?`);
    }
    lines.push(`Then: 2-3 sentences on the biggest strength, 2-3 on the top fix for next time, and one drill to practice this week.`);
    lines.push(`Be direct. No sugar-coating — this is interview prep.`);
  } else if (req.kind === "coding") {
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
