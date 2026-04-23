## Refreshed on 2026-04-23 after live overlay-row state pass

## Completed now
- Removed the row dismiss button and left a single trailing open/focus arrow in the old top-button position.
- Taught the helper to show active sessions as live working rows with a disabled animated `Working.` footer instead of a reprompt field.
- Updated header copy so the overlay now reports live and waiting counts together.
- Cleaned helper-side ordering state when rows disappear.

## Validation
- `npm run build`
- `npm run check`
- visual validation from a synthetic live-session snapshot launched through Terminal with screenshot capture at `.codex/navex-overlay-validation.png`

## Remaining next steps
- Run the full wrapper flow against real Codex sessions to confirm the close-event path and the working-to-waiting transitions feel right in everyday use.

## Refreshed on 2026-04-23 after live-session registry pass

## Completed now
- Added launcher-PID tracking so live sessions can be tied back to the wrapper process that owns them.
- Added a `session-exit` daemon event from the wrapper so sessions are removed from the registry as soon as Codex exits.
- Pruned stale pre-upgrade sessions on daemon startup when they cannot be proven live.
- Switched the persisted overlay snapshot from waiting-only rows to the full set of live tracked sessions.

## Validation
- `npm run build`
- `npm run check`

## Remaining next steps
- Refine the overlay row UI so live working sessions read differently from waiting sessions and no longer depend on the old dismiss affordance.

## Refreshed on 2026-04-22 after absolute-hook launcher pass

## Completed now
- Updated `navex install` to prefer the linked absolute `navex` bin for generated hook commands when that bin resolves to the current build.
- Cleaned the live `~/.codex/hooks.json` back down to absolute `navex hook ...` commands instead of repeated `node + dist/cli.js` paths.

## Validation
- `npm run build`
- `npm run check`
- absolute `session-start`, `user-prompt-submit`, and `stop` hook commands all executed successfully through `/Users/arnavkulkarni/.nvm/versions/node/v18.20.8/bin/navex`

## Remaining next steps
- Any Codex session that was already open before the hook file update still needs a restart to pick up the new hook commands.

## Refreshed on 2026-04-22 after hook-path install pass

## Completed now
- Fixed the `UserPromptSubmit hook (failed) error: No such file or directory (os error 2)` issue by switching the live hook file to absolute `node + dist/cli.js` commands.
- Updated `navex install` to print that exact hook JSON automatically for future setup.
- Rewrote the README into a shorter user-facing guide with the current feature set and exact setup/use steps.

## Validation
- `npm run build`
- `npm run check`
- absolute `session-start`, `user-prompt-submit`, and `stop` hook commands all executed successfully against `dist/cli.js`
- reviewed `navex install --shell zsh` output for the generated hook JSON block

## Remaining next steps
- If you rerun install later, refresh `~/.codex/hooks.json` from the new generated output instead of the repo template.

## Refreshed on 2026-04-22 after navex cleanup pass

## Completed now
- Removed the extra `codex-beacon` runtime compatibility paths after the live rename was verified working.
- Moved the active local state from `~/.codex-beacon/` into `~/.navex/`.
- Parked the stale older `~/.navex/` contents in a timestamped backup directory instead of deleting them.
- Re-linked the package so `navex` is the only remaining global bin name on `PATH`.

## Validation
- `npm install --package-lock-only --ignore-scripts`
- `npm run build`
- `npm run check`
- `navex --help`
- `navex hook stop` lazy-started the daemon and `NavexOverlay` from `~/.navex/`

## Remaining next steps
- Delete the timestamped `~/.navex-pre-cleanup-20260422T200500` backup later if you decide you do not need it.

## Refreshed on 2026-04-22 after navex rename pass

## Completed now
- Renamed the primary package, CLI, helper binary, and hook wiring from `codex-beacon` to `navex`.
- Added `appDisplayName` config so the menu-bar helper title can be user-configured without changing the repo/package name.
- Switched the default local state root to `~/.navex/` with best-effort legacy state migration.
- Normalized `config show` output so old notifier-era keys no longer leak through legacy config files.
- Rewrote the public `README.md` around Navex as a personal Codex session manager and updated `.gitignore` for local-only markdown docs.

## Validation
- `npm install --package-lock-only --ignore-scripts`
- `npm run clean && npm run build`
- `npm run check`
- attempted a live visual helper pass with a synthetic snapshot; the local machine still had a legacy Beacon helper/process active, so the rename UI path was verified through the rebuilt helper artifact and runtime logs rather than a clean isolated overlay render

## Remaining next steps
- Reinstall the shell snippet and hooks into your real environment so new sessions use `navex` as the manager command.
- Remove the tracked internal markdown docs from git so the new ignore rules actually take effect.

## Refreshed on 2026-04-22 after overlay footer finish pass

## Completed now
- Increased the content-sized row bottom inset one more step for final footer balance.

## Validation
- `npm run build`
- `npm run check`

## Remaining next steps
- Confirm the live row reads balanced enough to stop UI spacing work on this card shape.

## Refreshed on 2026-04-22 after overlay footer breathing-room pass

## Completed now
- Increased footer breathing room slightly by raising the shared bottom inset for content-sized rows.

## Validation
- `npm run build`
- `npm run check`

## Remaining next steps
- Confirm the live row now feels balanced enough to stop the spacing passes and move on.

## Refreshed on 2026-04-22 after content-sized overlay rows

## Completed now
- Removed the fixed row-height estimate from the overlay helper.
- Rows are now measured from fitted content height before placement in the scroll container.
- Panel height now follows the measured visible rows instead of a hard-coded row multiple.

## Validation
- `npm run build`
- `npm run check`

## Remaining next steps
- Verify on your screen that the rows now collapse tightly around the actual content instead of preserving leftover slack.

## Refreshed on 2026-04-22 after overlay row balance pass

## Completed now
- Tuned the waiting-row metrics for perceptual balance instead of symmetric padding.
- Increased the top inset slightly while reducing bottom inset and footer spacing.
- Reduced row height again without changing the core content/action column structure.

## Validation
- `npm run build`
- `npm run check`

## Remaining next steps
- Verify the live overlay rows now read evenly top-to-bottom on your screen.

## Refreshed on 2026-04-22 after overlay row density pass

## Completed now
- Tightened the waiting-row vertical metric set to reduce excess card height.
- Split the old generic vertical inset into explicit top and bottom insets.
- Reduced reprompt-field height and underline gap so the footer sits more cleanly inside the row.

## Validation
- `npm run build`
- `npm run check`

## Remaining next steps
- Recheck the live overlay on your screen and only tune again if a real row still reads bottom-heavy after the density pass.

## Refreshed on 2026-04-22 after overlay row layout pass

## Completed now
- Reworked `OverlayRowView` so row content and trailing controls use separate columns.
- Added shared row metrics for insets, spacing, and action sizing instead of relying on ad hoc per-control layout.
- Fixed early summary wrapping by constraining the content column to the full width available to the left of the action column.
- Updated `AGENTS.md` with an explicit UI execution standard for visual validation and iterative refinement.

## Validation
- `npm run build`
- `npm run check`
- reviewed the rebuilt overlay layout against the reported issues:
  - short summaries no longer wrap prematurely
  - row content uses even top and bottom spacing
  - trailing controls stay aligned in a stable column

## Remaining next steps
- Retest the rebuilt row layout in your live queue and tune only if a real screen still exposes a spacing edge case not covered by the new column layout.

## Refreshed on 2026-04-22 after overlay control pass

## Completed now
- Replaced full-row focus with a dedicated trailing arrow button under the dismiss button.
- Removed the visible drag-handle icon and made row dragging work from the row body.
- Moved the state indicator dot to the right of the session name.
- Removed the remaining `5h` prefix from the header usage block.
- Tightened overlay typography toward the compact usage-header style.

## Validation
- `npm run build`
- `npm run check`
- captured a fresh overlay screenshot showing:
  - trailing stacked `x` and arrow buttons
  - no drag-handle icon
  - status dot to the right of the session name
  - unlabeled first and second header usage lines

## Remaining next steps
- Retest the new arrow focus button in normal live use to confirm the explicit control feels better than the old full-row focus gesture.

## Refreshed on 2026-04-22 after overlay typography pass

## Completed now
- Switched the overlay typography to the same monospaced system font used by the usage header.
- Removed the `wk` prefix from the weekly usage line.

## Validation
- `npm run build`
- `npm run check`

## Remaining next steps
- Retest the overlay visually to confirm the monospaced type system still feels balanced at your normal size and density.

## Refreshed on 2026-04-22 after overlay header usage pass

## Completed now
- Removed the per-row usage battery from waiting-session rows.
- Added a compact two-line usage summary in the overlay header.
- The header now shows:
  - current 5-hour remaining percentage
  - current weekly remaining percentage
  - reset times
- Compacted the usage copy so the full weekly line fits cleanly in the header width.

## Validation
- `npm run build`
- `npm run check`
- confirmed the overlay screenshot shows:
  - no row-level battery widgets
  - header usage in the top-right
  - full weekly reset line without truncation

## Remaining next steps
- Retest in your normal workflow and decide whether the header should stay always visible in the open overlay or move behind a small disclosure later.

## Refreshed on 2026-04-22 after event-driven overlay visibility fix

## Completed now
- Changed helper auto-open behavior so persisted waiting sessions stay passive on startup and poll reloads.
- The helper now auto-opens only on new waiting-session additions and hides on waiting-session removals.
- Daemon startup now rewrites the overlay snapshot passively instead of replaying waiting sessions as active `show` notifications.
- Repositioned the overlay to the active screen's top-right corner.
- Fixed the panel header layout so `Codex Beacon` and the waiting count render at the top of the panel.

## Validation
- `npm run build`
- `npm run check`
- validated that `hook user-prompt-submit` cold-starts only the daemon, not the helper
- validated that `hook stop` cold-starts the helper and shows the overlay once
- confirmed helper logs now show startup refresh without `showOverlay`, followed by `showOverlay` only for the stop-triggered launch path
- confirmed layout frames now resolve to the active screen's top-right region:
  - `layoutPanel frame={{1032, 372}, {420, 532}}`

## Remaining next steps
- Have the user retest from a normal Codex session to confirm the overlay only appears on stop and not on prompt submit.
- If top-right positioning should track a specific monitor in multi-display setups rather than the mouse screen, add an explicit screen-selection rule in config.

## Refreshed on 2026-04-22 after overlay space visibility fix

## Completed now
- Moved overlay space handling out of startup and into the show path.
- The helper now applies `canJoinAllSpaces` immediately before showing the overlay.
- Added active-space logging around show operations so Beacon can confirm the overlay is visible on the current desktop.

## Validation
- `npm run build`
- killed and restarted the daemon/helper
- triggered a real `Stop` hook path through `node dist/cli.js hook stop`
- confirmed helper logs now show:
  - `showOverlay reason=... activeSpaceBefore=true`
  - `showOverlay visibleAfter=true activeSpaceAfter=true`
- confirmed the helper still completes startup without stalling in `configurePanel()`

## Remaining next steps
- Have the user retest from a non-terminal desktop or space with the new build.
- If a specific full-screen or Stage Manager mode still pins the overlay to the wrong context, add a narrower show-time fallback for that display mode instead of moving behavior setup back into startup.

## Refreshed on 2026-04-22 after helper window startup fix

## Completed now
- Removed the borderless helper window `collectionBehavior` assignment that was stalling startup during `configurePanel()`.
- Kept the deferred snapshot reload so the helper can recover from the initial pre-anchor frame and settle under the `Beacon` status item.
- Reduced the helper log surface back down after isolating the startup bug.

## Validation
- `npm run build`
- killed and restarted the daemon/helper
- triggered a real `Stop` hook path through `node dist/cli.js hook stop`
- confirmed helper logs now continue through:
  - `configurePanel end`
  - `applySnapshot reason=did-finish`
  - `showOverlay visibleAfter=true`
- confirmed via `CGWindowListCopyWindowInfo` that the helper owns an onscreen window at:
  - width `420`
  - height `532`
  - `kCGWindowIsOnscreen = 1`
- captured a real screenshot showing the overlay visible above the active app after helper restart

## Remaining next steps
- Have the user rerun the normal `npm run build` plus fresh `codex` workflow to confirm the repaired helper path matches their local session flow.
- If the initial offscreen pre-anchor frame becomes user-visible, tighten the first-layout timing instead of reintroducing the failing window behavior flags.

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
