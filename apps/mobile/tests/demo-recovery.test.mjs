// ===============================================================
// apps/mobile/tests/demo-recovery.test.mjs
// Regressions for data recovery, write protection and async cancellation.
// In-memory adapters exercise the production storage core without native APIs.
// ===============================================================

import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoPersistence } from '../utils/demo-persistence.ts';
import {
  SavedDemoLoadGuard,
  DemoOperationGuard,
  communitySection,
  startGuardedDemoPlayback,
} from '../utils/demo-lifecycle.ts';

function fixture() {
  const values = new Map();
  const control = {
    failGet: false,
    failSet: null,
    failDelete: false,
    writes: 0,
  };
  const adapter = {
    async getItem(key) {
      if (control.failGet) throw new Error('Read unavailable');
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      control.writes++;
      if (control.failSet?.(key)) throw new Error('Write interrupted');
      values.set(key, value);
    },
    async deleteItem(key) {
      if (control.failDelete) throw new Error('Cleanup unavailable');
      values.delete(key);
    },
  };
  return { values, control, storage: createDemoPersistence(adapter) };
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

// ===============================================================
// COMMITTED SNAPSHOTS AND DAMAGED METADATA RECOVERY
// ===============================================================

test('missing storage reads as empty without writing a default over it', async () => {
  const f = fixture();
  assert.equal(await f.storage.read('workspace'), null);
  assert.equal(f.control.writes, 0);
});
test('chunked Unicode payload survives encoding and decoding unchanged', async () => {
  const f = fixture();
  const value = { name: 'Josiah · Ẹ káàbọ̀ 👋', text: '寺'.repeat(1400) };
  await f.storage.write('profile', value);
  assert.deepEqual(await f.storage.read('profile'), value);
  for (const [key, chunk] of f.values)
    if (!key.endsWith('.manifest'))
      assert.ok(Buffer.byteLength(chunk, 'utf8') <= 1800);
});
test('ordinary writes refuse corrupt metadata; explicit reset recovers it', async () => {
  for (const metadata of [
    '{',
    'null',
    '[]',
    '{"bank":0,"count":999}',
    '{"bank":4,"count":1}',
  ]) {
    const f = fixture();
    f.values.set('tpc.workspace.manifest', metadata);
    f.values.set('tpc.workspace.1.90', 'orphaned demo text');
    await assert.rejects(f.storage.read('workspace'));
    await assert.rejects(f.storage.write('workspace', { unexpected: true }));
    assert.equal(f.values.get('tpc.workspace.manifest'), metadata);
    await f.storage.reset('workspace', { payments: [] });
    assert.deepEqual(await f.storage.read('workspace'), { payments: [] });
    assert.equal(f.values.has('tpc.workspace.1.90'), false);
  }
});
test('a failed replacement chunk preserves the previous committed snapshot', async () => {
  const f = fixture();
  await f.storage.write('attendance', { records: ['original'] });
  const manifest = f.values.get('tpc.attendance.manifest');
  f.control.failSet = (key) => key === 'tpc.attendance.1.1';
  await assert.rejects(
    f.storage.write('attendance', { text: 'x'.repeat(4000) }),
  );
  assert.equal(f.values.get('tpc.attendance.manifest'), manifest);
  assert.deepEqual(await f.storage.read('attendance'), {
    records: ['original'],
  });
});
test('a failed manifest commit cannot report a new snapshot as saved', async () => {
  const f = fixture();
  await f.storage.write('workspace', { payments: ['kept'] });
  f.control.failSet = (key) => key.endsWith('.manifest');
  await assert.rejects(f.storage.write('workspace', { payments: [] }));
  assert.deepEqual(await f.storage.read('workspace'), { payments: ['kept'] });
});
test('an incomplete saved payload rejects instead of silently becoming empty', async () => {
  const f = fixture();
  await f.storage.write('attendance', { records: ['kept'] });
  f.values.delete('tpc.attendance.0.0');
  await assert.rejects(f.storage.read('attendance'), /incomplete/);
});
test('storage I/O failure still rejects explicit reset', async () => {
  const f = fixture();
  await f.storage.write('profile', { name: 'kept' });
  f.control.failGet = true;
  await assert.rejects(f.storage.reset('profile', null));
  f.control.failGet = false;
  assert.deepEqual(await f.storage.read('profile'), { name: 'kept' });
});
test('cleanup failure does not invalidate a committed replacement', async () => {
  const f = fixture();
  await f.storage.write('profile', { name: 'old' });
  f.control.failDelete = true;
  await f.storage.write('profile', { name: 'new' });
  assert.deepEqual(await f.storage.read('profile'), { name: 'new' });
});
test('a failed queued operation does not prevent a later successful save', async () => {
  const f = fixture();
  f.control.failSet = () => true;
  await assert.rejects(f.storage.write('workspace', { value: 1 }));
  f.control.failSet = null;
  await f.storage.write('workspace', { value: 2 });
  assert.deepEqual(await f.storage.read('workspace'), { value: 2 });
});
test('concurrent writes and reads serialize around committed snapshots', async () => {
  const values = new Map();
  const entered = deferred();
  const release = deferred();
  let paused = false;
  const storage = createDemoPersistence({
    getItem: async (key) => values.get(key) ?? null,
    deleteItem: async (key) => {
      values.delete(key);
    },
    setItem: async (key, value) => {
      if (!paused && !key.endsWith('.manifest')) {
        paused = true;
        entered.resolve();
        await release.promise;
      }
      values.set(key, value);
    },
  });
  const first = storage.write('workspace', { version: 1 });
  await entered.promise;
  const second = storage.write('workspace', { version: 2 });
  const read = storage.read('workspace');
  release.resolve();
  await Promise.all([first, second]);
  assert.deepEqual(await read, { version: 2 });
});
test('oversized demo data and unsafe storage keys reject before committing', async () => {
  const f = fixture();
  await assert.rejects(
    f.storage.write('workspace', { text: 'x'.repeat(280001) }),
  );
  await assert.rejects(f.storage.write('../other', { value: 1 }));
  assert.equal(f.values.size, 0);
});

// ===============================================================
// LOAD FAILURE MUST NOT GRANT NORMAL WRITE ACCESS
// ===============================================================

test('only successful hydration enables normal writes; reset stays explicit', () => {
  const guard = new SavedDemoLoadGuard();
  assert.equal(guard.canWrite, false);
  assert.equal(guard.canReset, false);
  guard.fail();
  assert.equal(guard.canWrite, false);
  assert.equal(guard.canReset, true);
  guard.start();
  assert.equal(guard.canWrite, false);
  assert.equal(guard.canReset, false);
  guard.succeed();
  assert.equal(guard.canWrite, true);
  assert.equal(guard.canReset, true);
});
test('a failed read cannot trigger a default-data overwrite through the load guard', async () => {
  const f = fixture();
  await f.storage.write('workspace', { payments: ['retained'] });
  const previousWrites = f.control.writes;
  const guard = new SavedDemoLoadGuard();
  f.control.failGet = true;
  try {
    await f.storage.read('workspace');
    guard.succeed();
  } catch {
    guard.fail();
  }
  if (guard.canWrite) await f.storage.write('workspace', { payments: [] });
  assert.equal(f.control.writes, previousWrites);
  f.control.failGet = false;
  assert.deepEqual(await f.storage.read('workspace'), {
    payments: ['retained'],
  });
});

// ===============================================================
// NAVIGATION REQUESTS AND PLAYBACK CANCELLATION
// ===============================================================

test('explicit schedule selection works again after another community tab', () => {
  let tab = communitySection('schedule');
  assert.equal(tab, 'schedule');
  tab = 'invitations';
  tab = communitySection('schedule');
  assert.equal(tab, 'schedule');
  assert.equal(communitySection('badges'), 'badges');
  assert.equal(communitySection(['schedule']), 'invitations');
});
test('leaving while audio configuration waits prevents playback', async () => {
  const config = deferred();
  let active = true;
  let plays = 0;
  const task = startGuardedDemoPlayback({
    configure: () => config.promise,
    seekToStart: async () => {},
    play: () => {
      plays++;
    },
    isCurrent: () => active,
    atEnd: false,
  });
  active = false;
  config.resolve();
  await task;
  assert.equal(plays, 0);
});
test('leaving while end-of-audio seek waits prevents late playback', async () => {
  const entered = deferred();
  const seek = deferred();
  let active = true;
  let plays = 0;
  const task = startGuardedDemoPlayback({
    configure: async () => {},
    seekToStart: () => {
      entered.resolve();
      return seek.promise;
    },
    play: () => {
      plays++;
    },
    isCurrent: () => active,
    atEnd: true,
  });
  await entered.promise;
  active = false;
  seek.resolve();
  await task;
  assert.equal(plays, 0);
});
test('background or a newer operation invalidates the old playback token', () => {
  const guard = new DemoOperationGuard();
  const first = guard.begin();
  assert.equal(guard.isCurrent(first), true);
  guard.invalidate();
  assert.equal(guard.isCurrent(first), false);
  const second = guard.begin();
  const third = guard.begin();
  assert.equal(guard.isCurrent(second), false);
  assert.equal(guard.isCurrent(third), true);
});
test('an active playback request configures, seeks and plays in order', async () => {
  const events = [];
  await startGuardedDemoPlayback({
    configure: async () => {
      events.push('configure');
    },
    seekToStart: async () => {
      events.push('seek');
    },
    play: () => events.push('play'),
    isCurrent: () => true,
    atEnd: true,
  });
  assert.deepEqual(events, ['configure', 'seek', 'play']);
});
