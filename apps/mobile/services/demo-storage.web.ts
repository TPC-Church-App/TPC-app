// ===============================================================
// apps/mobile/services/demo-storage.web.ts
// Web saves synthetic preferences/history only. The attendance provider
// removes GPS coordinates before calling this adapter.
// ===============================================================

export async function readDemo(key: string): Promise<unknown> {
  if (typeof localStorage === 'undefined')
    throw new Error('Browser storage unavailable.');
  const value = localStorage.getItem(`tpc.demo.${key}`);
  return value ? JSON.parse(value) : null;
}

// ===============================================================
// WRITE BROWSER DEMO DATA WITH EXPLICIT FAILURE
// ===============================================================

export async function writeDemo(key: string, value: unknown): Promise<void> {
  if (typeof localStorage === 'undefined')
    throw new Error('Browser storage unavailable.');
  localStorage.setItem(`tpc.demo.${key}`, JSON.stringify(value));
}

// ===============================================================
// EXPLICIT RESET DOES NOT NEED TO PARSE THE PREVIOUS BROWSER VALUE
// ===============================================================

export const resetDemo = writeDemo;
