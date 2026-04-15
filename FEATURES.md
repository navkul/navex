# Working now

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
- compact transcript-tail summary fallback
- config for maximum notification body characters
- config for notification sound and app icon when supported by `terminal-notifier`
- beta install path via clone, `npm install`, `npm run build`, and `npm link`

## Partially wired, needs live macOS validation
- macOS notification click action through `terminal-notifier`
- Terminal.app focus by TTY, then window id, then app activation
- iTerm/iTerm2 focus by TTY, then window id, then app activation
- install command prints a safer shell wrapper and hook instructions but does not yet edit user files directly

## Still to harden
- richer status classification in summaries:
  - completed feature
  - blocked
  - needs approval
  - test failure
- installer checks for `terminal-notifier`, Codex hooks config, and existing shell snippets
- config editing commands for notification settings
- real Notification Center and terminal focus validation notes

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
