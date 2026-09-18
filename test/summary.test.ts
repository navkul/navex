import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeAssistantMessage } from '../src/summary.js';
import { AppConfig } from '../src/types.js';

const config: AppConfig = {
  appDisplayName: 'Navex',
  overlayCommand: null,
  overlayHotkey: null,
  overlayWidth: 384,
  overlayMaxVisibleRows: 4,
  overlayShowSummary: true,
  overlaySummaryStyle: 'smart',
  overlaySummaryMaxChars: 160,
  overlaySummaryMaxWords: 24,
  overlaySummaryMaxLines: 2
};

test('summarizes the supported Stop hook message without a transcript', () => {
  const result = summarizeAssistantMessage(
    'Done. I implemented Desktop session tracking and updated the tests.',
    config
  );
  assert.equal(result.text, 'I implemented Desktop session tracking and updated the tests.');
  assert.equal(result.state, 'done');
});

test('uses a stable fallback when Stop has no assistant message', () => {
  const result = summarizeAssistantMessage(null, config);
  assert.match(result.text, /^Finished\./);
  assert.equal(result.state, 'ready');
});

test('preserves the lead outcome instead of promoting incidental error wording', () => {
  const result = summarizeAssistantMessage('Added the session picker. Verified that errors are handled by the fallback.', config);
  assert.equal(result.text, 'Added the session picker.');
});

test('keeps bullet boundaries and removes headings and markdown emphasis', () => {
  const result = summarizeAssistantMessage('# Summary\n\nDone.\n- **Added the session picker**\n- Updated the tests', config);
  assert.equal(result.text, 'Added the session picker');
});

test('preserves a request for input as the next action', () => {
  const result = summarizeAssistantMessage('Which deployment target should I use? The code is ready.', config);
  assert.equal(result.text, 'Which deployment target should I use?');
});

test('retains failure and blocker text even when the response is only a status or heading', () => {
  assert.equal(summarizeAssistantMessage('Failed.', config).text, 'Failed.');
  assert.equal(summarizeAssistantMessage('Blocked.', config).text, 'Blocked.');
  assert.equal(summarizeAssistantMessage('# Build failed', config).text, 'Build failed');
});

test('uses a compact fallback for acknowledgments and code-only replies', () => {
  assert.equal(summarizeAssistantMessage('Done.', config).text, 'Finished.');
  assert.equal(summarizeAssistantMessage('```sh\nnpm test\n```', config).text, 'Finished.');
});

test('keeps non-English outcomes and applies configured limits', () => {
  assert.equal(summarizeAssistantMessage('已完成会话列表。', config).text, '已完成会话列表。');
  assert.equal(summarizeAssistantMessage('Added support for automatic session cleanup.', { ...config, overlaySummaryMaxWords: 4 }).text, 'Added support for automatic…');
});

test('raw mode keeps the whole response on one text line', () => {
  assert.equal(summarizeAssistantMessage('Added the picker.\nTests passed.', { ...config, overlaySummaryStyle: 'raw' }).text, 'Added the picker. Tests passed.');
});
