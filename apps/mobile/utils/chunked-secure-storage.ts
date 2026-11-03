// ===============================================================
// apps/mobile/utils/chunked-secure-storage.ts
// Store larger auth sessions as small, atomically-switched secure chunks.
// ===============================================================

export type SecureKeyValueStore = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

export type AuthStorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

type StorageManifest = {
  version: 1;
  generation: string;
  chunkCount: number;
};

const DEFAULT_CHUNK_BYTES = 1_700;
const MAX_CHUNKS = 256;
let generationCounter = 0;

// ===============================================================
// CREATE THE SUPABASE AUTH STORAGE ADAPTER
// Write new chunks before switching the manifest so interrupted writes keep
// the previous session readable.
// ===============================================================

export function createChunkedSecureStorage(
  store: SecureKeyValueStore,
  chunkSizeBytes = DEFAULT_CHUNK_BYTES,
) {
  if (!Number.isInteger(chunkSizeBytes) || chunkSizeBytes < 4) {
    throw new Error('Secure storage chunk size must be at least four bytes.');
  }

  return {
    async getItem(key: string): Promise<string | null> {
      const manifest = await readManifest(store, manifestKey(key));
      if (!manifest) return null;

      const chunks: string[] = [];
      for (let index = 0; index < manifest.chunkCount; index += 1) {
        const chunk = await store.getItemAsync(
          chunkKey(key, manifest.generation, index),
        );
        if (chunk === null) {
          throw new Error('Secure auth session data is incomplete.');
        }
        chunks.push(chunk);
      }
      return chunks.join('');
    },

    async setItem(key: string, value: string): Promise<void> {
      const manifestId = manifestKey(key);
      const previous = await readManifest(store, manifestId);
      const chunks = splitUtf8(value, chunkSizeBytes);
      if (chunks.length > MAX_CHUNKS) {
        throw new Error('Secure auth session exceeds the storage limit.');
      }

      const generation = createGeneration();
      const writtenKeys: string[] = [];
      try {
        for (let index = 0; index < chunks.length; index += 1) {
          const itemKey = chunkKey(key, generation, index);
          await store.setItemAsync(itemKey, chunks[index]);
          writtenKeys.push(itemKey);
        }

        const manifest: StorageManifest = {
          version: 1,
          generation,
          chunkCount: chunks.length,
        };
        await store.setItemAsync(manifestId, JSON.stringify(manifest));
      } catch (error) {
        await deleteKeysBestEffort(store, writtenKeys);
        throw error;
      }

      if (previous) {
        await deleteGenerationBestEffort(
          store,
          key,
          previous.generation,
          previous.chunkCount,
        );
      }
    },

    async removeItem(key: string): Promise<void> {
      const manifestId = manifestKey(key);
      const manifest = await readManifest(store, manifestId);
      await store.deleteItemAsync(manifestId);
      if (manifest) {
        await deleteGeneration(
          store,
          key,
          manifest.generation,
          manifest.chunkCount,
        );
      }
    },
  };
}

// ===============================================================
// MIGRATE LEGACY AUTH SESSIONS WITHOUT SIGNING MEMBERS OUT
// Secure storage becomes authoritative after the first successful read/write.
// ===============================================================

export function createMigratingAuthStorage(
  secureStorage: AuthStorageAdapter,
  legacyStorage: AuthStorageAdapter,
): AuthStorageAdapter {
  return {
    async getItem(key) {
      const secureValue = await secureStorage.getItem(key);
      if (secureValue !== null) {
        await removeLegacyBestEffort(legacyStorage, key);
        return secureValue;
      }

      const legacyValue = await legacyStorage.getItem(key);
      if (legacyValue === null) return null;

      await secureStorage.setItem(key, legacyValue);
      await removeLegacyBestEffort(legacyStorage, key);
      return legacyValue;
    },

    async setItem(key, value) {
      await secureStorage.setItem(key, value);
      await removeLegacyBestEffort(legacyStorage, key);
    },

    async removeItem(key) {
      await legacyStorage.removeItem(key);
      await secureStorage.removeItem(key);
    },
  };
}

// ===============================================================
// VALIDATE AND SPLIT SESSION DATA
// Split by UTF-8 bytes without breaking multi-byte characters.
// ===============================================================

function splitUtf8(value: string, maxBytes: number): string[] {
  if (value.length === 0) return [''];

  const chunks: string[] = [];
  let chunk = '';
  let byteCount = 0;

  for (const character of value) {
    const codePoint = character.codePointAt(0)!;
    const characterBytes =
      codePoint <= 0x7f
        ? 1
        : codePoint <= 0x7ff
          ? 2
          : codePoint <= 0xffff
            ? 3
            : 4;

    if (byteCount + characterBytes > maxBytes) {
      chunks.push(chunk);
      chunk = '';
      byteCount = 0;
    }
    chunk += character;
    byteCount += characterBytes;
  }

  if (chunk) chunks.push(chunk);
  return chunks;
}

function createGeneration(): string {
  generationCounter += 1;
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${generationCounter.toString(36)}-${randomSuffix}`;
}

function manifestKey(key: string): string {
  return `${key}.secure-v1.current`;
}

function chunkKey(key: string, generation: string, index: number): string {
  return `${key}.secure-v1.${generation}.${index}`;
}

async function readManifest(
  store: SecureKeyValueStore,
  key: string,
): Promise<StorageManifest | null> {
  const raw = await store.getItemAsync(key);
  if (raw === null) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === 'object' &&
      value !== null &&
      'version' in value &&
      value.version === 1 &&
      'generation' in value &&
      typeof value.generation === 'string' &&
      /^[a-z0-9-]{1,80}$/.test(value.generation) &&
      'chunkCount' in value &&
      typeof value.chunkCount === 'number' &&
      Number.isInteger(value.chunkCount) &&
      value.chunkCount >= 1 &&
      value.chunkCount <= MAX_CHUNKS
    ) {
      return {
        version: 1,
        generation: value.generation,
        chunkCount: value.chunkCount,
      };
    }
  } catch {
    // Report corrupt manifests instead of silently replacing a session.
  }
  throw new Error('Secure auth session metadata is invalid.');
}

async function deleteGeneration(
  store: SecureKeyValueStore,
  key: string,
  generation: string,
  chunkCount: number,
): Promise<void> {
  for (let index = 0; index < chunkCount; index += 1) {
    await store.deleteItemAsync(chunkKey(key, generation, index));
  }
}

async function deleteKeysBestEffort(
  store: SecureKeyValueStore,
  keys: string[],
): Promise<void> {
  await Promise.allSettled(keys.map((key) => store.deleteItemAsync(key)));
}

async function deleteGenerationBestEffort(
  store: SecureKeyValueStore,
  key: string,
  generation: string,
  chunkCount: number,
): Promise<void> {
  const keys = Array.from({ length: chunkCount }, (_, index) =>
    chunkKey(key, generation, index),
  );
  await deleteKeysBestEffort(store, keys);
}

async function removeLegacyBestEffort(
  storage: AuthStorageAdapter,
  key: string,
): Promise<void> {
  try {
    await storage.removeItem(key);
  } catch {
    // The secure copy remains authoritative; a later read retries cleanup.
  }
}
