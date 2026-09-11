import { homedir } from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync, copyFileSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ensureAppRoot } from './config.js';
import { findExecutableOnPath } from './codex-path.js';

export function installMessage(_shell: 'zsh' | 'bash'): string {
  ensureAppRoot();
  return [
    'Install runtime dependencies:',
    '- Node.js 18 or newer',
    '- Xcode Command Line Tools, so swiftc can build the Navex overlay helper',
    '',
    'Start the overlay helper at macOS login:',
    'navex overlay install-login',
    '',
    'Also ensure ~/.codex/config.toml has:',
    '[features]',
    'hooks = true',
    '',
    'Then write the following to ~/.codex/hooks.json:',
    '',
    renderHooksJson(),
    '',
    'Codex 0.130+ requires hook trust review after this file changes:',
    '- Start a new Codex session',
    '- Run /hooks',
    '- Trust the Navex SessionStart, UserPromptSubmit, Stop, Interrupt, and SessionEnd hooks',
    '',
    'No shell wrapper is required. Start sessions normally from Codex Desktop or by running codex.'
  ].join('\n');
}

export function renderHooksJson(): string {
  const cliPath = fileURLToPath(new URL('./cli.js', import.meta.url));
  const navexBin = resolveLinkedNavexBin(cliPath);
  const hookCommand = (event: 'session-start' | 'user-prompt-submit' | 'stop' | 'interrupt' | 'session-end') => {
    return navexBin
      ? `${navexBin} hook ${event}`
      : `${process.execPath} ${cliPath} hook ${event}`;
  };

  return JSON.stringify({
    hooks: {
      SessionStart: [
        {
          hooks: [
            {
              type: 'command',
              command: hookCommand('session-start'),
              async: true,
              statusMessage: 'Navex registering session'
            }
          ]
        }
      ],
      UserPromptSubmit: [
        {
          hooks: [
            {
              type: 'command',
              command: hookCommand('user-prompt-submit'),
              async: true,
              statusMessage: 'Navex marking agent as working'
            }
          ]
        }
      ],
      Stop: [
        {
          hooks: [
            {
              type: 'command',
              command: hookCommand('stop'),
              timeout: 5,
              statusMessage: 'Navex alerting when the agent is done'
            }
          ]
        }
      ],
      Interrupt: [
        {
          hooks: [
            {
              type: 'command',
              command: hookCommand('interrupt'),
              async: true,
              timeout: 3,
              statusMessage: 'Navex recording interrupted agent'
            }
          ]
        }
      ],
      SessionEnd: [
        {
          hooks: [
            {
              type: 'command',
              command: hookCommand('session-end'),
              timeout: 5,
              statusMessage: 'Navex closing session tracking'
            }
          ]
        }
      ]
    }
  }, null, 2);
}

function resolveLinkedNavexBin(cliPath: string): string | null {
  const navexBin = findExecutableOnPath('navex');
  if (!navexBin) {
    return null;
  }

  try {
    return realpathSync(navexBin) === realpathSync(cliPath) ? navexBin : null;
  } catch {
    return null;
  }
}

function shellQuote(value: string): string {
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

export function renderClaudeHooks(): { hooks: Record<string, Array<{ hooks: Array<{ type: string; command: string; timeout: number }> }>> } {
  const cliPath = fileURLToPath(new URL('./cli.js', import.meta.url));
  // Absolute Node and CLI paths also work in Desktop's minimal shell environment.
  const command = `${shellQuote(process.execPath)} ${shellQuote(cliPath)} hook`;
  return { hooks: Object.fromEntries([
    ['SessionStart', 'session-start'],
    ['UserPromptSubmit', 'user-prompt-submit'],
    ['Stop', 'stop'],
    ['SessionEnd', 'session-end']
  ].map(([event, handler]) => [event, [{ hooks: [{
    type: 'command', command: `${command} ${handler} --agent claude`, timeout: 5
  }] }]])) };
}

export function installClaudeHooks(): string {
  const settingsPath = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(homedir(), '.claude'), 'settings.json');
  mkdirSync(path.dirname(settingsPath), { recursive: true });
  const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, 'utf8')) : {};
  settings.hooks ??= {};
  for (const [event, groups] of Object.entries(renderClaudeHooks().hooks)) {
    const existing = settings.hooks[event] ?? [];
    // Replace only our own handlers; preserve other hooks and matcher groups.
    settings.hooks[event] = existing.map((group: { hooks: Array<{ command?: string }> }) => ({
      ...group,
      hooks: group.hooks.filter((hook) => !isNavexClaudeHook(hook.command))
    })).filter((group: { hooks: unknown[] }) => group.hooks.length > 0).concat(groups);
  }
  if (existsSync(settingsPath)) copyFileSync(settingsPath, `${settingsPath}.navex-backup-${Date.now()}`);
  const temporary = `${settingsPath}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(settings, null, 2) + '\n', { mode: 0o600 });
  renameSync(temporary, settingsPath);
  return settingsPath;
}

function isNavexClaudeHook(command?: string): boolean {
  return !!command && command.includes('navex') && / hook (session-start|user-prompt-submit|stop|session-end) --agent claude$/.test(command);
}
