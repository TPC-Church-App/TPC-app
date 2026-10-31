// ===============================================================
// apps/mobile/utils/demo-lifecycle.ts
// Small, testable guards for saved data, navigation and async playback.
// Each guard uses O(1) time and space.
// ===============================================================

// ===============================================================
// SAVED DATA LOAD PERMISSIONS
// A failed read never grants permission to overwrite saved data.
// ===============================================================
export class SavedDemoLoadGuard {
  private state: 'loading' | 'ready' | 'error' = 'loading';
  start() {
    this.state = 'loading';
  }
  succeed() {
    this.state = 'ready';
  }
  fail() {
    this.state = 'error';
  }
  get canWrite() {
    return this.state === 'ready';
  }
  get canReset() {
    return this.state !== 'loading';
  }
}
// ===============================================================
// STALE ASYNCHRONOUS OPERATION GUARD
// ===============================================================

export class DemoOperationGuard {
  private generation = 0;
  begin() {
    return ++this.generation;
  }
  invalidate() {
    this.generation++;
  }
  isCurrent(token: number) {
    return token === this.generation;
  }
}
// ===============================================================
// EXPLICIT COMMUNITY SECTION SELECTION
// ===============================================================

export function communitySection(
  value: unknown,
): 'schedule' | 'badges' | 'invitations' {
  return value === 'schedule' || value === 'badges' ? value : 'invitations';
}

// ===============================================================
// RECHECK THE ACTIVE OPERATION AFTER EVERY AWAIT BEFORE PLAYBACK
// ===============================================================

export async function startGuardedDemoPlayback(options: {
  configure: () => Promise<void>;
  seekToStart: () => Promise<void>;
  play: () => void;
  isCurrent: () => boolean;
  atEnd: boolean;
}) {
  await options.configure();
  if (!options.isCurrent()) return;
  if (options.atEnd) {
    await options.seekToStart();
    if (!options.isCurrent()) return;
  }
  options.play();
}
