## Refreshed on 2026-04-21 after overlay window anchoring fix

## Completed now
- Replaced the failing panel/popover presentation path with a plain borderless helper window anchored under the `Beacon` status item.
- Kept the existing overlay row UI, scroll behavior, dismiss control, drag ordering, usage meter, and inline reprompt support.
- Confirmed the helper completes its render path and orders the overlay above the active desktop.

## Validation
- `npm run check`
- `npm run build`
- restarted the daemon/helper through the real `Stop` hook path
- verified helper logs complete through:
  - `refresh end arranged=...`
  - `showOverlay visibleAfter=true`
- verified a full-screen compositor capture now shows the overlay on top of the active app
- verified direct window capture still contains the expected queue UI

## Remaining next steps
- Retest the visible overlay directly from a real Codex session on your machine.
- Once confirmed, strip the extra helper-debug logging back to a smaller default set.

## Refreshed on 2026-04-21 after overlay bootstrap visibility fix

## Completed now
- Moved the Swift helper to bootstrap its waiting-session state directly from `overlay-snapshot.json` during startup.
- Simplified daemon-to-helper coordination so the helper no longer depends on stdin event delivery to paint the first visible overlay state.
- Added helper-side visibility logging in `~/.codex-beacon/overlay-helper.log`.
- Adjusted overlay placement to target the screen under the current mouse location and verified the live panel is being ordered onscreen with the expected non-default frame.

## Validation
- `npm run check`
- `npm run build`
- killed and restarted the daemon/helper
- triggered a real `Stop` hook path through `node dist/cli.js hook stop`
- confirmed the helper log records:
  - `applySnapshot reason=bootstrap`
  - `layoutPanel frame={{1032, 368}, {420, 532}}`
  - `showOverlay visibleAfter=true`
- confirmed via `CGWindowListCopyWindowInfo` that the overlay window is onscreen with:
  - width `420`
  - height `532`
  - `kCGWindowIsOnscreen = 1`

## Remaining next steps
- Retest the live overlay visually from a real Codex stop event in your normal terminal workflow.
- If duplicate daemons/helpers appear again, harden the daemon startup race in `sendEvent()`.

## Refreshed on 2026-04-21 after overlay snapshot recovery

## Completed now
- Added persisted `overlay-snapshot.json` state so the daemon writes the current waiting-session overlay model to disk.
- Made the Swift helper poll and reload the overlay snapshot instead of relying only on incremental stdin events.
- Added daemon-start replay of all waiting sessions so Beacon can repopulate the overlay after a daemon/helper restart.

## Validation
- `npm run check`
- `npm run build`
- Restarted Beacon and verified `~/.codex-beacon/overlay-snapshot.json` is recreated from existing waiting sessions.
- Verified the snapshot contains current focus commands, reprompt commands, summaries, and usage state for waiting sessions.

## Remaining next steps
- Confirm the recovered snapshot is visibly rendered by the live overlay on your machine after restart.

## Refreshed on 2026-04-21 after overlay ordering, usage, and reprompt

## Completed now
- Replaced the old full-row click implementation with row views that support:
  - drag-to-reorder
  - dismiss
  - inline reprompt
- Added helper-local `overlay-state.json` ordering support so waiting rows can keep a custom order.
- Added transcript-derived usage parsing for:
  - five-hour rate-limit usage
  - weekly rate-limit usage
  - total session tokens
  - last-turn tokens
- Added `codex-beacon reprompt --session-id ... --message ...` and wired the helper to call it from an inline text field.
- Added terminal-backed reprompt delivery for iTerm/iTerm2 and Terminal.app without focusing the destination session.

## Validation
- `npm run check`
- `npm run build`
- Live CLI reprompt harnesses verified:
  - iTerm/iTerm2 delivery into a matched session unique id
  - Terminal.app delivery into a matched window/tab
- `usageSnapshotFromTranscript()` returns the latest primary and secondary rate-limit snapshot from a real Codex transcript.

## Remaining next steps
- Visually inspect the new row layout, drag feel, and inline reprompt field in the real overlay.
- Confirm helper-local row ordering persists after a real helper relaunch, not just in code flow.

## Refreshed on 2026-04-17 after focus reliability hardening

## Completed now
- Fixed the iTerm launch metadata path so new sessions can recover the session `unique id` from shell environment variables.
- Added `SessionStart` metadata fallbacks for `TERM_PROGRAM`, `ITERM_SESSION_ID`, and `TERM_SESSION_ID`.
- Corrected the core focus resolver so exact terminal focus only reports success when a matching session or window is actually found.
- Changed terminal focus behavior to fail closed instead of activating the wrong terminal app or wrong iTerm window.

## Validation
- `npm run check`
- `npm run build`
- Live iTerm harness validation against open windows verified:
  - exact focus by session `unique id`
  - fallback focus by tty when app metadata is missing
  - explicit failure for bogus iTerm targets instead of false-positive success
- Temporary daemon plus `SessionStart` hook harness verified that `TERM_PROGRAM` and `TERM_SESSION_ID` backfill `terminalApp` and `terminalSessionUniqueId` into the registry when wrapper metadata is absent.
- Fake Codex launch smoke flow verified wrapper-exported iTerm metadata still includes:
  - terminal app
  - window id
  - tab index
  - session `unique id`

## Remaining next steps
- Validate the exact focus path through the real overlay click flow, not just the direct CLI focus command.
- Decide whether failed focus from the overlay should surface a visible error or simply leave the session recoverable through the menu bar.

## Refreshed on 2026-04-17 after overlay interaction tweaks

## Completed now
- Added scrollable overflow to the overlay so all waiting sessions stay reachable even when the panel height is capped.
- Changed row click to remove the overlay item immediately instead of waiting for a later clear event.
- Added a small dismiss control for removing a waiting item without focusing its session.

## Validation
- `npm run check`
- `npm run build`
- Verified the Swift helper still compiles after the scroll-view and row-dismiss changes.

## Remaining next steps
- Investigate and harden return-to-session reliability, with focus correctness as the top priority.

## Refreshed on 2026-04-16 after overlay polish and config controls

## Completed now
- Added CLI-managed overlay settings for width, row count, summary visibility, summary style, and summary word/character/line limits.
- Improved transcript summarization so Beacon now prefers meaningful assistant text over generic fragments like `Done.`.
- Added summary state classification and passed that state into the overlay for row styling.
- Fixed the visible `Button` artifact in the Swift overlay.
- Redesigned the overlay into a cleaner row-first panel with a more restrained visual treatment.
- Captured iTerm session `unique id` and tab index at launch and used them for higher-confidence focus targeting.
- Changed row click behavior so the overlay hides on click but the row only clears when the session actually becomes active again.

## Validation
- `npm run check`
- `npm run build`
- `codex-beacon config show|get|set` against a temporary config root
- Fake-overlay daemon smoke flow verified:
  - `show` events include presentation config and summary state
  - summary falls back from a generic latest message to an older meaningful assistant message
  - iTerm metadata persists `terminalTabIndex` and `terminalSessionUniqueId`
  - `clear` still removes the waiting row through daemon state

## Remaining next steps
- Validate the new overlay visuals in a real session and tune spacing if needed after live use.
- Confirm the iTerm `unique id` focus path on a real multi-window or split-pane workflow.
- Consider whether Beacon should eventually distinguish `summary style` from `state label` more explicitly in the UI.

## Refreshed on 2026-04-15 after custom overlay refactor

## Completed now
- Replaced `terminal-notifier` delivery with a native Swift menu-bar and floating overlay helper.
- Added [macos/CodexBeaconOverlay.swift](/Users/arnavkulkarni/Developer/codex-beacon/macos/CodexBeaconOverlay.swift) as the first custom AppKit UI:
  - menu-bar item
  - waiting-session count
  - custom overlay panel
  - clickable session rows
- Added [scripts/build-overlay.mjs](/Users/arnavkulkarni/Developer/codex-beacon/scripts/build-overlay.mjs) so `npm run build` compiles the helper into `dist/macos/CodexBeaconOverlay`.
- Refactored [src/notify.ts](/Users/arnavkulkarni/Developer/codex-beacon/src/notify.ts) into an overlay transport that sends `show` and `clear` JSON events to the helper.
- Updated install guidance to require Xcode Command Line Tools instead of `terminal-notifier`.
- Added `*.md` to `.gitignore` as requested. Existing tracked docs remain tracked by git, so this does not remove the repo documentation contract.

## Validation
- `npm run check`
- `npm run build`
- Verified `dist/macos/CodexBeaconOverlay` is an arm64 Mach-O executable.
- Fake-overlay daemon smoke flow verified:
  - `Stop` produces a `show` overlay event with display name, summary, and structured focus command
  - `UserPromptSubmit` produces a matching `clear` event
  - registry status and summary persistence still work

## Remaining next steps
- Run a real Codex session and inspect the actual overlay UI behavior.
- Improve overlay visual polish and spacing after seeing it live.
- Decide whether row click should clear immediately, wait for focus success, or wait for the next `UserPromptSubmit`.
- Add a helper health check or restart command if the UI process dies independently.

## Refreshed on 2026-04-15 after notification click fix

## Completed now
- Fixed notification click commands to use absolute `node` and `dist/cli.js` paths instead of relying on `codex-beacon` being available in the click-time `PATH`.
- Removed mixed `-execute` and `-activate` notification arguments so clicks route through Beacon focus logic.
- Added structured transcript parsing for Codex JSONL assistant messages so notifications show assistant text instead of raw JSON.
- Added app-level focus fallbacks for VS Code and Cursor integrated terminals.

## Validation
- `npm run check`
- `npm run build`
- Fake-notifier daemon smoke flow verified:
  - notification body is extracted assistant text
  - click command is absolute
  - notification removal still uses the same session group
  - VS Code terminal metadata persists in the registry

## Remaining next steps
- Retest a real VS Code integrated-terminal session after rebuilding and relinking.
- Validate real Terminal.app and iTerm2 exact focus from Notification Center.
- Decide whether to build a native macOS notification helper for better app identity and click reliability.

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
