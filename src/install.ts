import { parse, stringify } from 'smol-toml';
import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ensureAppRoot } from './config.js';

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
  const hookCommand = (event: 'session-start' | 'user-prompt-submit' | 'stop' | 'interrupt' | 'session-end') => {
    return `${shellQuote(process.execPath)} ${shellQuote(cliPath)} hook ${event}`;
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

interface HookHandler {
  type?: string;
  command?: string;
  [key: string]: unknown;
}
interface HookGroup {
  hooks: HookHandler[];
  [key: string]: unknown;
}
type HookSettings = Record<string, unknown> & { hooks?: Record<string, HookGroup[]> };

export function installClaudeHooks(): string {
  const settingsPath = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(homedir(), '.claude'), 'settings.json');
  const settings = mergeHooks(readSettings(settingsPath), renderClaudeHooks().hooks, 'claude');
  writeWithBackup(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  return settingsPath;
}

export function installCodexHooks(): string[] {
  const root = process.env.CODEX_HOME || path.join(homedir(), '.codex');
  const hooksPath = path.join(root, 'hooks.json');
  const configPath = path.join(root, 'config.toml');
  // Validate both inputs before touching either file.
  const settings = mergeHooks(readSettings(hooksPath), JSON.parse(renderHooksJson()).hooks, 'codex');
  const original = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
  const config = parse(original, { integersAsBigInt: 'asNeeded' });
  if (config.features !== undefined && !isObject(config.features)) {
    throw new Error(`${configPath}: expected features to be a table; no Codex files changed.`);
  }
  const features = (config.features ??= {}) as Record<string, boolean>;
  const alreadyEnabled = features.hooks === true;
  features.hooks = true;
  const updated = alreadyEnabled ? original : stringify(config);
  writeWithBackup(hooksPath, JSON.stringify(settings, null, 2) + '\n');
  writeWithBackup(configPath, updated);
  return [hooksPath, configPath];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function readSettings(file: string): HookSettings {
  const settings: unknown = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  if (!isObject(settings) || (settings.hooks !== undefined && !isObject(settings.hooks))) {
    throw new Error(`${file}: expected a settings object with a hooks object; file unchanged.`);
  }
  return settings as HookSettings;
}

function mergeHooks(settings: HookSettings, additions: Record<string, HookGroup[]>, agent: 'claude' | 'codex'): HookSettings {
  settings.hooks ??= {};
  for (const [event, groups] of Object.entries(additions)) {
    const existing = settings.hooks[event] ?? [];
    if (!Array.isArray(existing) || existing.some(group => !isObject(group) || !Array.isArray(group.hooks) || group.hooks.some(hook => !isObject(hook)))) {
      throw new Error(`Invalid ${event} hook configuration; settings unchanged.`);
    }
    settings.hooks[event] = existing.map(group => ({
      ...group,
      hooks: group.hooks.filter(hook => !isNavexHook(hook.command, agent))
    })).filter(group => group.hooks.length > 0).concat(groups);
  }
  return settings;
}

function isNavexHook(command: unknown, agent: 'claude' | 'codex'): boolean {
  if (typeof command !== 'string') return false;
  // Match executable paths, not arbitrary scripts that merely mention Navex.
  const executable = String.raw`(?:'[^']*'|"[^"]*"|[^\s'"])+`;
  const match = command.match(new RegExp(`^(${executable})(?:\\s+(${executable}))?\\s+hook\\s+(?:session-start|user-prompt-submit|stop|interrupt|session-end)(?:\\s+--agent\\s+(claude|codex))?$`));
  if (!match || (match[3] ?? 'codex') !== agent) return false;
  if (match[2] && path.basename(match[1].replace(/['"]/g, '')) !== 'node') return false;
  const target = (match[2] ?? match[1]).replace(/['"]/g, '');
  return path.basename(target) === 'navex' || /[/\\]navex[/\\]dist[/\\]cli\.js$/.test(target)
    || target === fileURLToPath(new URL('./cli.js', import.meta.url));
}

function writeWithBackup(file: string, content: string): void {
  if (existsSync(file) && readFileSync(file, 'utf8') === content) return;
  mkdirSync(path.dirname(file), { recursive: true });
  if (existsSync(file)) copyFileSync(file, `${file}.navex-backup-${randomUUID()}`);
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, content, { mode: 0o600 });
  renameSync(temporary, file);
}
