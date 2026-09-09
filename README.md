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
