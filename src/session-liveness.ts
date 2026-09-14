import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { loadRegistry, saveRegistry } from './session-registry.js';
import { SessionRecord } from './types.js';

const exec = promisify(execFile);

export interface ClaudeProcess {
  tty?: string;
  desktop: boolean;
}

export function parseClaudeProcesses(output: string): ClaudeProcess[] {
  return output.split('\n').flatMap((line) => {
    const match = line.trim().match(/^\d+\s+(\S+)\s+(.+)$/);
    if (!match) return [];
    const [, tty, command] = match;
    const desktop = /\/Claude\.app\/Contents\/MacOS\/Claude$/.test(command);
    // comm contains the executable, so shell commands mentioning Claude do not match.
    if (!desktop && !/(?:^|\/)claude(?:\s+\([^)]*\))?$/.test(command)) return [];
    return [{ desktop, tty: tty === '??' || tty === '?' ? undefined : `/dev/${tty}` }];
  });
}

export function claudeSessionIsClosed(session: SessionRecord, processes: ClaudeProcess[]): boolean {
  if (session.agent !== 'claude' || session.kind === 'cloud-task') return false;
  if (session.surface === 'desktop') return !processes.some((process) => process.desktop);
  if (session.terminalTty) return !processes.some((process) => process.tty === session.terminalTty);
  // Missing origin metadata cannot identify a particular session. Keep it while any
  // Claude host is open; SessionEnd remains the authoritative per-session signal.
  return processes.length === 0;
}

async function readClaudeProcesses(): Promise<ClaudeProcess[]> {
  const { stdout } = await exec('/bin/ps', ['-axo', 'pid=,tty=,comm='], { timeout: 2000, maxBuffer: 4 * 1024 * 1024 });
  if (!stdout.trim()) throw new Error('Empty process snapshot');
  return parseClaudeProcesses(stdout);
}

export async function reconcileClaudeSessions(
  readProcesses: () => Promise<ClaudeProcess[]> = readClaudeProcesses
): Promise<boolean> {
  const before = loadRegistry();
  if (!Object.values(before.sessions).some((session) => session.agent === 'claude')) return false;
  let processes: ClaudeProcess[];
  try {
    processes = await readProcesses();
  } catch {
    // A timeout or denied process lookup is not evidence that a session closed.
    return false;
  }
  const registry = loadRegistry();
  let changed = false;
  for (const session of Object.values(registry.sessions)) {
    // Hooks received during the asynchronous lookup take precedence.
    if (JSON.stringify(session) !== JSON.stringify(before.sessions[session.sessionId])) continue;
    if (claudeSessionIsClosed(session, processes)) {
      delete registry.sessions[session.sessionId];
      changed = true;
    }
  }
  if (changed) saveRegistry(registry);
  return changed;
}
