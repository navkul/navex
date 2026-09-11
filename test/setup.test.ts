import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parse } from 'smol-toml';
import { installCodexHooks, installClaudeHooks } from '../src/install.js';
import { setup } from '../src/setup.js';

function fixture(run: (root: string) => void): void {
  const root = mkdtempSync(path.join(tmpdir(), 'navex-setup-'));
  const previous = { codex: process.env.CODEX_HOME, claude: process.env.CLAUDE_CONFIG_DIR };
  process.env.CODEX_HOME = path.join(root, 'codex');
  process.env.CLAUDE_CONFIG_DIR = path.join(root, 'claude');
  mkdirSync(process.env.CODEX_HOME);
  mkdirSync(process.env.CLAUDE_CONFIG_DIR);
  try { run(root); } finally {
    if (previous.codex === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = previous.codex;
    if (previous.claude === undefined) delete process.env.CLAUDE_CONFIG_DIR;
    else process.env.CLAUDE_CONFIG_DIR = previous.claude;
    rmSync(root, { recursive: true, force: true });
  }
}

const readJson = (file: string) => JSON.parse(readFileSync(file, 'utf8'));

test('one setup configures both providers, starts the overlay once, and explains required follow-up', () => fixture(root => {
  let starts = 0;
  const output = setup({ claude: true, codex: true }, () => { starts++; return 'login.plist'; });
  assert.equal(starts, 1);
  assert.match(output, /run \/hooks/);
  assert.match(output, /Restart existing Claude/);
  assert.equal((parse(readFileSync(path.join(root, 'codex/config.toml'), 'utf8')).features as { hooks: boolean }).hooks, true);
  assert.equal(readJson(path.join(root, 'claude/settings.json')).hooks.Stop.length, 1);
}));

test('Codex setup preserves values and other hooks, replaces old Navex commands, and is idempotent', () => fixture(root => {
  const configPath = path.join(root, 'codex/config.toml');
  const hooksPath = path.join(root, 'codex/hooks.json');
  const original = 'model = "test-model"\n[features]\nhooks = false\nother = true\n[projects."/a b"]\ntrust_level = "trusted"\n';
  writeFileSync(configPath, original);
  writeFileSync(hooksPath, JSON.stringify({ extra: true, hooks: {
    Stop: [{ matcher: '*', hooks: [
      { type: 'command', command: '/usr/local/bin/navex hook stop' },
      { type: 'command', command: 'echo navex hook stop' }
    ] }], Notification: [{ hooks: [{ type: 'command', command: 'echo hello' }] }]
  } }));
  installCodexHooks();
  const config = parse(readFileSync(configPath, 'utf8'));
  assert.deepEqual(config, { ...parse(original), features: { hooks: true, other: true } });
  const hooks = readJson(hooksPath);
  assert.equal(hooks.extra, true);
  assert.equal(hooks.hooks.Notification[0].hooks[0].command, 'echo hello');
  assert.equal(hooks.hooks.Stop.length, 2);
  assert.equal(hooks.hooks.Stop[0].matcher, '*');
  assert.equal(hooks.hooks.Stop[0].hooks[0].command, 'echo navex hook stop');
  const files = readdirSync(path.dirname(configPath));
  const backup = files.find(name => name.startsWith('config.toml.navex-backup-'))!;
  assert.equal(readFileSync(path.join(root, 'codex', backup), 'utf8'), original);
  installCodexHooks();
  assert.deepEqual(readJson(hooksPath), hooks);
  assert.deepEqual(readdirSync(path.dirname(configPath)), files);
}));

test('Codex setup handles inline features and leaves already-enabled config text unchanged', () => fixture(root => {
  const file = path.join(root, 'codex/config.toml');
  writeFileSync(file, 'features = { hooks = false, other = true }\n');
  installCodexHooks();
  assert.deepEqual(parse(readFileSync(file, 'utf8')).features, { hooks: true, other: true });
  const enabled = '# Keep this comment\n[features]\nhooks = true # enabled\n';
  writeFileSync(file, enabled);
  installCodexHooks();
  assert.equal(readFileSync(file, 'utf8'), enabled);
}));

test('invalid TOML or hook shapes do not overwrite either Codex file', () => fixture(root => {
  const config = path.join(root, 'codex/config.toml');
  const hooks = path.join(root, 'codex/hooks.json');
  writeFileSync(config, '[features\n');
  writeFileSync(hooks, '{}');
  assert.throws(installCodexHooks);
  assert.equal(readFileSync(hooks, 'utf8'), '{}');
  assert.equal(readFileSync(config, 'utf8'), '[features\n');
  writeFileSync(config, 'features = false\n');
  assert.throws(installCodexHooks, /expected features to be a table/);
  writeFileSync(config, 'model = "keep"\n');
  writeFileSync(hooks, '{"hooks":{"Stop":{}}}');
  assert.throws(installCodexHooks, /Invalid Stop/);
  assert.equal(readFileSync(config, 'utf8'), 'model = "keep"\n');
  assert.equal(readFileSync(hooks, 'utf8'), '{"hooks":{"Stop":{}}}');
}));

test('Claude setup preserves unrelated settings and replaces quoted old install paths without duplicates', () => fixture(root => {
  const file = path.join(root, 'claude/settings.json');
  writeFileSync(file, JSON.stringify({ permissions: { allow: ['Read'] }, hooks: { Stop: [{ hooks: [
    { type: 'command', command: "'/some node/bin/node' '/old checkout/navex/dist/cli.js' hook stop --agent claude" },
    { type: 'command', command: 'echo custom' }
  ] }] } }));
  installClaudeHooks();
  installClaudeHooks();
  const settings = readJson(file);
  assert.deepEqual(settings.permissions, { allow: ['Read'] });
  assert.equal(settings.hooks.Stop.length, 2);
  assert.equal(settings.hooks.Stop[0].hooks[0].command, 'echo custom');
  assert.equal(settings.hooks.Stop[1].hooks.length, 1);
}));

test('missing flags make no changes, and overlay failures report saved configuration and a retry command', () => fixture(root => {
  assert.throws(() => setup({}, () => { throw new Error('should not start'); }), /Choose navex setup/);
  assert.deepEqual(readdirSync(path.join(root, 'codex')), []);
  assert.throws(() => setup({ claude: true }, () => { throw new Error('launchctl unavailable'); }), /configuration saved.*overlay startup failed:[\s\S]*navex overlay install-login/);
  assert.equal(readJson(path.join(root, 'claude/settings.json')).hooks.Stop.length, 1);
}));
