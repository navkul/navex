# April 15, 2026 custom overlay findings

## Implementation findings
- A custom overlay does not require the Mac App Store for the current local-use goal.
- The quickest useful architecture is a native Swift helper launched by the existing Node daemon, not a full rewrite of the daemon in Swift.
- `swiftc` is available locally through Xcode Command Line Tools and successfully builds a single-file AppKit helper.
- Keeping daemon-to-helper communication as newline-delimited JSON over stdin keeps the hook path unchanged and avoids adding another local socket for the first custom UI slice.

## Product findings
- Replacing `terminal-notifier` with a custom overlay gives Beacon control over layout, wording, row click behavior, menu-bar state, and app identity.
- This also means Beacon now owns UI lifecycle details that macOS Notification Center previously handled, including later viewing, dismissal behavior, and visual polish.
- For the MVP, this tradeoff is acceptable because the user values getting the custom UI direction out of the way more than public packaging.

# April 15, 2026 notification click findings

## Screenshot findings
- The reported notification showed raw Codex transcript JSON in the body, which means the transcript summarizer was selecting the latest assistant-ish JSON line but not parsing it.
- The screenshots show a VS Code integrated terminal. The original MVP focus path targeted Terminal.app and iTerm2 only, so exact VS Code terminal focus was outside the implemented focus model.
- The click command used `codex-beacon` by name. macOS notification click actions can run in a sparse environment where npm-linked binaries are not on `PATH`, so the click could fail before Beacon focus code ran.
- Passing both `-execute` and `-activate` to `terminal-notifier` is fragile for this product because Beacon needs click handling to run its own focus command.

## Product findings
- Using `terminal-notifier` means the notification will always look like a standard macOS notification from that transport/app identity. Beacon can improve title, body, icon, and sound, but not redesign the banner.
- A native helper is a moderate next step, not a rewrite of the whole daemon. The clean shape is:
  - Node daemon keeps registry, hook IPC, and summary logic
  - native macOS helper owns notification presentation and click callbacks
  - daemon and helper communicate over local IPC

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
