// ===============================================================
// apps/mobile/services/demo-storage.ts
// Adapt encrypted native storage to the tested persistence rules.
// Reset is explicit and can recover invalid metadata without trusting it.
// ===============================================================

import * as SecureStore from 'expo-secure-store';
import { createDemoPersistence } from '@/utils/demo-persistence';

const storage = createDemoPersistence({
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  deleteItem: (key) => SecureStore.deleteItemAsync(key),
});

// ===============================================================
// SHARED DEVICE DEMO STORAGE OPERATIONS
// ===============================================================

export const readDemo = storage.read;
export const writeDemo = storage.write;
export const resetDemo = storage.reset;
