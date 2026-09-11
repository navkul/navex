import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { listSessions, upsertFromEvent } from '../src/session-registry.js';

test('keeps Desktop sessions that do not have launcher processes', { concurrency: false }, () => {
  const root = mkdtempSync(path.join(tmpdir(), 'navex-registry-'));
  const previous = process.env.NAVEX_HOME;
  process.env.NAVEX_HOME = root;

  try {
    upsertFromEvent({
      type: 'session-active',
      sessionId: 'thread-desktop',
      turnId: 'turn-1',
      cwd: '/workspace',
      surface: 'desktop',
      navigationPrecision: 'exact-thread',
      timestamp: '2026-09-09T10:00:00.000Z'
    });
    upsertFromEvent({
      type: 'session-stop',
      sessionId: 'thread-desktop',
      turnId: 'turn-1',
      cwd: '/workspace',
      surface: 'desktop',
      navigationPrecision: 'exact-thread',
      timestamp: '2026-09-09T10:01:00.000Z'
    });

    const [session] = listSessions();
    assert.equal(session.sessionId, 'thread-desktop');
    assert.equal(session.kind, 'codex-thread');
    assert.equal(session.surface, 'desktop');
    assert.equal(session.status, 'done');
    assert.equal(session.lastCompletedTurnId, 'turn-1');

    upsertFromEvent({
      type: 'session-active',
      sessionId: 'thread-desktop',
      turnId: 'turn-2',
      cwd: '/workspace',
      surface: 'desktop',
      navigationPrecision: 'exact-thread',
      timestamp: '2026-09-09T10:02:00.000Z'
    });
    upsertFromEvent({
      type: 'session-stop',
      sessionId: 'thread-desktop',
      turnId: 'turn-1',
      cwd: '/workspace',
      surface: 'desktop',
      navigationPrecision: 'exact-thread',
      timestamp: '2026-09-09T10:01:30.000Z'
    });

    const [afterLateStop] = listSessions();
    assert.equal(afterLateStop.status, 'active');
    assert.equal(afterLateStop.turnId, 'turn-2');
  } finally {
    if (previous === undefined) delete process.env.NAVEX_HOME;
    else process.env.NAVEX_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test('labels default agents with uppercase Roman numerals', { concurrency: false }, () => {
  const root = mkdtempSync(path.join(tmpdir(), 'navex-registry-'));
  const previous = process.env.NAVEX_HOME;
  process.env.NAVEX_HOME = root;

  try {
    for (let index = 1; index <= 10; index += 1) {
      upsertFromEvent({
        type: 'session-active',
        sessionId: `thread-${index}`,
        cwd: '/workspace',
        surface: 'desktop',
        navigationPrecision: 'exact-thread',
        timestamp: `2026-09-09T10:${String(index).padStart(2, '0')}:00.000Z`
      });
    }

    const names = new Map(listSessions().map((session) => [session.sessionId, session.displayName]));
    assert.equal(names.get('thread-1'), 'I');
    assert.equal(names.get('thread-4'), 'IV');
    assert.equal(names.get('thread-9'), 'IX');
    assert.equal(names.get('thread-10'), 'X');
  } finally {
    if (previous === undefined) delete process.env.NAVEX_HOME;
    else process.env.NAVEX_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test('migrates custom names to provider numerals without changing tracking or cloud labels', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'navex-names-'));
  const previous = process.env.NAVEX_HOME;
  process.env.NAVEX_HOME = root;
  try {
    const sessions = [
      { sessionId: 'codex-a', agent: 'codex', displayName: 'api-migration', surface: 'desktop' },
      { sessionId: 'claude:a', agent: 'claude', displayName: 'I', surface: 'cli' },
      { sessionId: 'claude:b', agent: 'claude', displayName: 'custom-claude', surface: 'desktop' },
      { sessionId: 'cloud:task', agent: 'codex', displayName: 'Production', surface: 'cloud', kind: 'cloud-task' }
    ].map((session, index) => ({
      kind: 'codex-thread', ...session, isCustomName: true, cwd: '/workspace',
      createdAt: `2026-09-11T10:0${index}:00.000Z`, updatedAt: '2026-09-11T11:00:00.000Z',
      status: 'active', lastSummary: 'Keep this summary', terminalTty: '/dev/ttys001'
    }));
    writeFileSync(path.join(root, 'registry.json'), JSON.stringify({ sessions: Object.fromEntries(sessions.map(s => [s.sessionId, s])) }));
    const migrated = new Map(listSessions().map(s => [s.sessionId, s]));
    assert.equal(migrated.get('codex-a')?.displayName, 'I');
    assert.equal(migrated.get('claude:a')?.displayName, 'I');
    assert.equal(migrated.get('claude:b')?.displayName, 'II');
    assert.equal(migrated.get('cloud:task')?.displayName, 'Production');
    for (const original of sessions) {
      const { displayName, isCustomName, ...metadata } = original;
      const { displayName: assignedName, ...persistedMetadata } = migrated.get(original.sessionId)!;
      assert.deepEqual(persistedMetadata, { ...metadata, navigationPrecision: original.surface === 'desktop' ? 'exact-thread' : 'exact-window' });
    }
    assert.doesNotMatch(readFileSync(path.join(root, 'registry.json'), 'utf8'), /isCustomName/);
  } finally {
    if (previous === undefined) delete process.env.NAVEX_HOME;
    else process.env.NAVEX_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});
