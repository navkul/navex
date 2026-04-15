# April 15, 2026 continuation findings

## Implementation findings
- The original wrapper launch path spawned Codex and then immediately threw an `unreachable` error. The wrapper now remains attached and exits with the Codex child status.
- The local checkout is on Node 18. The previous `commander` 14 dependency produced engine warnings, while the code and toolchain work on Node 18. The package now targets Node 18 or newer with `commander` 12.
- Preserving the real Codex path at install time is safer than relying on a later `codex` lookup from inside the wrapper flow. The generated snippet now exports `CODEX_BEACON_CODEX_BIN`.
- Custom session names need collision handling because multiple interactive sessions can request the same label. The registry now keeps the requested name when free and appends a numeric suffix on conflict.

## Validation findings
- `npm run check` and `npm run build` pass after the continuation changes.
- A local fake-notifier smoke flow validated:
  - `SessionStart` persists custom name, terminal app, window id, TTY, cwd, and transcript path
  - `Stop` emits a grouped notification command with a truncated summary
  - `UserPromptSubmit` emits the matching notification removal command
  - duplicate custom names become `name 2`
  - unnamed sessions receive monotonic names such as `codex 1`
- Real Notification Center click behavior and real Terminal.app/iTerm2 focusing are still unvalidated on live apps.

# April 15, 2026 research and product findings

## Codex findings
- Codex now supports lifecycle hooks through `hooks.json` and requires the `codex_hooks = true` feature flag in `config.toml`. citeturn659646search1turn659646search7
- The most relevant hook events for this project are `SessionStart` for registration plus the turn-scoped `UserPromptSubmit` and `Stop` events. citeturn773937search0
- Hook commands receive a JSON payload on stdin that includes `session_id`, `cwd`, `transcript_path`, `hook_event_name`, and `model`. citeturn773937search0
- `SessionStart` is the correct place to bind the real Codex `session_id` to a tracked session. The wrapper should still capture terminal metadata and preferred naming, but it should pass those values through environment variables so the `SessionStart` hook can register the actual session id. citeturn773937search0
- Hooks can be loaded from both `~/.codex/hooks.json` and `<repo>/.codex/hooks.json`, which makes a user-level install path practical. citeturn659646search1turn773937search0
- Hook runs for the same event can launch concurrently, so the hook code should avoid shared mutable work and offload quickly to a daemon. citeturn773937search0

## Product findings
- The cleanest MVP is to support only interactive sessions that the user launches through a wrapper. That makes naming, focus, and per-session metadata tractable without trying to infer arbitrary terminal state after the fact.
- The shell wrapper can preserve the user experience where they still type `codex` by installing a shell function that forwards to the real binary.
- Default session names should be monotonic and never reused while a session is active. The simplest implementation is a persistent counter plus active-session uniqueness checks.
- Notification Center already gives the user a later dropdown/history surface, so the MVP does not need a custom list UI to satisfy the “click later” requirement.
- Clearing notifications on reprompt maps naturally to per-session grouped notifications.

## macOS delivery findings
- `terminal-notifier` is still the most practical CLI-compatible notification transport for click actions from a local tool. citeturn649871search1
- Because `terminal-notifier` behavior and packaging on Apple silicon have had community friction, the repo should treat it as a runtime dependency to validate explicitly rather than silently assuming it exists. citeturn649871search13turn649871search1
- AppleScript-based terminal focusing is an acceptable first implementation for Terminal.app and iTerm2, even if a future native helper ends up replacing it.

## MVP conclusion
- Best first stack:
  - Node + TypeScript CLI and daemon
  - Codex hooks for `SessionStart`, `Stop`, and `UserPromptSubmit`
  - shell wrapper for transparent launch interception
  - `terminal-notifier` for notifications
  - AppleScript for click-to-focus
- Best latency posture:
  - hook does almost nothing
  - daemon performs notification and summary work
