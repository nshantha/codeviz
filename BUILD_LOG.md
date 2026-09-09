# AlgoMentor Electron rebuild — build log (2026-09-09)

## What was built

A complete local-first Electron desktop app replacing the competition-era
prototype on `main`:

- **Shell**: Electron 37, React 19 + TypeScript + Vite renderer, typed preload
  IPC bridge (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`).
- **Database**: SQLite via better-sqlite3 (WAL, foreign keys), 3 versioned
  migrations, stable per-device ID. Tables: profile, questions, attempts
  (append-only), pattern_state, review_items, design_sessions, stories,
  ai_sessions, sync metadata.
- **Learning engine**: Bayesian pattern mastery, SM-2 scheduling, active vs
  elapsed timers with auto-pause, hint counting, confidence, unaided pattern
  recognition, confusable-pair discrimination drills, "what should I practice
  next?" recommendations, 8-week plan generator from company banks.
- **Curriculum**: 171-question catalog (Meta 80 / Amazon 90 / Google 85 /
  Apple 60 / Netflix 55 — all bank totals verified against research),
  NeetCode-150 flags, LeetCode URLs, 12 basics drills, pattern ladder with
  Prefix Sum first-class, recognition triggers, 5-level Socratic hints,
  68 research shelves (system-design prompts + behavioral questions per company).
- **Tutor**: provider abstraction — Claude Code CLI, Codex CLI (locally
  authenticated CLIs, arg arrays, `shell: false`, timeouts, cancellation,
  single-purpose calls), plus offline built-in coach. Coding, system-design,
  and behavioral interviewer modes.
- **Backup/sync**: versioned `.algomentor` JSON archives with merge/replace
  import, dry-run preview, automatic safety backup on replace; synced-folder
  event log (per-device JSONL) for Mac↔PC via OneDrive/Dropbox — live DB never
  synced; merge dedupes by ID, tombstones, conflict copies, recomputes derived
  state.
- **Renderer**: onboarding (multi-company, diagnostic), dashboard, patterns,
  practice workspace (filters, hidden-label mixed mode, code pad, manual trace,
  LeetCode links, tutor chat), review queue, system-design workspace,
  behavioral story bank, progress report with markdown export, settings
  (tutor provider, backup/import, sync folder, profile edit).

## What was dropped (vs the plan)

- **Supabase/cloud sync (Milestone 4)**: not built — synced-folder event log
  covers the Mac↔PC need with no server.
- **Passphrase encryption for backups**: backups are plaintext JSON; documented
  as not implemented.
- **PDF reports**: markdown export only.
- **Packaging** (macOS/Windows installers): stretch goal, not done.
- **Test suite**: no automated tests were written (SM-2, merge idempotency,
  IPC smoke). Core flows were verified by headless scripts and a live
  xvfb-driven Electron session with screenshots.

## What remains stubbed / known issues

- Tutor CLI providers are implemented but **untested against real CLI
  versions/flags** (no Claude Code / Codex CLI in this environment).
- Recompute-after-import recalculates next-review dates relative to
  import time rather than deterministically from event timestamps.
- Lapse counting in review scheduling is approximate (checks the
  updated/reset review count after a failed review).
- The 8-week plan's week picker uses a simplified unattempted-ID heuristic,
  not the persisted current week.
- `better-sqlite3` must be rebuilt for Electron's ABI — handled by the
  `postinstall` (`electron-rebuild -w better-sqlite3`) script, but contributors
  on a fresh clone must have a C++ toolchain.
- Renderer console shows an "Insecure Content-Security-Policy" warning
  (no CSP meta tag set yet).

## Architecture decisions

- Derived state (mastery, review schedule) is **never stored as source of
  truth** — it is recomputed from the append-only attempt log after every
  import/sync merge.
- No Java/code interpreter in v1: LeetCode handles execution; AlgoMentor
  provides code pads, traces, lessons, timers, and direct links.
- AI tutor goes through the user's own CLI subscriptions — no API keys,
  no credentials stored, no autonomous agent loops.
- Behavioral stories are user-authored only; the AI prober never invents
  experience details.

## Archive safety verification (before removing old tree, 2026-09-09)

- `origin/archive/competition-v1` existed and pointed at
  `2099ce7c9ceb089b776d7433b71ba8e72000d458`.
- Old `main` HEAD was the same commit; `origin/main` was also at `2099ce7`
  at clone time.
- Old tracked working tree removed locally only after this verification;
  the archive branch was never touched.

## Verification performed

- `npm run typecheck` clean (main, preload, renderer).
- Full `npm run build` succeeds.
- Headless engine tests: 171-question seed, attempt recording → mastery +
  review scheduling, next-up recommendations, 8-week plan generation,
  backup payload, progress report, design/behavioral prompt counts.
- Live Electron session under xvfb: app boots, migrations apply, catalog
  seeds, onboarding → dashboard → review → practice all render and respond
  (screenshots captured).
- Fixed during verification: preload `Proxy` broke `contextBridge`
  (replaced with explicit method list generated from the interface);
  better-sqlite3 ABI mismatch (added postinstall electron-rebuild);
  catalog JSON not copied to dist (added build:data step);
  meta-table chicken-and-egg in migrations.
