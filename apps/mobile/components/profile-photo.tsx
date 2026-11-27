// ===============================================================
// File: apps/mobile/components/profile-photo.tsx
// Description: Reliable profile photo picker with persistent local storage.
// Author: Josiah Ewumi
// ===============================================================

import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { Camera, Trash2, User } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, fonts, palette, radii, shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import {
  getStoredProfilePhoto,
  persistPickedPhoto,
  saveStoredProfilePhoto,
} from '@/services/profile-photo-storage';
import { useMemberDraft } from '@/store/member-draft';

export default function ProfilePhoto({
  initials,
  onPhotoChanged,
}: {
  initials?: string;
  onPhotoChanged?: (uri: string | null) => void;
}) {
  const { draft, updateDraft, sessionToken, isCurrentSession } =
    useMemberDraft();
  const mounted = useRef(false);
  const generation = useRef(0);
  const lock = useRef(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [persistedUri, setPersistedUri] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const activePhotoUri = persistedUri ?? draft.photoUri;

  useEffect(() => {
    let active = true;
    void supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return;
        const uid = data.session?.user?.id ?? null;
        setUserId(uid);
        const stored = await getStoredProfilePhoto(uid);
        if (active && stored) {
          setPersistedUri(stored);
          if (draft.photoUri !== stored) {
            updateDraft({ photoUri: stored });
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [draft.photoUri, updateDraft]);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      setBusy(false);
      lock.current = false;
      return () => {
        mounted.current = false;
        generation.current++;
        lock.current = false;
      };
    }, []),
  );

  async function choosePhoto() {
    if (lock.current) return;
    lock.current = true;
    const token = sessionToken();
    const request = ++generation.current;
    const current = () =>
      mounted.current &&
      request === generation.current &&
      isCurrentSession(token);

    setBusy(true);
    setError('');
    setStatusMessage('');

    try {
      if (Platform.OS !== 'web') {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          if (current()) {
            setError(
              'Photo library permission is needed to choose a profile image.',
            );
          }
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
        exif: false,
        base64: true,
      });

      if (!current() || result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.uri) {
        setError('That photo could not be opened. Choose another image.');
        return;
      }

      const saved = await persistPickedPhoto({
        uri: asset.uri,
        base64: asset.base64,
        fileSize: asset.fileSize,
      });

      if (!current()) return;
      if (!saved.ok) {
        setError(saved.message);
        return;
      }

      await saveStoredProfilePhoto(userId, saved.uri);
      setPersistedUri(saved.uri);
      updateDraft({ photoUri: saved.uri });
      onPhotoChanged?.(saved.uri);
      setShowOptions(false);
      setStatusMessage('Profile photo saved.');
    } catch {
      if (current()) {
        setError(
          'The photo chooser could not open or save. Please try another image.',
        );
      }
    } finally {
      if (current()) {
        setBusy(false);
        lock.current = false;
      }
    }
  }

  async function removePhoto() {
    setError('');
    setStatusMessage('');
    await saveStoredProfilePhoto(userId, null);
    setPersistedUri(null);
    updateDraft({ photoUri: null });
    onPhotoChanged?.(null);
    setShowOptions(false);
    setStatusMessage('Profile photo removed.');
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        accessibilityState={{ expanded: showOptions, disabled: busy }}
        disabled={busy}
        onPress={() => {
          setStatusMessage('');
          setShowOptions((current) => !current);
        }}
        style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}
      >
        <View style={[styles.avatar, shadows.card]}>
          {activePhotoUri ? (
            <Image
              source={{ uri: activePhotoUri }}
              style={styles.image}
              resizeMode="cover"
              accessibilityLabel="Selected profile photo"
              onError={() => {
                void saveStoredProfilePhoto(userId, null);
                setPersistedUri(null);
                updateDraft({ photoUri: null });
                setError(
                  'That image could not be displayed. Choose another photo.',
                );
              }}
            />
          ) : initials ? (
            <Text accessible={false} style={styles.initials}>
              {initials}
            </Text>
          ) : (
            <User size={34} color={palette.goldIcon} strokeWidth={1.8} />
          )}
        </View>
        <View style={[styles.cameraBadge, shadows.card]}>
          <Camera size={15} color={palette.surface} strokeWidth={2.2} />
        </View>
      </Pressable>

      <Text style={styles.caption}>Tap to update photo</Text>

      {showOptions && (
        <View style={styles.options}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            onPress={() => void choosePhoto()}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <Camera size={17} color={palette.goldText} strokeWidth={2} />
            <Text style={styles.link}>
              {busy ? 'Opening photos…' : 'Choose from library'}
            </Text>
          </Pressable>

          {activePhotoUri && (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              accessibilityState={{ disabled: busy }}
              onPress={() => void removePhoto()}
              style={({ pressed }) => [
                styles.option,
                styles.optionDivider,
                pressed && styles.pressed,
              ]}
            >
              <Trash2 size={17} color={colors.error} strokeWidth={2} />
              <Text style={styles.removeText}>Remove photo</Text>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => setShowOptions(false)}
            style={({ pressed }) => [
              styles.option,
              styles.optionDivider,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {statusMessage !== '' && (
        <Text accessibilityLiveRegion="polite" style={styles.success}>
          {statusMessage}
        </Text>
      )}

      {error !== '' && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, width: '100%' },
  avatarWrap: {
    position: 'relative',
    width: 94,
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: 'hidden',
    backgroundColor: palette.surfaceMuted,
    borderWidth: 2.5,
    borderColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.gold,
    borderWidth: 2,
    borderColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  initials: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    color: palette.goldText,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: palette.textSecondary,
  },
  options: {
    width: '100%',
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceWarm,
    overflow: 'hidden',
    marginTop: 4,
  },
  option: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionDivider: {
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
  },
  link: {
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    color: palette.goldText,
  },
  removeText: {
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    color: colors.error,
  },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: palette.textSecondary,
  },
  pressed: { opacity: 0.7 },
  success: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.success,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    textAlign: 'center',
    color: colors.error,
  },
});
