// ===============================================================
// apps/mobile/utils/demo-persistence.ts
// Testable chunked storage without native dependencies or credentials.
// Read/write/reset operations serialize to protect committed snapshots.
// Encoding and decoding use O(b) time and space for bounded payload bytes.
// ===============================================================

export type DemoStorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
};
type Manifest = { bank: number; count: number };
const CHUNK_SIZE = 1800;
const MAX_CHUNKS = 160;

// ===============================================================
// VALIDATE METADATA BEFORE READING OR OVERWRITING A SAVED SNAPSHOT
// ===============================================================

export class DemoStorageDataError extends Error {}
function parseManifest(raw: string | null): Manifest | null {
  if (raw === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new DemoStorageDataError('Saved demo metadata is invalid.');
  }
  if (!value || typeof value !== 'object')
    throw new DemoStorageDataError('Saved demo metadata is invalid.');
  const m = value as Manifest;
  if (
    ![0, 1].includes(m.bank) ||
    !Number.isInteger(m.count) ||
    m.count < 1 ||
    m.count > MAX_CHUNKS
  )
    throw new DemoStorageDataError('Saved demo metadata is invalid.');
  return m;
}

// ===============================================================
// SERIALIZED STORAGE WITH A SEPARATE, EXPLICIT RESET PATH
// ===============================================================

export function createDemoPersistence(adapter: DemoStorageAdapter) {
  let sequence: Promise<unknown> = Promise.resolve();
  function run<T>(operation: () => Promise<T>): Promise<T> {
    const task = sequence.catch(() => undefined).then(operation);
    sequence = task;
    return task;
  }
  function prefix(key: string) {
    if (!/^[a-z-]{1,40}$/.test(key))
      throw new Error('Invalid demo storage key.');
    return 'tpc.' + key;
  }
  async function save(key: string, value: unknown, reset: boolean) {
    const base = prefix(key);
    const encoded = JSON.stringify(value);
    if (encoded === undefined)
      throw new Error('Demo data must be JSON serializable.');
    const json = encoded
      .split('')
      .map((c) =>
        c.charCodeAt(0) > 127
          ? String.fromCharCode(92) +
            'u' +
            c.charCodeAt(0).toString(16).padStart(4, '0')
          : c,
      )
      .join('');
    if (json.length > 280000) throw new Error('Demo storage limit reached.');
    const raw = await adapter.getItem(base + '.manifest');
    let previous: Manifest | null;
    try {
      previous = parseManifest(raw);
    } catch (error) {
      // Only an explicit reset may replace malformed metadata. I/O errors
      // still propagate; an unavailable store is never reported as cleared.
      if (!reset || !(error instanceof DemoStorageDataError)) throw error;
      previous = null;
    }
    const bank = previous?.bank === 0 ? 1 : 0;
    const count = Math.max(1, Math.ceil(json.length / CHUNK_SIZE));
    for (let i = 0; i < count; i++)
      await adapter.setItem(
        base + '.' + bank + '.' + i,
        json.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );
    await adapter.setItem(base + '.manifest', JSON.stringify({ bank, count }));
    // Delete obsolete chunks after commit. Failed cleanup cannot turn a
    // committed save into a reported failure or remove the current snapshot.
    const obsolete: string[] = [];
    if (reset) {
      for (let b = 0; b < 2; b++)
        for (let i = 0; i < MAX_CHUNKS; i++)
          if (b !== bank || i >= count) obsolete.push(base + '.' + b + '.' + i);
    } else if (previous) {
      for (let i = 0; i < previous.count; i++)
        obsolete.push(base + '.' + previous.bank + '.' + i);
    }
    await Promise.allSettled(obsolete.map((key) => adapter.deleteItem(key)));
  }
  return {
    read: (key: string): Promise<unknown> =>
      run(async () => {
        const base = prefix(key);
        const manifest = parseManifest(
          await adapter.getItem(base + '.manifest'),
        );
        if (!manifest) return null;
        let text = '';
        for (let i = 0; i < manifest.count; i++) {
          const chunk = await adapter.getItem(
            base + '.' + manifest.bank + '.' + i,
          );
          if (chunk === null)
            throw new DemoStorageDataError('Saved demo data is incomplete.');
          text += chunk;
        }
        return JSON.parse(text);
      }),
    write: (key: string, value: unknown) => run(() => save(key, value, false)),
    reset: (key: string, value: unknown) => run(() => save(key, value, true)),
  };
}
