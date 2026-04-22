# April 22, 2026 overlay row layout pass

## What changed
- The waiting-row layout now treats content and controls as separate columns instead of letting the trailing action buttons participate in content sizing.
- `OverlayRowView` now uses a small metric set for:
  - shared insets
  - title spacing
  - content spacing
  - action-button sizing
  - content-to-action gap
- The content column is now width-constrained between the left inset and the dedicated action column, so summary and reprompt text use the full readable width before wrapping.
- The action column is now a fixed trailing stack, which keeps the dismiss and focus controls visually aligned without changing row content width.

## Current behavior
- Short summaries such as `Ready for your next prompt.` can stay on one line when the row has room for them.
- Row vertical rhythm is driven by the shared metric system rather than by whatever size the action buttons or wrapped summary happened to produce.

# April 22, 2026 overlay control pass

## What changed
- The overlay row is no longer the focus click target.
- Each waiting row now exposes explicit trailing controls:
  - `x` to dismiss
  - arrow button to focus the terminal session
- Drag reordering no longer depends on a dedicated handle icon. A row can now be dragged from anywhere in the row body that is not:
  - one of the trailing action buttons
  - the inline reprompt field
- The state dot now renders to the right of the session name instead of to the left.
- The remaining `5h` label was removed from the header usage block.
- The overlay typography was tightened again around the compact monospaced system font, with sizes and weights pulled closer to the usage header style.

## Current behavior
- Focus still routes through the same Beacon focus command path as before; only the visible trigger moved from the full row surface to the dedicated arrow button.
- The overlay now separates:
  - drag gesture area
  - dismiss control
  - focus control
  - reprompt field

# April 22, 2026 overlay typography pass

## What changed
- The overlay now uses the same monospaced system font across its UI surface instead of mixing proportional text with the usage header font.
- This applies to:
  - the menu-bar `Beacon` label
  - row titles
  - row summaries
  - inline reprompt field
  - header title and waiting count
- The weekly usage line in the header no longer includes the `wk` prefix.

## Current behavior
- The overlay reads as one consistent typographic system.
- The usage block stays compact, with the first line labeled `5h` and the second line left unlabeled.

# April 22, 2026 overlay header usage pass

## What changed
- Beacon no longer renders a usage meter inside every waiting-session row.
- The overlay now shows account-level usage once, in the header, using the latest usage snapshot observed across the current waiting sessions.
- The header usage block is two compact right-aligned lines:
  - `5h ...`
  - `wk ...`
- Reset times are folded into those lines in a compact terminal-like format instead of using graphical battery bars.

## Current behavior
- Usage is treated as shared overlay context, not per-session row data.
- The header now carries the most relevant account usage state without repeating the same information down the whole queue.

# April 22, 2026 event-driven overlay visibility fix

## What changed
- Overlay visibility is now event-driven instead of snapshot-driven.
- The helper still hydrates from `overlay-snapshot.json` on startup, but it no longer auto-opens just because waiting sessions already exist.
- The helper now auto-opens only when the waiting-session set gains at least one new session id.
- If the waiting-session set only shrinks, the helper hides the overlay instead of leaving it pinned onscreen.
- Daemon startup replay now repopulates `overlay-snapshot.json` passively through a snapshot rewrite instead of replaying synthetic `show` events into the helper path.
- `UserPromptSubmit` can still cold-start the daemon, but it no longer cold-starts the helper.

## Layout changes
- The overlay panel is now positioned against the active screen's visible top-right corner instead of anchoring under the status-item button.
- The panel background container is now a flipped view, which keeps `Codex Beacon` and the waiting count in the actual top header instead of the bottom of the panel.

## Current behavior
- Existing waiting sessions survive restarts in the snapshot and menu-bar state, but they stay passive until:
  - a new stop event adds another waiting session
  - or the user explicitly opens the panel from the status item
- Entering a new Codex prompt should no longer make the overlay appear on screen unless a separate session has just stopped.

# April 22, 2026 overlay space visibility fix

## What changed
- Beacon still avoids `collectionBehavior` changes during helper window construction, but the overlay now applies a Spaces behavior only at show time.
- The helper now sets `window.collectionBehavior = [.canJoinAllSpaces]` immediately before ordering the overlay onscreen.
- This keeps helper startup stable while making the menu-bar overlay behave more like a global menu-bar surface across desktops.
- Show-time logging now records whether the overlay is on the active space before and after ordering.

## Current behavior
- The overlay should no longer stay tied to the terminal's original desktop or space after a clean restart.
- Startup still avoids the earlier `configurePanel()` stall because the window behavior is no longer configured during panel construction.

# April 22, 2026 helper window startup fix

## What changed
- Beacon still uses the plain borderless `NSWindow` overlay introduced in the previous visibility pass, but the helper no longer sets custom `collectionBehavior` flags during window construction.
- The failing line was the window behavior assignment immediately after `window.level = .statusBar`; removing it restores full helper startup, snapshot hydration, layout, and on-screen ordering.
- The helper keeps the deferred post-launch snapshot reload so it can correct the first frame once the status-item button has a real screen rect.
- Helper logging is back to a smaller steady-state surface:
  - startup
  - panel configure begin/end
  - snapshot apply
  - layout frame
  - show/hide actions

## Current behavior
- Overlay startup no longer stalls inside `configurePanel()`.
- A fresh helper launch now reaches:
  - window construction
  - snapshot-driven refresh
  - a real visible frame under the `Beacon` status item
- The first layout can still happen before the menu-bar button has a usable screen rect, but the deferred reload corrects that frame and leaves the overlay visible.

# April 21, 2026 overlay window anchoring fix

## What changed
- Beacon no longer relies on an `NSPanel` or `NSPopover` for the visible queue surface.
- The helper now renders the queue into a plain borderless `NSWindow` anchored under the `Beacon` status item.
- The helper layout path is now manual and deterministic:
  - size the root view from Beacon presentation state
  - position the overlay window from the status-item button screen rect
  - order the window front with `makeKeyAndOrderFront` plus `orderFrontRegardless`
- The overlay window now depends on explicit anchoring and front-ordering rather than panel-only space behavior.

## Current behavior
- The queue can render as a real topmost helper window on the active desktop instead of only existing in the window server.
- Beacon still uses the same daemon, snapshot, summary, usage, focus, dismiss, reorder, and inline-reprompt model; only the visible macOS surface changed.

# April 21, 2026 overlay bootstrap and visibility recovery

## What changed
- The Swift helper now bootstraps its waiting-session model from `overlay-snapshot.json` during initialization instead of depending on stdin-delivered `show` events to render the first visible state.
- The daemon still owns the rendered overlay model and persists it on every `show` and `clear`, but helper startup no longer depends on a live event stream to become visible.
- The helper still polls the snapshot file for changes, which is now the primary synchronization path.
- Helper placement now recovers from early startup frames by reloading once the status-item anchor has a usable screen rect, then ordering the window on screen.
- Beacon now writes helper-side visibility logs to `~/.codex-beacon/overlay-helper.log` for AppKit startup debugging.

## Current behavior
- After a daemon/helper restart, the helper can immediately render existing waiting sessions from disk.
- Overlay visibility is no longer coupled to stdin pipe timing between the daemon and the helper process.
- The helper log now records snapshot bootstrap, panel layout frame, and show attempts.

# April 21, 2026 overlay snapshot recovery

## What changed
- The daemon now persists the current overlay model to `overlay-snapshot.json` on every `show` and `clear`.
- The Swift helper now polls that snapshot file and rebuilds its waiting-session state from disk.
- Daemon startup also replays all waiting sessions into the snapshot so the overlay can recover after Beacon restarts.

## Current behavior
- Beacon no longer depends on helper-local in-memory state alone to show waiting sessions.
- Restarting the daemon/helper should repopulate the overlay from the persisted waiting-session snapshot.

# April 21, 2026 overlay ordering and inline reprompt

## What changed
- The Swift helper now owns lightweight local UI state in `overlay-state.json` for waiting-row order. New waiting sessions are inserted at the top by default, and drag reordering updates that local order.
- Overlay rows are no longer a single invisible button. Each row now owns:
  - a drag handle for reordering
  - a compact dismiss affordance
  - a transcript-derived usage meter
  - an inline reprompt field
- Stop processing now captures the latest Codex rate-limit snapshot from the session transcript:
  - primary five-hour usage percent
  - secondary weekly usage percent
  - total session tokens
  - last-turn tokens
- The daemon forwards that usage snapshot to the helper alongside the summary and focus command.
- The helper now receives a reprompt command prefix and can submit a one-line prompt back into the live terminal session without focusing it.

## Current behavior
- Inline reprompt is currently terminal-backed only:
  - iTerm/iTerm2 via `write text` against the matched session
  - Terminal.app via `do script` against the matched tab or window
- VS Code and Cursor sessions still do not get inline reprompt because this repo does not have a reliable exact integrated-terminal input path for them.

# April 17, 2026 focus reliability pass

## What changed
- Launch-time iTerm metadata capture now derives the session `unique id` from `ITERM_SESSION_ID` or `TERM_SESSION_ID` when available, instead of relying only on AppleScript capture.
- The `SessionStart` hook now falls back to `TERM_PROGRAM` plus the iTerm session environment variables when wrapper-provided metadata is missing. This keeps new iTerm sessions focusable even if they were not launched through a perfect wrapper path.
- The focus resolver now treats exact terminal selection as a strict match:
  - iTerm/iTerm2: session `unique id`, then tty, then window plus tab, then window
  - Terminal.app: tty, then window
- Exact terminal focus now fails closed. Beacon no longer treats a successful AppleScript process exit as proof that the target session was found.

## Current behavior
- For terminal-backed sessions, Beacon now prefers a hard failure over activating the wrong terminal window.
- VS Code and Cursor remain app-level fallbacks only because there is still no stable exact integrated-terminal selector in this repo.

# April 17, 2026 overlay interaction pass

## What changed
- The overlay list now renders all waiting sessions inside a scroll view instead of truncating the visible list at `overlayMaxVisibleRows`.
- `overlayMaxVisibleRows` now controls panel height, not data visibility. Extra rows remain available via scroll.
- Clicking a row now removes it from the overlay immediately and closes the panel.
- Each row now includes a small dismiss affordance so a user can clear it without focusing the session.

## Current behavior
- Overlay dismissal is still helper-local state. Clearing a row from the overlay does not change the underlying session registry status.
- A dismissed row will stay gone until a future daemon `show` event reintroduces it or the helper restarts.

# April 16, 2026 overlay polish and summary controls

## What changed
- Beacon now has a real config surface for overlay behavior:
  - `overlayWidth`
  - `overlayMaxVisibleRows`
  - `overlayShowSummary`
  - `overlaySummaryStyle`
  - `overlaySummaryMaxChars`
  - `overlaySummaryMaxWords`
  - `overlaySummaryMaxLines`
  - `overlayCommand`
- The CLI now exposes config management commands:
  - `codex-beacon config path`
  - `codex-beacon config show`
  - `codex-beacon config get <key>`
  - `codex-beacon config set <key> <value>`
- The summary path is now a structured local pipeline instead of a raw transcript tail truncation:
  1. parse assistant messages from the Codex JSONL transcript tail
  2. normalize markdown and inline formatting
  3. classify the turn into a state such as `done`, `blocked`, `failed`, `needs-input`, or `ready`
  4. build a short deterministic summary using heuristics
  5. apply word and character limits from config
- The overlay helper now receives presentation settings and summary state in each `show` event.

## Focus reliability change
- iTerm targeting now captures and persists the session `unique id` plus tab index at launch.
- Focus attempts now prefer iTerm session `unique id`, then tty, then window plus tab, then window, then app activation.
- This is intended to avoid landing in the wrong iTerm window when multiple windows or panes are open.

## Overlay behavior change
- Clicking a row now launches the focus command and hides the overlay, but it does not remove the row immediately.
- The row stays present until `UserPromptSubmit` clears it, which makes failed or partial focus attempts recoverable.
- The Swift overlay layout was redesigned around:
  - row-first click targets
  - no visible generic button label
  - softer visual treatment with a compact header and state dot
  - configurable width and summary line clamp

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
