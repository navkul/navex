import { readFileSync } from 'node:fs';
import { sendEvent } from './ipc.js';
import { detectSessionOrigin, hookSessionIdentity } from './session-origin.js';
import { HookPayload } from './types.js';

export async function runSessionStartHook(): Promise<void> {
  const payload = JSON.parse(readFileSync(0, 'utf8')) as HookPayload;
  const origin = detectSessionOrigin();

  await sendEvent({
    type: 'register-session',
    ...hookSessionIdentity(payload.session_id),
    cwd: payload.cwd,
    displayName: process.env.NAVEX_SESSION_NAME || undefined,
    surface: origin.surface,
    navigationPrecision: origin.navigationPrecision,
    launcherPid: parseNumber(process.env.NAVEX_LAUNCH_PID),
    terminalApp: origin.terminalApp,
    terminalWindowId: process.env.NAVEX_TERMINAL_WINDOW_ID || undefined,
    terminalTabIndex: parseNumber(process.env.NAVEX_TERMINAL_TAB_INDEX),
    terminalSessionUniqueId: origin.terminalSessionUniqueId,
    terminalTty: origin.terminalTty,
    timestamp: new Date().toISOString()
  });
}

function parseNumber(value?: string): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}
