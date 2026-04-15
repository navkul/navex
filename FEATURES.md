# Working now

## MVP features to implement
- transparent shell wrapper so the user still types `codex`
- monotonic default naming for active interactive sessions
- optional custom session name flag
- persistent session registry on disk
- low-latency `Stop` hook notification flow
- `UserPromptSubmit` notification clearing
- compact session summary extraction from transcript tail
- macOS notification click-to-focus for Terminal.app
- macOS notification click-to-focus for iTerm2
- config for max notification characters
- config for notification transport behavior
- install command that wires hooks and shell wrapper cleanly
- beta install path via clone plus `npm link`

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
