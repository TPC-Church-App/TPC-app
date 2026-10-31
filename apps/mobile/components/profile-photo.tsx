// ===============================================================
// apps/mobile/components/profile-photo.tsx
// Choose a local profile image without uploading it.
// Native selections are copied out of the temporary picker cache.
// ===============================================================

import * as ImagePicker from 'expo-image-picker';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '@/constants/theme';
import { useMemberDraft } from '@/store/member-draft';

// ===============================================================
// PHOTO STATE AND STALE RESULT GUARDS
// ===============================================================

export default function ProfilePhoto() {
  const { draft, updateDraft, sessionToken, isCurrentSession } =
    useMemberDraft();
  const mounted = useRef(false);
  const generation = useRef(0);
  const lock = useRef(false);
  const latestPhoto = useRef(draft.photoUri);
  latestPhoto.current = draft.photoUri;
  const renderToken = sessionToken();
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
  const [showOptions, setShowOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // ===============================================================
  // SELECT AND COPY A LOCAL PHOTO
  // ===============================================================

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

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 0.8,
        exif: false,
        base64: false,
      });

      if (!current()) return;
      if (!result.canceled) {
        const uri = result.assets[0]?.uri;

        if (uri) {
          if (Platform.OS === 'web') {
            updateDraft({ photoUri: uri });
          } else {
            const source = new File(uri);
            if (source.size > 8 * 1024 * 1024) {
              setError('Choose a photo smaller than 8 MB.');
              return;
            }
            const target = new File(
              Paths.document,
              'tpc-profile-' + Date.now() + '.jpg',
            );
            source.copy(target);
            if (!current()) {
              target.delete();
              return;
            }
            updateDraft({ photoUri: target.uri });
          }
          setShowOptions(false);
        } else {
          setError('That photo could not be opened. Choose another image.');
        }
      }
    } catch {
      if (current())
        setError(
          'The photo chooser could not open or save. Please try another image.',
        );
    } finally {
      if (current()) {
        setBusy(false);
        lock.current = false;
      }
    }
  }

  // ===============================================================
  // REMOVE THE CURRENT PHOTO SELECTION
  // ===============================================================

  function removePhoto() {
    updateDraft({ photoUri: null });
    setError('');
    setShowOptions(false);
  }

  // ===============================================================
  // PROFILE PHOTO CONTROLS
  // ===============================================================

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        accessibilityState={{ expanded: showOptions, disabled: busy }}
        disabled={busy}
        onPress={() => setShowOptions((current) => !current)}
        style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
      >
        {draft.photoUri ? (
          <Image
            source={{ uri: draft.photoUri }}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel="Selected profile photo"
            onError={() => {
              if (
                !mounted.current ||
                !isCurrentSession(renderToken) ||
                latestPhoto.current !== draft.photoUri
              )
                return;
              updateDraft({ photoUri: null });
              setError(
                'That image could not be displayed. Choose another photo.',
              );
            }}
          />
        ) : (
          <Text accessible={false} style={styles.initials}>
            TPC
          </Text>
        )}
      </Pressable>

      <Text style={styles.caption}>Tap to change photo</Text>

      {showOptions && (
        <View style={styles.options}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            onPress={choosePhoto}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <Text style={styles.link}>
              {busy ? 'Opening photos…' : 'Choose photo'}
            </Text>
          </Pressable>

          {draft.photoUri && (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              accessibilityState={{ disabled: busy }}
              onPress={removePhoto}
              style={styles.option}
            >
              <Text style={styles.link}>Remove photo</Text>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => setShowOptions(false)}
            style={styles.option}
          >
            <Text style={styles.link}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {error !== '' && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ===============================================================
// PROFILE PHOTO STYLES
// ===============================================================

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, width: '100%' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%' },
  initials: { fontSize: 24, fontWeight: '800', color: colors.onPrimary },
  caption: { fontSize: 13, lineHeight: 20, color: colors.secondaryText },
  options: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.decorativeBorder,
    borderRadius: 12,
    padding: 8,
    backgroundColor: colors.background,
  },
  option: {
    minHeight: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    color: colors.link,
  },
  pressed: { opacity: 0.65 },
  error: { fontSize: 14, lineHeight: 21, color: colors.error },
});
