# AlgoMentor — local-first interview prep (Electron)

AlgoMentor is a **local-first desktop app** for FAANG interview prep: coding-pattern
mastery with spaced repetition, an 8-week study plan, system-design and behavioral
workspaces, and a Socratic AI tutor that runs through CLIs you already have
installed. Your data lives in a SQLite database on your machine — nothing is
uploaded anywhere unless you export it.

Rebuilt from scratch (Sept 2026) on Electron + React + TypeScript + Vite. The
previous competition-era prototype is preserved on the
`archive/competition-v1` branch.

## Run it

```bash
npm install        # also rebuilds better-sqlite3 for Electron (postinstall)
npm run dev        # Vite + Electron with hot reload
```

Or run the production build:

```bash
npm run build
npx electron --no-sandbox dist/main/index.js   # --no-sandbox only needed when running as root
```

`npm run typecheck` runs the TypeScript checks for main, preload, and renderer.

## How it works

- **Main process** (`src/main/`): SQLite (WAL) with versioned migrations,
  append-only attempt log, Bayesian pattern mastery, SM-2 review scheduling,
  8-week plan generator, backup/import (`.algomentor` archives), markdown
  progress reports, and a synced-folder event log for Mac↔PC sync (the live
  database file is never synced — each device appends to its own JSONL log).
- **Preload** (`src/preload/`): typed IPC bridge only. `contextIsolation`,
  no Node in the renderer. (The bridge must be a plain object — Electron
  deep-clones it, so no Proxies.)
- **Renderer** (`src/renderer/`): React app — onboarding, dashboard, pattern
  lessons, practice workspace with active/elapsed timers and Socratic tutor
  chat, review queue with confusable-pair drills, system-design sessions,
  behavioral story bank, progress report, settings (tutor provider, backup,
  sync folder).
- **Tutor providers** (`src/main/tutors/`): `ClaudeCodeProvider` and
  `CodexProvider` shell out to the locally authenticated CLIs (argument
  arrays, `shell: false`, timeouts, cancellation, no stored credentials);
  `NoAIProvider` is a built-in offline Socratic coach. Single-purpose calls
  only — no autonomous loops.

## Data

- 171-question research-backed catalog (`src/main/data/catalog.json`):
  evidence-sized company banks (Meta 80, Amazon 90, Google 85, Apple 60,
  Netflix 55), NeetCode-150 flags, LeetCode links, system-design prompts and
  behavioral questions per company.
- 12 basics drills gate the pattern ladder; 9 confusable-pattern pairs drive
  discrimination drills.

## Game layer

The trainer is gamified from the attempt log — no inflated points:

- **XP** is derived from attempts: unaided pattern identification +50,
  no-hint solve +40, on-time review pass +30, hidden-label mixed solve +25,
  beating the target time +20. Re-solves of already-solved questions earn
  half; hint-heavy solves earn base XP only. Per-attempt cap 150.
  Completing a confusable-pair drill +15, finishing a Friday mock +100.
- **Levels**: XP to reach level n = 50·n·(n−1). Level-up banners + achievement
  toasts fire after attempts, drills, and mocks.
- **Pattern rings**: Bronze → Silver → Gold → Mastered from Bayesian mastery
  and attempt volume; shown on the Dashboard and the Journey page.
- **Journey map**: 8-week stage timeline with daily nodes, fed by the study
  plan. Weekly 5-of-7 consistency ring and a GitHub-style heatmap
  (last 120 days) track training cadence — no streak-punishment mechanics.
- 11 achievements (First Blood, Clean Solve, Pattern Eye, Pair Slayer,
  Boss Fight Cleared, …) are evaluated idempotently and persisted in SQLite.

## AI coach & Friday mocks

- **Coach panel** is always visible in Practice: one-click "Ask coach" sends
  the problem, code, mental trace, and elapsed time for one Socratic
  question; quick actions for "Explain my mistake", complexity quizzes, and
  edge-case checks.
- **Mental trace stepper**: split code into lines, step through with a
  variable-state table — training the no-execution interview skill. Traces
  are saved into attempt notes.
- **Friday Mock**: timed boss fights (coding 45m / design 30m / behavioral
  20m). The AI runs as a real interviewer (no hints), then debriefs against
  a rubric with a 0–100 score. Past mocks are kept with scores.
- **Pattern drills**: recognition drills with instant feedback (distractors
  drawn from confusable pairs) and trigger-match drills.
- **AI setup**: an "AI Coach" onboarding step detects Claude Code / Codex
  CLIs, shows health, and falls back to the built-in offline Socratic coach.
  Framed as *train with AI for the AI round* (Meta's coding round is
  AI-enabled). CLI spawns are logged exactly for validation.
  **Not yet validated against real Claude Code / Codex installs** — the CLI
  adapters are built to spec but untested on a real machine.

## Sync between two computers

Pick a folder synced by OneDrive/Dropbox on both machines (Settings → Sync).
Each device appends attempts and edits to its own event log there; merging
unions attempts by ID, keeps conflict copies for divergent editable records,
and recomputes all derived mastery/review state from the merged log.

## Docs

- `BUILD_LOG.md` — what was built, what was dropped, what remains stubbed,
  architecture decisions, archive-safety verification.
- `~/workspace/your_files/algomentor-electron-plan/AlgoMentor Electron Build Plan.md`
  — the original build plan (outside this repo).
