# Working now

## Changed on 2026-04-21 overlay window anchoring fix
- the queue now renders in a plain borderless helper window anchored under the `Beacon` menu-bar item
- the helper window now joins all spaces and is explicitly ordered above the active desktop
- the visible overlay has been verified in a real full-screen compositor capture, not only through direct window capture

## Changed on 2026-04-21 overlay bootstrap visibility fix
- the helper now bootstraps directly from `overlay-snapshot.json` instead of waiting for stdin `show` events to paint the first overlay state
- helper startup now writes visibility diagnostics to `~/.codex-beacon/overlay-helper.log`
- overlay placement now targets the current mouse screen and active space before ordering the panel
- the overlay visibility path has been validated through the live macOS window list, not just by inspecting Beacon state files

## Changed on 2026-04-21 overlay snapshot recovery
- the daemon now persists the current overlay model in `overlay-snapshot.json`
- the helper reloads waiting sessions from the persisted overlay snapshot
- daemon startup replays waiting sessions so overlay state can recover after Beacon restarts

## Changed on 2026-04-21 overlay queue controls
- waiting rows can now be reordered by drag handle instead of staying alphabetic
- the overlay keeps a helper-local waiting-row order in `overlay-state.json`
- each row now includes a compact inline reprompt field
- each row now includes a minimalist usage meter driven by the latest transcript rate-limit snapshot
- inline reprompt is supported for iTerm/iTerm2 and Terminal.app sessions

## Changed on 2026-04-17 focus reliability hardening
- iTerm session identity now falls back to `ITERM_SESSION_ID` or `TERM_SESSION_ID` instead of depending only on AppleScript launch capture
- `SessionStart` now backfills terminal app and iTerm session identity from the shell environment when wrapper metadata is missing
- exact terminal focus now only succeeds on a real match instead of treating a successful AppleScript run as success
- terminal-backed sessions now fail closed when the original live target cannot be found

## Changed on 2026-04-17 overlay interaction tweaks
- overflow rows now scroll instead of being hidden
- clicking a row removes it from the overlay immediately
- each row now has a small dismiss affordance for clearing it without focusing

## Changed on 2026-04-16 overlay polish
- overlay width, max visible rows, summary visibility, summary style, and word/char/line limits are now configurable
- `codex-beacon config` now manages Beacon settings without hand-editing JSON
- the summarizer now skips generic fragments and prefers a stronger assistant sentence from the current turn
- iTerm focus uses session `unique id` and tab index in addition to tty and window id
- clicking a row hides the overlay but leaves the row active until the session really resumes
- the overlay visuals were redesigned to remove the visible button label and use a cleaner minimal row style

## Changed on 2026-04-15 custom overlay pivot
- `terminal-notifier` is no longer the active notification transport
- native Swift menu-bar and overlay helper is now the active UI direction
- `npm run build` compiles both the Node daemon and the Swift helper
- local clone plus `npm link` remains the only install target for now
- markdown files are now ignored for new untracked files; existing tracked docs remain versioned

## Implemented in the custom UI slice
- menu-bar item labeled `Beacon`
- waiting-session count in the menu bar
- custom floating overlay with one row per waiting session
- row click runs the Beacon focus command
- daemon-to-helper `show` and `clear` events over stdin
- row state dot derived from summary classification
- drag handle for row ordering
- inline reprompt field for supported terminal sessions
- compact five-hour plus weekly usage meter

## Changed on 2026-04-15
- notification click commands now use absolute Node and CLI paths
- notification bodies parse assistant text from Codex JSONL instead of showing raw transcript JSON
- VS Code and Cursor integrated terminals have app-level focus fallbacks
- this Notification Center path is superseded by the custom overlay pivot above

## MVP feature state as of 2026-04-15

## Implemented or wired
- transparent shell wrapper flow so the user still types `codex`
- real Codex binary preservation through `CODEX_BEACON_CODEX_BIN`
- monotonic default naming for tracked sessions
- optional custom session name flag with deterministic conflict suffixes
- persistent session registry on disk
- low-latency `SessionStart`, `Stop`, and `UserPromptSubmit` hook event emission
- `Stop` hook notification flow through the daemon
- `UserPromptSubmit` notification clearing
- compact transcript-tail summary fallback with smart assistant-text selection
- config for maximum notification body characters
- beta install path via clone, `npm install`, `npm run build`, and `npm link`
- app-level click fallback for VS Code and Cursor integrated terminals

## Partially wired, needs live macOS validation
- custom overlay visual behavior in a real Codex session
- custom row ordering persistence across helper relaunch in real use
- inline reprompt field feel and text-entry behavior in the real overlay
- Terminal.app focus by TTY, then window id, with hard failure if no live match is found
- iTerm/iTerm2 focus by session `unique id`, then tty, then window+tab, then window, with hard failure if no live match is found
- VS Code and Cursor focus only activate the app; exact integrated terminal selection is not yet implemented
- VS Code and Cursor do not yet support inline reprompt
- install command prints a safer shell wrapper and hook instructions but does not yet edit user files directly

## Still to harden
- richer status classification in summaries:
  - completed feature
  - blocked
  - needs approval
  - test failure
- installer checks for Swift toolchain, Codex hooks config, and existing shell snippets
- real overlay and terminal focus validation notes
- overlay polish:
  - row hover and selected states
  - keyboard dismissal
  - better empty state
  - helper restart/status command

# Future ideas

## Near-term future
- support Claude Code after Codex is stable
- support session reattachment or resume-aware focus when the original terminal is gone
- richer status classification:
  - finished
  - blocked
  - needs approval
  - test failure
- local dashboard of all active and recent sessions
- per-session metrics:
  - time running
  - time idle
  - commits made
  - tokens used if available
- menu bar app for quick session switching
- better terminal support for Warp, Ghostty, tmux, and VS Code integrated terminal

## Longer-term future
- publish on npm
- Homebrew tap
- native Swift helper for notifications and focus
- optional local web dashboard
- project-aware summaries and commit rollups
- multi-machine sync
