# Navex

A personal macOS menu-bar companion for Codex and Claude Code.

## Features

- Track working and finished agents from the CLI or desktop apps.
- Get completion alerts with short summaries.
- Recognize Claude and Codex by their icons and separate Roman numbering.
- Open Codex desktop tasks or return to terminal sessions in Terminal.app and iTerm2. Claude desktop rows open the app; select the session there.
- Reorder, dismiss, and keep tracked sessions across restarts.
- Track Codex Cloud tasks and customize the overlay label, size, summaries, and hotkey.

Claude desktop support is for local Code sessions, not regular chats or remote/cloud sessions.

## Setup

### 1. Install Navex

Requires macOS, Node.js 18+, Xcode Command Line Tools (`xcode-select --install`), and Codex or Claude Code installed and signed in.

```bash
git clone https://github.com/navkul/navex.git
cd navex
npm install
npm link
```

Navex builds automatically during installation. Keep the cloned folder in place.

### 2. Connect your agents

Set up either or both providers.

**Claude Code — CLI and desktop**

```bash
navex install --agent claude --apply
```

This updates `~/.claude/settings.json`, preserving existing settings and saving a backup. Restart existing Claude Code sessions and the Claude desktop app.

**Codex — CLI and desktop**

1. Print the setup instructions:

   ```bash
   navex install --agent codex
   ```

2. Copy the printed JSON into `~/.codex/hooks.json`. If the file already contains hooks, merge the new entries instead of replacing it.
3. Enable hooks in `~/.codex/config.toml` (update the existing `[features]` section if present):

   ```toml
   [features]
   hooks = true
   ```

4. Start a Codex CLI session, run `/hooks`, and trust the Navex **SessionStart**, **UserPromptSubmit**, **Stop**, **Interrupt**, and **SessionEnd** hooks. Restart Codex Desktop afterward.

### 3. Start the overlay

```bash
navex overlay install-login
```

This starts the overlay now and at each macOS login, so **⌘⌥K** is always available. To show it immediately:

```bash
navex overlay show
```

Automatic startup is optional. Remove it with `navex overlay uninstall-login`.

## Use Navex

Run `codex` or `claude` normally, or start a task in the corresponding desktop app. Submit a prompt and Navex will track its progress.

Press **⌘⌥K** to show or hide the overlay. Use the arrow to open a session, drag to reorder, or click × to dismiss a row.

```bash
navex sessions       # List tracked sessions
navex config show    # View preferences
navex --help         # All commands
```
