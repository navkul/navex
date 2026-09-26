// Native AppKit integration checks, isolated from the installed helper and session data.
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

if (process.platform !== 'darwin') throw new Error('Overlay tests require a macOS GUI session.');
const directory = mkdtempSync(path.join(tmpdir(), 'navex-keyboard-tests-'));
try {
  const source = readFileSync('macos/NavexOverlay.swift', 'utf8');
  const entrypoint = source.lastIndexOf('\nlet app = NSApplication.shared');
  if (entrypoint < 0) throw new Error('Overlay entrypoint not found.');
  writeFileSync(path.join(directory, 'main.swift'), source.slice(0, entrypoint)
    + readFileSync('test/macos/keyboard-navigation.swift', 'utf8'));
  const sdk = spawnSync('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], { encoding: 'utf8' }).stdout.trim();
  const version = readFileSync(path.join(sdk, 'SDKSettings.json'), 'utf8');
  const targetVersion = JSON.parse(version).Version;
  const binary = path.join(directory, 'NavexKeyboardTests');
  const compile = spawnSync('swiftc', ['-sdk', sdk, '-target', `${process.arch === 'arm64' ? 'arm64' : 'x86_64'}-apple-macosx${targetVersion}`,
    '-module-cache-path', path.join(tmpdir(), 'navex-swift-module-cache'), '-o', binary, path.join(directory, 'main.swift')], { stdio: 'inherit' });
  if (compile.status !== 0) process.exitCode = compile.status ?? 1;
  else {
    const result = spawnSync(binary, [], { stdio: 'inherit', timeout: 30000, env: {
      ...process.env,
      NAVEX_OVERLAY_SNAPSHOT_PATH: path.join(directory, 'snapshot.json'),
      NAVEX_OVERLAY_STATE_PATH: path.join(directory, 'state.json'),
      NAVEX_OVERLAY_CONTROL_PATH: path.join(directory, 'control.json'),
      NAVEX_OVERLAY_LOG_PATH: path.join(directory, 'overlay.log'),
      NAVEX_OVERLAY_SHOW_ON_LAUNCH: '0'
    } });
    process.exitCode = result.status ?? 1;
    if (process.exitCode) console.error(readFileSync(path.join(directory, 'overlay.log'), 'utf8'));
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
