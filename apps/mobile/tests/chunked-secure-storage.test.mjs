// ===============================================================
// apps/mobile/tests/chunked-secure-storage.test.mjs
// Verify session chunks survive Unicode and interrupted replacement writes.
// ===============================================================

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createChunkedSecureStorage,
  createMigratingAuthStorage,
} from '../utils/chunked-secure-storage.ts';

function createMemoryStore() {
  const values = new Map();
  return {
    values,
    async getItemAsync(key) {
      return values.get(key) ?? null;
    },
    async setItemAsync(key, value) {
      values.set(key, value);
    },
    async deleteItemAsync(key) {
      values.delete(key);
    },
  };
}

// ===============================================================
// SECURE SESSION STORAGE REGRESSIONS
// ===============================================================

test('chunked secure storage round-trips UTF-8 session data', async () => {
  const store = createMemoryStore();
  const storage = createChunkedSecureStorage(store, 16);
  const value = 'session-😀-é-'.repeat(12);

  await storage.setItem('auth-token', value);

  assert.equal(await storage.getItem('auth-token'), value);
  const chunks = [...store.values.entries()]
    .filter(([key]) => key.includes('.secure-v1.') && !key.endsWith('.current'))
    .map(([, item]) => item);
  assert.ok(chunks.length > 1);
  assert.ok(
    chunks.every((item) => new TextEncoder().encode(item).byteLength <= 16),
  );
});

test('failed replacement keeps the previously committed session readable', async () => {
  const store = createMemoryStore();
  const storage = createChunkedSecureStorage(store, 8);
  await storage.setItem('auth-token', 'old-session');

  const setItemAsync = store.setItemAsync.bind(store);
  let failNextChunk = true;
  store.setItemAsync = async (key, value) => {
    if (
      failNextChunk &&
      key.includes('.secure-v1.') &&
      !key.endsWith('.current')
    ) {
      failNextChunk = false;
      throw new Error('simulated secure store write failure');
    }
    await setItemAsync(key, value);
  };

  await assert.rejects(
    storage.setItem('auth-token', 'new-session'),
    /simulated/,
  );
  assert.equal(await storage.getItem('auth-token'), 'old-session');
});

test('removing auth storage removes the current manifest and its chunks', async () => {
  const store = createMemoryStore();
  const storage = createChunkedSecureStorage(store, 8);
  await storage.setItem('auth-token', 'saved-session');

  await storage.removeItem('auth-token');

  assert.equal(await storage.getItem('auth-token'), null);
  assert.equal(store.values.size, 0);
});

test('the first secure read migrates an existing AsyncStorage session', async () => {
  const secureStore = createMemoryStore();
  const legacyStore = createMemoryStore();
  const secureStorage = createChunkedSecureStorage(secureStore, 16);
  const legacyStorage = {
    getItem: (key) => legacyStore.getItemAsync(key),
    setItem: (key, value) => legacyStore.setItemAsync(key, value),
    removeItem: (key) => legacyStore.deleteItemAsync(key),
  };
  legacyStore.values.set('auth-token', 'existing-session');

  const storage = createMigratingAuthStorage(secureStorage, legacyStorage);

  assert.equal(await storage.getItem('auth-token'), 'existing-session');
  assert.equal(legacyStore.values.has('auth-token'), false);
  assert.equal(await secureStorage.getItem('auth-token'), 'existing-session');
});

test('the secure copy wins over and removes a stale legacy copy', async () => {
  const secureStore = createMemoryStore();
  const legacyStore = createMemoryStore();
  const secureStorage = createChunkedSecureStorage(secureStore, 16);
  const legacyStorage = {
    getItem: (key) => legacyStore.getItemAsync(key),
    setItem: (key, value) => legacyStore.setItemAsync(key, value),
    removeItem: (key) => legacyStore.deleteItemAsync(key),
  };
  await secureStorage.setItem('auth-token', 'secure-session');
  legacyStore.values.set('auth-token', 'stale-session');

  const storage = createMigratingAuthStorage(secureStorage, legacyStorage);

  assert.equal(await storage.getItem('auth-token'), 'secure-session');
  assert.equal(legacyStore.values.has('auth-token'), false);
});
