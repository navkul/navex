## Current status
- Refreshed on 2026-04-15 after initializing the Codex Beacon MVP scaffold.
- The repo now contains:
  - Codex-specific operating docs
  - a working TypeScript project structure
  - low-latency hook handlers
  - a detached daemon skeleton
  - shell install generation
  - session registry logic
  - notification and focus helpers

## Completed now
- Selected the product name `Codex Beacon`.
- Narrowed MVP scope to:
  - macOS only
  - interactive Codex sessions only
  - no `codex exec`
  - no Claude support yet
- Replaced the older repository-file guidance with Codex Beacon-specific docs.
- Added:
  - `FEATURES.md`
  - `.codex/hooks.json`
  - `README.md`
  - TypeScript CLI source files
- Initialized a git repository.
- Standardized the repo on the commit style:
  - `verb: describe change related to verb`

## What works in the scaffold
- Session names can be allocated monotonically and persisted.
- Hook handlers can read Codex hook JSON from stdin and register the real Codex session id on `SessionStart`.
- Hook handlers can enqueue daemon events over a Unix socket.
- The daemon can persist registry state and attempt notification delivery.
- The repo can generate shell wrapper snippets for zsh and bash.
- Notification removal is wired for session resume events.

## Remaining next steps
- Harden the shell wrapper install so it safely preserves the real Codex binary path.
- Persist richer terminal metadata at session launch.
- Add a transcript-tail summarizer that better distinguishes:
  - finished task
  - blocked task
  - needs approval
  - generic ready state
- Validate `terminal-notifier` click behavior end-to-end on a real macOS machine.
- Test focus behavior in:
  - Terminal.app
  - iTerm2
- Add config editing commands for:
  - maximum notification characters
  - default icon size strategy if supported by the transport
- Decide whether to publish npm first or keep clone-plus-link as the primary beta path.

## Final state summary
- The repository now materially matches the requested product direction instead of only describing it.
- The main remaining gap is real macOS runtime validation, not product shape.
