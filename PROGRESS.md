## Refreshed on 2026-04-15 after wrapper and focus continuation

## Completed now
- Added a reproducible `package-lock.json`.
- Lowered the supported Node runtime to Node 18 or newer and aligned `commander` with that engine.
- Fixed the wrapper launch path so `codex-beacon launch` stays attached to the Codex child instead of throwing immediately.
- Hardened install output so the generated shell snippet preserves the detected real Codex binary path in `CODEX_BEACON_CODEX_BIN`.
- Added launch metadata capture for terminal app, TTY, and best-effort Terminal/iTerm window id.
- Persisted terminal metadata through the `SessionStart` hook and session registry.
- Fixed session status transitions:
  - `register-session` and `session-active` are active
  - `session-stop` is waiting
- Made custom session names unique with deterministic suffixes.
- Added optional notification config for sound and app icon.
- Improved click focus from app-only activation to TTY, then window id, then app activation fallback for Terminal.app and iTerm/iTerm2.

## Validation
- `npm install`
- `npm run check`
- `npm run build`
- `node dist/cli.js install --shell zsh`
- `node dist/cli.js install --shell fish` fails as expected with `Unsupported shell: fish`
- Fake-notifier daemon smoke flow verified stop notification emission, reprompt clearing, metadata persistence, custom-name suffixing, and monotonic default naming.
- Fake Codex launch smoke flow verified custom-name capture, terminal metadata forwarding, argument forwarding, and wrapper child exit behavior.

## Remaining next steps
- Validate real `terminal-notifier` click behavior end-to-end in macOS Notification Center.
- Validate exact focus behavior in Terminal.app and iTerm2.
- Improve transcript-tail summaries beyond conservative line compaction.
- Add config editing commands instead of requiring manual JSON edits.
- Decide whether the install command should write/merge user files or remain print-only for beta.

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
