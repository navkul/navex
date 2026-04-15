# April 15, 2026 custom overlay architecture

## Direction change
- Codex Beacon now targets a custom macOS menu-bar and overlay helper instead of `terminal-notifier`.
- This is a local clone-plus-link product path. Public npm packaging and Mac App Store distribution are not current requirements.
- Existing Node/TypeScript pieces still own hooks, daemon IPC, registry state, summaries, naming, and focus commands.
- A new Swift helper owns the visible companion UI:
  - menu-bar status item
  - custom floating overlay
  - clickable waiting-session rows

## New flow
- `npm run build` now compiles:
  - TypeScript into `dist/`
  - Swift overlay helper into `dist/macos/CodexBeaconOverlay`
- The daemon spawns the overlay helper on first event that needs UI synchronization.
- The daemon writes newline-delimited JSON events to the helper's stdin:
  - `show` with session id, display name, summary, timestamp, and structured focus command
  - `clear` with session id
- The helper keeps a small in-memory map of waiting sessions.
- When a `show` event arrives, the helper updates the menu-bar count and opens the overlay near the top-right of the screen.
- When a user clicks a session row, the helper runs the provided focus command and removes that row from the overlay.

## Why this is not Mac App Store dependent
- The helper is a local executable built by `swiftc`; local users can run it immediately from a clone.
- For the current project posture, `npm install`, `npm run build`, and `npm link` are enough.
- Signing/notarization can come later if the project needs easier external distribution. It is not required for local development.

## Current limitations
- The overlay currently exits with the daemon because the daemon owns its stdin pipe.
- The overlay keeps only in-memory UI state; registry persistence remains in the Node daemon.
- Exact VS Code integrated-terminal selection is still not implemented. VS Code and Cursor focus remains app-level.
- The custom UI is intentionally plain first-pass AppKit. Visual polish, keyboard navigation, and richer session controls can follow.

# April 15, 2026 notification click fix

## What changed
- Notification click actions now execute an absolute command:
  - Node executable from `process.execPath`
  - current built `dist/cli.js`
  - `focus --session-id <id>`
- The notification command no longer mixes `terminal-notifier` `-execute` with `-activate`; click handling now routes through Beacon's focus command only.
- Transcript summarization now parses Codex JSONL response items and extracts assistant `output_text` instead of compacting raw JSON into the notification body.
- VS Code and Cursor integrated terminals now have app-level focus fallbacks. Exact integrated-terminal selection is still not implemented.

## Custom notifier direction
- `terminal-notifier` is still useful as a short-term transport, but its banner UI is constrained by macOS and by the tool's app identity.
- A first-party notifier should be a small native macOS helper that receives daemon events over the existing local IPC boundary and owns notification delivery/click callbacks.
- A custom macOS notification helper can improve app identity, icon, click reliability, and packaging. It cannot fully redesign the standard macOS notification banner.
- A fully custom overlay or menu-bar UI is possible later, but it is a larger app surface than replacing `terminal-notifier`.

# April 15, 2026 continuation update

## What changed
- The shell wrapper now preserves the real Codex binary through `CODEX_BEACON_CODEX_BIN`, with a PATH fallback when that variable is missing.
- `src/launch.ts` captures launch metadata before starting Codex:
  - custom display name
  - `TERM_PROGRAM`
  - best-effort Terminal/iTerm window id
  - TTY path when available
- `SessionStart` forwards that metadata to the daemon so click-to-focus has more than a generic terminal-app hint.
- The session registry now treats `register-session` and `session-active` as active states, `session-stop` as waiting, and makes preferred custom names unique with deterministic suffixes.
- Notification delivery now supports optional config fields for sound and app icon and picks the activation bundle id from the recorded terminal app.
- Focus now attempts exact-ish TTY targeting first, then recorded window id, then app activation for Terminal.app and iTerm/iTerm2.

## Updated data flow
- `codex-beacon install` prints a wrapper snippet that exports the detected real `codex` path.
- `codex-beacon launch` resolves the real binary, captures terminal metadata with short best-effort timeouts, then keeps the wrapper process attached until Codex exits.
- Hooks still stay tiny. They only read stdin, attach metadata from environment where relevant, and send one socket event.
- The daemon remains responsible for registry updates, summary extraction, notification delivery, and notification clearing.

## Current focus limitation
- TTY/window focus logic is implemented but still needs real Terminal.app and iTerm2 click validation. If exact targeting fails, the fallback remains app activation.

# April 15, 2026 MVP scaffold

## Direction
- Product name: **Codex Beacon**.
- Scope is intentionally narrow for the first version:
  - macOS only
  - interactive `codex` sessions only
  - no `codex exec`
  - no Claude Code yet
- The core design objective is minimal session overhead.

## Primary architecture
- `src/cli.ts`
  - public command entrypoint
  - install flow
  - daemon lifecycle helpers
  - manual session inspection helpers
- `src/daemon.ts`
  - detached local daemon
  - Unix socket server for hook events
  - session state updates
  - notification dispatch
- `src/session-registry.ts`
  - persistent JSON store for sessions and counters
  - monotonic default session naming
- `src/hook-stop.ts`
  - tiny stop-hook handler
  - extracts minimal structured event data
  - forwards to the daemon and exits fast
- `src/hook-user-prompt-submit.ts`
  - clears delivered notifications when a session becomes active again
- `src/notify.ts`
  - `terminal-notifier` integration
  - notification grouping and removal
- `src/focus.ts`
  - macOS terminal focus helpers
  - Terminal.app and iTerm2 AppleScript integration
- `src/install.ts`
  - shell integration generation
  - user-level hook setup guidance

## Why this stack
- Codex hooks are current, experimental, and configurable from `hooks.json`. `SessionStart` provides startup or resume registration, while `UserPromptSubmit` and `Stop` run at turn scope. The hook input includes `session_id`, `cwd`, and `transcript_path`, which are exactly the minimum fields this project needs. citeturn773937search0turn659646search1turn659646search7
- Because multiple hook handlers can run concurrently and hooks are still under active development, the safest design is a tiny enqueue path instead of doing summarization and notification work inside the hook itself. citeturn773937search0turn659646search4
- npm distribution is the best first packaging path because it makes clone-based development and global install straightforward while keeping the wrapper and daemon easy to iterate on. This is an architecture choice for speed of shipping, not a claim that Node is the final native endpoint.

## Data flow

### Session launch
- user types wrapped `codex`
- wrapper captures:
  - requested custom name if present
  - cwd
  - terminal app hint from `TERM_PROGRAM`
  - frontmost window metadata when possible
- wrapper passes launch metadata through environment variables and `exec`s the real `codex` binary
- `SessionStart` hook registers the actual Codex `session_id` and the registry allocates a monotonic default name like `codex 3` when the user did not provide one

### User reprompt
- Codex emits `UserPromptSubmit`
- hook sends `session-active` event to daemon
- daemon marks the session as active and removes that session's grouped notification

### Codex stops and waits
- Codex emits `Stop`
- hook sends `session-stop` event to daemon with:
  - `session_id`
  - `cwd`
  - `transcript_path`
  - timestamp
- daemon derives a compact summary from the latest transcript tail when possible
- daemon posts a grouped notification
- notification click executes a focus command for that session

## Notification model
- Use `terminal-notifier` because the MVP needs click actions and later per-session removal.
- Group notifications by session id so a resumed session can remove its outstanding notification.
- Keep title short and summary bounded by config.

## Focus model
- Primary target: reactivate the exact existing terminal window/tab.
- First supported terminal apps:
  - Terminal.app
  - iTerm2
- Fallback behavior:
  - activate the terminal app only
  - later add resume shortcuts or deeper app integration

## Config model
- Store app state under `~/.codex-beacon/`.
- Key files:
  - `registry.json`
  - `daemon.sock`
  - `config.json`
- Future:
  - menu-bar process
  - local dashboard server

## Performance model
- Hook handlers should finish in milliseconds.
- Expensive work belongs only in the daemon.
- Notification summarization uses transcript tail reads only and should avoid full-file parsing in the hot path.

## Current limitations
- Shell wrapping is the cleanest MVP path, but it requires user installation so the `codex` command is transparently intercepted.
- Click-to-focus logic is terminal-app-specific and will need iterative hardening.
- Notification center history is delegated to macOS for the MVP instead of building a custom dropdown UI immediately.
