// ===============================================================
// File: apps/mobile/services/profile-photo-storage.ts
// Description: Persist profile photo URIs across app restarts on native and web.
// Author: Josiah Ewumi
// ===============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const STORAGE_PREFIX = 'tpc.profile_photo.';
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function getStorageKey(userId?: string | null) {
  return `${STORAGE_PREFIX}${userId?.trim() || 'guest'}`;
}

export async function getStoredProfilePhoto(
  userId?: string | null,
): Promise<string | null> {
  try {
    const uri = await AsyncStorage.getItem(getStorageKey(userId));
    if (!uri) return null;

    if (Platform.OS !== 'web' && uri.startsWith('file://')) {
      const file = new File(uri);
      if (!file.exists) {
        await AsyncStorage.removeItem(getStorageKey(userId));
        return null;
      }
    }
    return uri;
  } catch {
    return null;
  }
}

export async function saveStoredProfilePhoto(
  userId: string | null | undefined,
  uri: string | null,
): Promise<void> {
  const key = getStorageKey(userId);
  if (!uri) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, uri);
}

export async function persistPickedPhoto(asset: {
  uri: string;
  base64?: string | null;
  fileSize?: number | null;
}): Promise<{ ok: true; uri: string } | { ok: false; message: string }> {
  if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_PHOTO_BYTES) {
    return { ok: false, message: 'Choose a photo smaller than 8 MB.' };
  }

  if (Platform.OS === 'web') {
    const webUri = asset.base64
      ? `data:image/jpeg;base64,${asset.base64}`
      : asset.uri;
    return { ok: true, uri: webUri };
  }

  const target = new File(Paths.document, `tpc-profile-${Date.now()}.jpg`);

  // Primary native path: async copy out of temporary ImagePicker cache
  try {
    const source = new File(asset.uri);
    if (source.exists && source.size > MAX_PHOTO_BYTES) {
      return { ok: false, message: 'Choose a photo smaller than 8 MB.' };
    }
    await source.copy(target);
    if (target.exists && target.size > 0) {
      return { ok: true, uri: target.uri };
    }
  } catch {
    // Fall through to base64 write fallback
  }

  // Fallback path: write base64 payload directly into app document storage
  if (asset.base64) {
    try {
      target.create({ overwrite: true });
      await target.write(asset.base64, { encoding: 'base64' });
      if (target.exists && target.size > 0) {
        return { ok: true, uri: target.uri };
      }
    } catch {
      // Fall through to direct URI fallback if local file:// is readable
    }
  }

  if (asset.uri.startsWith('file://') || asset.uri.startsWith('data:image/')) {
    return { ok: true, uri: asset.uri };
  }

  return {
    ok: false,
    message: 'Could not save that photo locally. Please try another image.',
  };
}
