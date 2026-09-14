import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { handleEvent } from '../src/daemon.js';
import { getSession, upsertFromEvent } from '../src/session-registry.js';
import { parseClaudeProcesses, reconcileClaudeSessions } from '../src/session-liveness.js';

test('Claude cleanup handles exit, missed hooks, live hosts, lookup failure and racing prompts', async () => {
  const previous = process.env.NAVEX_HOME;
  process.env.NAVEX_HOME = mkdtempSync(path.join(tmpdir(), 'navex-liveness-'));
  const add = (id: string, surface: 'desktop' | 'cli' = 'desktop', timestamp = '2026-09-12T10:00:00.000Z') => upsertFromEvent({
    type: 'session-stop', sessionId: id, agent: id.startsWith('claude:') ? 'claude' : 'codex', surface,
    terminalTty: surface === 'cli' ? '/dev/ttys001' : undefined, timestamp
  });
  try {
    const processes = parseClaudeProcesses('1 ?? /sbin/launchd\n2 ?? /Applications/Claude.app/Contents/MacOS/Claude\n3 ttys001 claude\n4 ttys002 /bin/zsh\n5 ?? /tmp/claude-helper');
    assert.equal(processes.length, 2);
    add('claude:desktop'); add('claude:cli', 'cli'); add('codex');
    assert.equal(await reconcileClaudeSessions(async () => processes), false);
    assert.equal(await reconcileClaudeSessions(async () => { throw new Error('denied'); }), false);
    assert.ok(getSession('claude:desktop'));
    assert.equal(await reconcileClaudeSessions(async () => processes.filter((p) => p.desktop)), true);
    assert.equal(getSession('claude:cli'), undefined);
    assert.ok(getSession('claude:desktop'));
    assert.equal(await reconcileClaudeSessions(async () => []), true);
    assert.equal(getSession('claude:desktop'), undefined);
    assert.ok(getSession('codex'));
    add('claude:race');
    await reconcileClaudeSessions(async () => {
      add('claude:race', 'desktop', '2026-09-14T10:00:00.000Z');
      return [];
    });
    assert.ok(getSession('claude:race'));
    handleEvent({ type: 'session-end', sessionId: 'claude:race', agent: 'claude', timestamp: '2026-09-13T10:00:00.000Z' });
    assert.ok(getSession('claude:race'));
    handleEvent({ type: 'session-end', sessionId: 'claude:race', agent: 'claude', timestamp: '2026-09-14T11:00:00.000Z' });
    assert.equal(getSession('claude:race'), undefined);
    handleEvent({ type: 'session-end', sessionId: 'claude:unknown', agent: 'claude', timestamp: '2026-09-14T11:00:00.000Z' });
    assert.equal(getSession('claude:unknown'), undefined);
  } finally {
    rmSync(process.env.NAVEX_HOME!, { recursive: true, force: true });
    if (previous === undefined) delete process.env.NAVEX_HOME;
    else process.env.NAVEX_HOME = previous;
  }
});
