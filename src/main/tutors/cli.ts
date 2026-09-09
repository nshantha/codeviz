import { spawn, ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { TutorRequest } from "../../shared/types";
import { tutorWorkDir } from "../paths";
import { buildTutorPrompt } from "./prompts";
import type { TutorProvider, TutorResult } from "./provider";

const TIMEOUT_MS = 120_000;

/**
 * Shared machinery for CLI-based tutors. Safety properties:
 * - Argument arrays only — no shell interpolation (shell: false).
 * - Runs in an app-owned EMPTY working directory.
 * - Hard timeout + user cancellation kills the whole process.
 * - No credentials are stored; the CLI uses the user's own login.
 */
abstract class CliTutorBase implements TutorProvider {
  abstract readonly id: "claude-code" | "codex";
  abstract readonly label: string;
  protected abstract readonly binary: string;

  private current: ChildProcess | null = null;

  async checkAvailable(): Promise<{ available: boolean; detail: string }> {
    return new Promise((resolve) => {
      const probe = spawn(this.binary, ["--version"], { shell: false, timeout: 10_000 });
      let out = "";
      probe.stdout?.on("data", (d) => (out += d.toString()));
      probe.on("error", () => resolve({ available: false, detail: `${this.binary} not found on PATH.` }));
      probe.on("close", (code) =>
        resolve(
          code === 0
            ? { available: true, detail: `${this.binary} ${out.trim().split("\n")[0]}` }
            : { available: false, detail: `${this.binary} exited with code ${code}.` },
        ),
      );
    });
  }

  cancel(): void {
    if (this.current) {
      this.current.kill("SIGKILL");
      this.current = null;
    }
  }

  protected abstract buildArgs(prompt: string): string[];

  async chat(req: TutorRequest): Promise<TutorResult> {
    const prompt = buildTutorPrompt(req);
    const args = this.buildArgs(prompt);
    // Log the exact spawn for debuggability. The prompt arg is truncated in
    // the log (full prompt length noted) to avoid flooding logs; the command
    // itself is byte-identical to what is spawned below.
    const loggedArgs = args.map((a) =>
      a === prompt ? `<prompt ${prompt.length} chars: ${JSON.stringify(prompt.slice(0, 200))}…>` : a,
    );
    // eslint-disable-next-line no-console
    console.log(`[tutor] spawning: ${this.binary} ${loggedArgs.join(" ")} (cwd=app-owned tutor dir, shell=false, timeout=${TIMEOUT_MS}ms)`);
    return new Promise((resolve) => {
      const child = spawn(this.binary, args, {
        shell: false,
        cwd: tutorWorkDir(),
        timeout: TIMEOUT_MS,
        env: { ...process.env, TERM: "dumb" },
      });
      this.current = child;
      let out = "";
      let err = "";
      child.stdout?.on("data", (d) => (out += d.toString()));
      child.stderr?.on("data", (d) => (err += d.toString()));
      child.on("error", (e) => {
        this.current = null;
        resolve({ reply: `Tutor unavailable: ${e.message}. Falling back to the built-in coach.`, done: true });
      });
      child.on("close", (code) => {
        this.current = null;
        if (code === 0 && out.trim()) {
          resolve({ reply: out.trim(), done: false });
        } else {
          resolve({
            reply: `The ${this.label} CLI didn't return a response (exit ${code}). ${err.trim() || "Falling back to the built-in coach."}`,
            done: true,
          });
        }
      });
    });
  }
}

/** Anthropic's Claude Code CLI: `claude -p <prompt>` runs a single non-interactive turn. */
export class ClaudeCodeProvider extends CliTutorBase {
  readonly id = "claude-code" as const;
  readonly label = "Claude Code";
  protected readonly binary = "claude";

  protected buildArgs(prompt: string): string[] {
    // -p: print mode (single turn). --max-turns 1 keeps it a single-purpose call.
    return ["-p", prompt, "--max-turns", "1", "--output-format", "text"];
  }
}

/** OpenAI's Codex CLI: `codex exec <prompt>` runs a single non-interactive turn. */
export class CodexProvider extends CliTutorBase {
  readonly id = "codex" as const;
  readonly label = "Codex";
  protected readonly binary = "codex";

  protected buildArgs(prompt: string): string[] {
    return ["exec", "--skip-git-repo-check", prompt];
  }
}

export function sessionId(): string {
  return randomUUID();
}
