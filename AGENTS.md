## Mission

Build and maintain Codex Beacon, a low-latency macOS notification layer for interactive Codex sessions.

The product goal for the MVP is simple:

1. a user types `codex`
2. the session is tracked and named
3. when Codex returns control, the user sees a notification with the session name and a compact summary
4. clicking the notification takes the user back to the session that needs the next prompt
5. when the user prompts that session again, the notification clears

## Working mode

Bias toward implementation. Ship a thin working slice quickly, then harden.

Do not overbuild session intelligence early. The fastest reliable path is:
- interactive sessions only
- macOS only
- Codex only
- local machine only
- no `codex exec`
- no cross-machine sync

## Repo documentation contract

For every meaningful code change and for every commit, update the repo docs with the most recent dated entry.

Always update all of these files when the repo changes materially:

- `ARCHITECTURE.md`
- `FINDINGS.md`
- `PROGRESS.md`
- `FEATURES.md`

Use the current date in each new top entry.

## Prompt file rule

`PROMPT.md` exists only for the first-ever Codex chat that builds or reshapes the MVP.

After the MVP bootstrap conversation:
- do not keep rewriting `PROMPT.md` as a running log
- treat it as archival seed context
- put ongoing execution guidance in `AGENTS.md`
- put current scope in `FEATURES.md`

## Commit rule

Use this commit format only:

`verb: describe change related to verb`

Examples:
- `bootstrap: initialize codex beacon repository`
- `build: add detached daemon socket server`
- `fix: clear notification when session resumes`
- `docs: refresh architecture and findings for stop hook flow`
- `refactor: simplify transcript summary extraction`

Keep commits imperative, concise, and specific.

## Product priorities

In order:

1. do not add noticeable latency to active Codex sessions
2. make click-to-focus reliable on macOS terminal apps
3. keep user installation simple
4. keep session naming stable and understandable
5. keep docs current enough that a fresh Codex session can continue work instantly

## Engineering rules

- Keep hook handlers tiny.
- Prefer async queueing over inline processing.
- Isolate macOS-specific code behind clean interfaces.
- Centralize config paths, socket paths, and session state models.
- Prefer additive future hooks over brittle transcript parsing.
- Gracefully degrade when transcript paths or terminal metadata are missing.
- Never require extra work from the Codex session after the wrapper is installed.

## UI execution standard

- Treat every UI change as design work, not only implementation work.
- Validate UI changes visually after building. Do not stop at compile-success for overlay or helper changes.
- Prefer explicit layout systems, shared metrics, and clear interaction zones over one-off nudges or scattered constants.
- Fix spacing, clipping, overflow, alignment, and hit-target ambiguity at the root constraint/layout level whenever possible.
- When a UI pass still looks off, iterate again. Do not ship the first technically functional version if the visual result is visibly imbalanced.
- For overlay rows specifically, keep these stable:
  - even vertical rhythm from top to bottom
  - summaries that use the available width before wrapping
  - action controls aligned to a deliberate column
  - drag, focus, dismiss, and reprompt zones that do not compete with each other

## MVP acceptance bar

A good MVP means:

- wrapper install works
- sessions get unique names
- stop hook produces a notification with a useful short summary
- notification click focuses the originating terminal window in at least Terminal.app and iTerm2
- user prompt submit clears the outstanding notification
- state survives daemon restarts through on-disk JSON

## Future feature posture

Keep future ideas in `FEATURES.md`. Do not let future ideas expand the MVP until the working section is done.

## Current UI direction

The active UI direction is a custom macOS menu-bar and floating overlay helper built from this repo, not `terminal-notifier` or Notification Center.

For now, treat clone plus `npm install`, `npm run build`, and `npm link` as the supported install path. Do not optimize for public npm packaging, Homebrew, notarization, or the Mac App Store unless explicitly requested.
