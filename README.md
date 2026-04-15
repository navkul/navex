# Codex Beacon

Codex Beacon is a low-latency macOS companion for Codex interactive sessions.

It tracks open interactive Codex sessions, assigns each one a stable display name like `codex 1`, opens a custom macOS menu-bar overlay when a session returns control, and lets you click the overlay row to jump back to the terminal session that needs your next prompt.

## Goals

- keep the Codex hook path fast enough that it does not meaningfully slow active sessions
- support only interactive Codex sessions for the MVP
- give every active session a unique monotonic display name, unless the user provides a custom one
- summarize the latest session state in the overlay row
- let a click focus the original macOS terminal window when possible
- clear the session overlay row as soon as the user prompts Codex again
- make installation easy for the main user now and other macOS users later

## MVP architecture

- a thin shell wrapper launches Codex and injects session metadata into the environment
- Codex hooks emit tiny JSON events on `SessionStart`, `UserPromptSubmit`, and `Stop`
- a background daemon receives hook events over a local Unix socket
- the daemon updates session state and sends show/clear events to a native Swift menu-bar overlay helper
- overlay row clicks run a local focus command that re-activates the terminal app and window

The hook path should do no heavy work. It should enqueue and return.

## Why this stack

The current repo uses Node + TypeScript for the MVP because:

- clone-plus-link distribution is simple for local use
- the hook handlers can be tiny and fast
- a detached daemon process is easy to manage on macOS
- AppleScript interop is straightforward from Node
- a small Swift helper gives Beacon a custom local UI without rewriting hook and daemon logic
- it keeps the iteration loop short while the product shape is still moving

The native Swift helper is now part of the MVP path. Mac App Store packaging is not required for the current clone-and-link workflow.

## Installation target

### Main user path

1. Install Node.js 18 or newer.
2. Install Xcode Command Line Tools so `swiftc` is available.
3. `npm install`
4. `npm run build`
5. `npm link`
6. `codex-beacon install --shell zsh`
7. Add the printed snippet to your shell rc file and reload the shell.

### Other clone users later

- clone this repo
- run the same local install steps
- use `npm link`

## Planned shell UX

After install, the user should still type `codex`.

The shell wrapper will:

- intercept optional session naming flags like `--session-name` or `-N`
- preserve the real Codex binary path in `CODEX_BEACON_CODEX_BIN`
- capture terminal app, TTY, and best-effort window metadata
- register the launch with Codex Beacon
- exec the real Codex binary

Examples:

```bash
codex
codex -N api-migration
codex "build the MVP for the overlay daemon"
```

## Current repo status

This repository contains a real scaffold for:

- session registry
- daemon socket server
- low-latency hook handlers
- terminal focus helpers
- install and shell integration generation
- native Swift menu-bar and overlay helper
- markdown operating docs tailored for Codex

The session-summary extraction is intentionally conservative for the MVP. It reads the transcript tail when available and falls back to a generic ready/stopped message when structured parsing is insufficient.

The current focus path is best effort: it tries to match the original Terminal.app or iTerm2 session by TTY, then by recorded window id, then falls back to activating the terminal app. VS Code and Cursor integrated terminals currently get app-level focus only.

The active UI direction is a custom local menu-bar and overlay helper built from [macos/CodexBeaconOverlay.swift](/Users/arnavkulkarni/Developer/codex-beacon/macos/CodexBeaconOverlay.swift). It is intended for clone-plus-link use first; Mac App Store packaging is not required for the current workflow.
