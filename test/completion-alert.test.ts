import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadConfig, overlayControlPath, overlaySnapshotPath, saveConfig } from '../src/config.js';
import { handleEvent } from '../src/daemon.js';

test('completion controls preserve automatic presentation and ignore duplicate stops', () => {
  const previous = process.env.NAVEX_HOME;
  const root = mkdtempSync(path.join(tmpdir(), 'navex-completion-'));
  process.env.NAVEX_HOME = root;
  try {
    // The current Node process satisfies the helper liveness check; never launch a GUI in this test.
    saveConfig({ ...loadConfig(), overlayCommand: process.execPath });
    const start = Date.now();
    const timestamp = (offset: number) => new Date(start + offset).toISOString();
    const event = { sessionId: 'completion-test', turnId: 'turn-1', timestamp: timestamp(0) };
    handleEvent({ ...event, type: 'session-active' });
    const stop = { ...event, type: 'session-stop' as const, timestamp: timestamp(1_000), lastAssistantMessage: 'Fixed the overlay timer.' };
    handleEvent(stop);
    const control = JSON.parse(readFileSync(overlayControlPath(), 'utf8'));
    assert.equal(control.action, 'completion');
    assert.equal(control.sessionId, event.sessionId);
    handleEvent(stop);
    assert.equal(JSON.parse(readFileSync(overlayControlPath(), 'utf8')).commandId, control.commandId);
    handleEvent({ ...event, turnId: 'turn-2', type: 'session-active', timestamp: timestamp(2_000) });
    const snapshot = JSON.parse(readFileSync(overlaySnapshotPath(), 'utf8'));
    assert.equal(snapshot.items[0].summary, 'Working…');
    assert.equal(snapshot.presentation.summaryMaxLines, 1);
    handleEvent({ ...stop, turnId: 'turn-2', timestamp: timestamp(3_000) });
    assert.notEqual(JSON.parse(readFileSync(overlayControlPath(), 'utf8')).commandId, control.commandId);
  } finally {
    if (previous === undefined) delete process.env.NAVEX_HOME;
    else process.env.NAVEX_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});
