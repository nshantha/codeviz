import type { TutorRequest } from "../../shared/types";
import { getPatternLesson } from "../data/patterns";
import type { TutorProvider, TutorResult } from "./provider";

/**
 * Built-in offline tutor. No CLI, no network — serves the authored Socratic
 * hint ladder for the problem's pattern. Guarantees the app teaches without AI.
 */
export class NoAIProvider implements TutorProvider {
  readonly id = "none" as const;
  readonly label = "Built-in coach (offline)";

  async checkAvailable(): Promise<{ available: boolean; detail: string }> {
    return { available: true, detail: "Built-in Socratic hints, always available offline." };
  }

  cancel(): void {
    // nothing in flight — single synchronous response
  }

  async chat(req: TutorRequest): Promise<TutorResult> {
    const mode = req.mode ?? "practice";
    if (mode === "mock") {
      return { reply: this.mockPrompt(req), done: false };
    }
    if (mode === "debrief") {
      return { reply: this.debriefPrompt(req), done: false };
    }
    const level = Math.min(Math.max(req.context.hintLevel ?? 1, 1), 5);
    if (req.kind === "system-design") {
      return { reply: this.designPrompt(req), done: false };
    }
    if (req.kind === "behavioral") {
      return { reply: this.behavioralPrompt(req), done: false };
    }
    const lesson = req.context.pattern ? getPatternLesson(req.context.pattern) : undefined;
    const hint = lesson?.socraticHints[level - 1];
    const lines = [
      `**Coach (hint level ${level}/5${req.context.pattern ? ` — ${req.context.pattern}` : ""})**`,
      "",
      hint ?? "What do you notice about the input structure?",
      "",
    ];
    if (level === 1 && lesson) {
      lines.push(`Recognition triggers for this pattern family:`, ...lesson.triggers.map((t) => `- ${t}`), "");
    }
    if (level >= 4) {
      lines.push(`State your time and space complexity before continuing.`, "");
    }
    lines.push(`Reply with your thinking and I'll guide the next step.`);
    return { reply: lines.join("\n"), done: false };
  }

  private designPrompt(req: TutorRequest): string {
    const last = req.history.filter((t) => t.role === "user").length;
    const checkpoints = [
      "Let's start with requirements. Who are the users, what are the core operations, and what scale are we designing for? Give me reads/writes per second and data size estimates.",
      "Good. Now sketch the high-level architecture: what are the major components and how do they talk to each other?",
      "Now the deep dive: pick the hardest component and walk me through it. What breaks at 10x the load? Where is the single point of failure?",
      "Trade-offs time: what did you give up for this design (consistency, latency, cost)? What would you change with a week more?",
    ];
    return `**Design interviewer**\n\n${checkpoints[Math.min(last, checkpoints.length - 1)]}\n\n${req.userMessage ? "" : ""}Take your time — talk through your reasoning out loud.`;
  }

  private behavioralPrompt(req: TutorRequest): string {
    return (
      `**Behavioral interviewer**\n\n` +
      `Tell me the story in STAR form: Situation, Task, Action, Result. ` +
      `I'll be listening for three things: (1) what YOU personally did vs the team, ` +
      `(2) a specific decision or conflict, not a summary, and (3) a measurable outcome. ` +
      `Go ahead — which story are you bringing?`
    );
  }

  private mockPrompt(req: TutorRequest): string {
    const kindLabel = req.kind === "coding" ? "coding" : req.kind === "system-design" ? "system design" : "behavioral";
    return (
      `**Mock interviewer (${kindLabel})** — the clock is running.\n\n` +
      `I'll run this like the real thing: one question at a time, no hints, no teaching until the debrief. ` +
      `Talk through your thinking out loud as you go — communication is graded.\n\n` +
      `Let's begin. ${req.userMessage ? "" : "Tell me when you're ready for the first question."}`
    );
  }

  private debriefPrompt(req: TutorRequest): string {
    const rubrics: Record<string, string[]> = {
      "coding": [
        "Problem understanding (0-25)",
        "Approach & pattern recognition (0-25)",
        "Code correctness & edge cases (0-25)",
        "Complexity analysis & communication (0-25)",
      ],
      "system-design": [
        "Requirements & estimation (0-25)",
        "Architecture (0-25)",
        "Deep dive & trade-offs (0-25)",
        "Communication (0-25)",
      ],
      "behavioral": [
        "STAR structure (0-25)",
        "Personal ownership (0-25)",
        "Evidence & outcomes (0-25)",
        "Relevance (0-25)",
      ],
    };
    const rubric = rubrics[req.kind] ?? rubrics["coding"];
    return (
      `**Mock debrief**\n\n` +
      `Time's up. Here's how I'd score this round — score yourself first, then compare:\n\n` +
      rubric.map((r) => `- ${r}: ___`).join("\n") +
      `\n\nSCORE: ___ / 100\n\n` +
      `Biggest strength: ___\nTop fix for next time: ___\nOne drill for this week: ___\n\n` +
      `Note: the built-in coach can't watch you solve — for a real scored debrief, ` +
      `connect Claude Code or Codex in Settings and run the mock again.`
    );
  }
}
