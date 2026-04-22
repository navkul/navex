# April 22, 2026 event-driven visibility findings

## Visibility findings
- The unwanted "overlay appears as soon as I prompt Codex" behavior came from two separate startup paths:
  - helper startup treated any persisted waiting snapshot as a reason to auto-open
  - daemon cold-start replay could resurrect the helper during `UserPromptSubmit`
- Persisted waiting state and visible notification state need to be separate concerns:
  - snapshot persistence is for recovery
  - visible overlay opening should stay tied to a fresh waiting transition
- The right trigger is the delta in waiting session ids, not simply `items.count > 0`.
- Daemon replay should rebuild snapshot state quietly. Replaying old waiting sessions as synthetic `show` notifications makes recovery feel like a new notification.

## Layout findings
- The panel looked bottom-heavy because the root view was flipped but the background container was not. Header labels were being laid out in the background view's default bottom-origin coordinate system.
- For this overlay, top-right fixed positioning on the active screen is cleaner than anchoring under the menu-bar item. The queue reads more like a lightweight desktop notification surface than a popover menu.

# April 22, 2026 overlay space findings

## Space findings
- The restart fix solved helper startup, but it also removed the only behavior that let the overlay escape the terminal's original space.
- Applying a Spaces behavior during `configurePanel()` is too early for this helper, but applying it at show time is stable.
- Apple's `canJoinAllSpaces` behavior is the better fit for this overlay surface than `moveToActiveSpace`:
  - `moveToActiveSpace` depends on window activation semantics
  - `canJoinAllSpaces` matches menu-bar behavior and is more deterministic for a passive queue surface
- A menu-bar anchored overlay should behave globally across desktops until it is dismissed or cleared. That is closer to the user's expectation than leaving it stranded on the terminal's space.

# April 22, 2026 helper startup findings

## Startup findings
- The overlay restart bug was not in the daemon, snapshot replay, or helper hydration path. Those parts were working and the helper was receiving the waiting-session model correctly.
- The helper was stalling during window setup immediately after `window.level = .statusBar`.
- The specific bad call was the borderless window `collectionBehavior` assignment:
  - `.canJoinAllSpaces`
  - `.moveToActiveSpace`
  - `.fullScreenAuxiliary`
- Removing that behavior set is the stable path here. The helper still renders and orders on screen without it, and it no longer hangs before the first refresh.
- Live window-server inspection and compositor capture were the decisive checks:
  - before the fix, logs stopped in `configurePanel()`
  - after the fix, the helper produced an onscreen `420x532` window owned by `CodexBeaconOverlay`

# April 21, 2026 overlay surface findings

## Surface findings
- The helper was correctly rendering queue content into its own window, but the `NSPanel`/`NSPopover` variants were still not reliably visible above the active desktop in real compositor captures.
- Direct window capture was the decisive check:
  - the queue UI itself was correct
  - the failure was the presentation surface, not the row rendering path
- Anchoring a plain borderless `NSWindow` under the status item is more reliable here than continuing to fight `NSPanel`/`NSPopover` behavior in this standalone helper.
- Using the status-item button rect as the anchor gives Beacon a concrete screen-space source of truth and avoids guessing with screen selection alone.

# April 21, 2026 overlay visibility findings

## Visibility findings
- The helper process was launching, but it could still come up with only the default empty `384x180` panel state if initial UI hydration depended on runtime event delivery.
- Persisted overlay snapshot state is not enough by itself; the helper has to bootstrap directly from that snapshot before the first UI refresh if Beacon wants reliable restart recovery.
- Querying the live macOS window list was the decisive check here:
  - the helper had windows
  - the panel was initially stuck at its default frame
  - after bootstrap hydration, the panel moved to the expected `420x532` onscreen frame
- A snapshot-driven helper is a better fit than stdin-driven incremental UI for this product. The daemon already renders the current model; the helper only needs to display that model reliably.

# April 21, 2026 overlay recovery findings

## Recovery findings
- The prior overlay design was too dependent on a live helper process ingesting incremental events over stdin. If the helper restarted or lost its in-memory state, Beacon could keep tracking waiting sessions in the registry while showing nothing on screen.
- A persisted overlay snapshot is the right recovery layer here because the helper UI only needs the daemon's latest rendered model, not the full event history.
- Replaying waiting sessions from the registry on daemon startup closes the gap between on-disk session truth and helper-local UI truth.

# April 21, 2026 overlay queue and reprompt findings

## UI findings
- Drag ordering and inline text entry both require the row to own its own mouse behavior. The old full-row invisible button model was too brittle once the row needed a text field, a dismiss target, and a reorder gesture.
- Persisting only the waiting-session order is enough for this helper. The ordering concern is local UI state, not daemon state, so it belongs in a small helper-owned JSON file rather than in the session registry.
- A compact battery visualization is the cleanest way to surface rate-limit state without adding more text to every row. The primary five-hour percent can carry the main fill, with a thinner weekly track underneath.

## Usage findings
- Codex session transcripts already include the current rate-limit snapshot in `event_msg` payloads of type `token_count`.
- That snapshot is account-level, not a mathematically exact per-session attribution. The helper should present it as the latest usage state observed by that session, not claim that the percent was consumed only by that session.

## Reprompt findings
- iTerm2 can accept an unfocused inline reprompt through AppleScript `write text` when Beacon can match the live session by unique id, tty, or window metadata.
- Terminal.app can accept an unfocused inline reprompt through AppleScript `do script ... in candidateTab` for a matched tab or selected tab of a matched window.
- This makes inline reprompt feasible without stealing focus or switching desktops for the two terminal apps Beacon already targets.

# April 17, 2026 focus reliability findings

## Focus findings
- The main focus bug was not the matching order. It was that the AppleScript selectors returned success when the script executed, even when no window, tab, or session matched the requested target.
- That false-positive success path explains the inconsistent user experience: Beacon could report a successful click path while landing in the wrong iTerm window or falling through into a different terminal app later.
- iTerm already exposes a strong session identity in the shell environment through `ITERM_SESSION_ID` and `TERM_SESSION_ID`. Parsing the trailing `unique id` from those variables is cheaper and more reliable than depending only on launch-time AppleScript capture.
- When terminal metadata exists but the target cannot be found live, the right behavior is to fail closed rather than activate some other terminal window. Wrong-window focus is worse than an explicit miss for this product.

## Validation findings
- Live local focus harness checks against three open iTerm windows confirmed:
  - exact focus by iTerm `unique id`
  - fallback focus by tty when app metadata is missing
  - non-matching iTerm targets now fail with an error instead of silently selecting another window

# April 17, 2026 overlay list findings

## UI findings
- Hiding rows beyond the height cap was the wrong interaction model for a menu-bar queue because the menu-bar count and the visible rows could diverge.
- A scroll container is the right fix here because the user still needs a compact top-right surface, but all waiting sessions must remain reachable.
- Row click should remove the visible overlay item immediately. The user expectation is closer to dismissing a notification than to preserving a retry surface.
- A tiny row-level dismiss affordance is enough for this surface; a larger secondary button would make the overlay feel heavier than it needs to.

# April 16, 2026 summary and focus findings

## Summary findings
- The most reliable local summary source is still the latest meaningful assistant text in the Codex transcript JSONL, not tool logs or shell output.
- A good local summary for Beacon should be deterministic and cheap:
  - parse the latest assistant message
  - skip generic fragments like `Done.`
  - classify the turn state
  - prefer the strongest action-oriented sentence or bullet
  - apply whole-word truncation afterward
- This keeps the stop hook fast because all real work still happens in the daemon, and it avoids adding API calls, latency, or another model dependency to generate overlay copy.

## Focus findings
- iTerm2 exposes a session `unique id`, a tab `index`, and a window `id` in its AppleScript model, which is a better focus target than tty alone for split panes and multiple windows. Source: https://iterm2.com/documentation-scripting.html
- When the overlay removed a row immediately on click, a mis-focus looked like the session had disappeared. Keeping the row until the next `UserPromptSubmit` is a better interaction contract.

## UI findings
- The first overlay pass was functionally correct but visually generic. A slimmer header, softer background, row-first click target, and state dot produce a cleaner minimal companion surface.
- The stray `Button` text came from the default NSButton title and is now removed by treating the button as an invisible click target rather than as visible UI copy.

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
