## Seed prompt for the first MVP-building Codex chat

Build Codex Beacon, a low-latency macOS-only notification layer for interactive Codex sessions.

The first goal is to make the user experience feel like this:
- I type `codex`
- the session gets tracked and named automatically as `codex n` unless I pass a custom session name
- when Codex stops and is ready for my next prompt, I get a macOS notification with the session name and a short summary
- if I click the notification, I return to that session's terminal window
- if I prompt that same session again, the notification disappears

Constraints for the first version:
- support Codex only
- support interactive sessions only
- do not support `codex exec`
- do not add meaningful latency to the Codex working loop
- prefer wrapper + hook + daemon architecture over inline hook work
- build docs and code together

After this initial bootstrap conversation, ongoing instructions should move to `AGENTS.md` and active scope should move to `FEATURES.md`.
