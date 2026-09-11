import { installClaudeHooks, installCodexHooks } from './install.js';
import { installOverlayLoginItem } from './overlay-login.js';

export function setup(
  options: { claude?: boolean; codex?: boolean },
  startOverlay: () => string = installOverlayLoginItem
): string {
  if (!options.claude && !options.codex) {
    throw new Error('Choose navex setup --claude, navex setup --codex, or both flags.');
  }
  const messages: string[] = [];
  if (options.claude) {
    messages.push(`Claude Code configured: ${installClaudeHooks()}`);
    messages.push('Restart existing Claude Code sessions and Claude Desktop to load the hooks.');
  }
  if (options.codex) {
    messages.push(`Codex configured: ${installCodexHooks().join(', ')}`);
    messages.push('Required: start Codex, run /hooks, and trust the Navex SessionStart, UserPromptSubmit, Stop, Interrupt, and SessionEnd hooks. Then restart Codex Desktop.');
  }
  try {
    startOverlay();
  } catch (error) {
    throw new Error(`${messages.join('\n')}\nAgent configuration saved, but overlay startup failed: ${error instanceof Error ? error.message : String(error)}\nRun navex overlay install-login to retry.`);
  }
  messages.push('Navex is running and will start at login. Press ⌘⌥K to show the overlay.');
  return messages.join('\n');
}
