import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { upsertFromEvent, getSession, removeSession, loadRegistry } from '../dist/session-registry.js';
import { detectSessionOrigin } from '../dist/session-origin.js';
import { installClaudeHooks } from '../dist/install.js';

const root = mkdtempSync(path.join(tmpdir(), 'navex-test-'));
process.env.NAVEX_HOME = root;
process.env.CLAUDE_CONFIG_DIR = root;
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
let tick = 0;
function event(sessionId, agent, type = 'register-session', extra = {}) {
  return upsertFromEvent({ sessionId, agent, type, timestamp: new Date(1800000000000 + tick++).toISOString(), ...extra });
}

test('providers count independently, including removal and legacy sessions', () => {
  event('c1', 'codex');
  event('claude:a1', 'claude');
  event('claude:a2', 'claude');
  event('c2', 'codex');
  assert.equal(getSession('c1').displayName, 'I');
  assert.equal(getSession('c2').displayName, 'II');
  assert.equal(getSession('claude:a1').displayName, 'I');
  assert.equal(getSession('claude:a2').displayName, 'II');
  removeSession('claude:a1');
  assert.equal(getSession('claude:a2').displayName, 'I');
  assert.equal(getSession('c2').displayName, 'II');
  const registry = loadRegistry();
  delete registry.sessions.c1.agent;
  delete registry.sessions['claude:a2'].agent;
  writeFileSync(path.join(root, 'registry.json'), JSON.stringify(registry));
  assert.equal(getSession('c1').agent, 'codex');
  assert.equal(getSession('claude:a2').agent, 'claude');
  assert.equal(getSession('claude:a2').displayName, 'I');
  assert.equal(getSession('c2').displayName, 'II');
});

test('Claude can complete, resume, interrupt, and end without turn IDs', () => {
  assert.equal(event('claude:lifecycle', 'claude', 'session-active').status, 'active');
  assert.equal(event('claude:lifecycle', 'claude', 'session-stop').status, 'done');
  assert.equal(event('claude:lifecycle', 'claude', 'session-active').status, 'active');
  assert.equal(event('claude:lifecycle', 'claude', 'session-interrupt').status, 'interrupted');
  assert.equal(event('claude:lifecycle', 'claude', 'session-active').status, 'active');
  assert.equal(event('claude:lifecycle', 'claude', 'session-end').status, 'done');
});

test('desktop provider wins over inherited terminal metadata', () => {
  const origin = detectSessionOrigin({ NAVEX_AGENT: 'claude', CLAUDE_CODE_ENTRYPOINT: 'claude-desktop', TERM_PROGRAM: 'iTerm.app' });
  assert.equal(origin.surface, 'desktop');
  assert.equal(origin.navigationPrecision, 'application-only');
  assert.equal(origin.terminalApp, undefined);
  assert.equal(detectSessionOrigin({ NAVEX_AGENT: 'claude', NAVEX_TERMINAL_TTY: '/dev/ttys001', TERM_PROGRAM: 'iTerm.app', CODEX_INTERNAL_ORIGINATOR_OVERRIDE: 'desktop' }).surface, 'cli');
});

test('install is idempotent and preserves settings and unrelated hooks', () => {
  const settings = { permissions: { allow: ['Read'] }, hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo existing' }] }] } };
  writeFileSync(path.join(root, 'settings.json'), JSON.stringify(settings));
  installClaudeHooks();
  installClaudeHooks();
  const installed = JSON.parse(readFileSync(path.join(root, 'settings.json'), 'utf8'));
  assert.deepEqual(installed.permissions, settings.permissions);
  assert.equal(installed.hooks.Stop.length, 2);
  assert.equal(installed.hooks.Stop[0].hooks[0].command, 'echo existing');
  assert.equal(installed.hooks.SessionStart.length, 1);
  assert.equal(installed.hooks.Interrupt, undefined);
});

test('real hook CLI sends namespaced Claude events and final message over IPC', async () => {
  const server = net.createServer();
  server.listen(path.join(root, 'daemon.sock'));
  await once(server, 'listening');
  try {
    for (const [hook, type] of [['session-start', 'register-session'], ['user-prompt-submit', 'session-active'], ['stop', 'session-stop'], ['session-end', 'session-end']]) {
      const received = new Promise(resolve => server.once('connection', socket => {
        let body = '';
        socket.on('data', data => body += data);
        socket.on('end', () => resolve(JSON.parse(body)));
      }));
      const child = spawn(process.execPath, ['dist/cli.js', 'hook', hook, '--agent', 'claude'], {
        env: { ...process.env, CLAUDE_CODE_ENTRYPOINT: 'claude-desktop', NAVEX_SESSION_NAME: 'ignored-legacy-name' }, stdio: ['pipe', 'ignore', 'pipe']
      });
      child.stdin.end(JSON.stringify({ session_id: 'same-id', cwd: '/tmp', last_assistant_message: 'Implemented Claude support.' }));
      const [code] = await once(child, 'exit');
      assert.equal(code, 0);
      const payload = await received;
      assert.equal(payload.sessionId, 'claude:same-id');
      assert.equal(payload.agent, 'claude');
      assert.equal(payload.displayName, undefined);
      assert.equal(payload.surface, 'desktop');
      assert.equal(payload.type, type);
      if (hook === 'stop') assert.equal(payload.lastAssistantMessage, 'Implemented Claude support.');
    }
  } finally { server.close(); }
});
