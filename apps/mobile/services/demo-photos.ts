// ===============================================================
// apps/mobile/services/demo-photos.ts
// Remove only app-created demo profile photos.
// ===============================================================

import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
// Restrict deletion to app-created photo files in this app's document directory.

// ===============================================================
// CLEAN UP ONLY APP-CREATED PHOTO FILES
// ===============================================================

export function clearDemoPhotos() {
  if (Platform.OS === 'web') return;
  const directory = new Directory(Paths.document);
  for (const item of directory.list()) {
    if (item instanceof File && /^tpc-profile-\d+\.jpg$/.test(item.name))
      item.delete();
  }
}
