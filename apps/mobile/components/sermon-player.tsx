// ===============================================================
// apps/mobile/components/sermon-player.tsx
// Control bundled sample playback without recording.
// ===============================================================

// Real audio controls over a bundled, quiet test tone. No sermon is implied.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from 'expo-audio';
import {
  DemoOperationGuard,
  startGuardedDemoPlayback,
} from '@/utils/demo-lifecycle';
import { GivingButton, givingStyles as ui } from '@/components/giving-ui';

// ===============================================================
// PLAYER STATUS AND LIFECYCLE
// ===============================================================

export default function SermonPlayer() {
  const player = useAudioPlayer(require('../assets/demo/player-sample.wav'));
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState('');
  const focused = useRef(false);
  const operations = useRef(new DemoOperationGuard());
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        operations.current.invalidate();
        player.pause();
      };
    }, [player]),
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') {
        operations.current.invalidate();
        player.pause();
      }
    });
    return () => sub.remove();
  }, [player]);

  // ===============================================================
  // SAMPLE PLAYBACK CONTROLS
  // ===============================================================

  async function play() {
    if (player.playing) {
      operations.current.invalidate();
      player.pause();
      return;
    }
    const operation = operations.current.begin();
    const current = () =>
      focused.current &&
      AppState.currentState === 'active' &&
      operations.current.isCurrent(operation);
    try {
      setError('');
      await startGuardedDemoPlayback({
        configure: () =>
          setAudioModeAsync({
            playsInSilentMode: true,
            allowsRecording: false,
            shouldPlayInBackground: false,
          }),
        atEnd: status.currentTime >= status.duration - 0.1,
        seekToStart: () => player.seekTo(0),
        isCurrent: current,
        play: () => player.play(),
      });
    } catch {
      if (current())
        setError('Audio could not play. Check your output device and retry.');
    }
  }

  // ===============================================================
  // PLAYER FEEDBACK AND TRANSPORT BUTTONS
  // ===============================================================

  return (
    <View style={ui.card}>
      <Text style={ui.heading}>Player preview</Text>
      <Text style={ui.body}>
        This six-second sound tests the player controls. It is a quiet musical
        tone, not a church sermon. Audio stops when you leave this screen or
        background the app.
      </Text>
      <Text accessibilityLiveRegion="polite" style={ui.label}>
        {status.isBuffering
          ? 'Buffering…'
          : status.playing
            ? 'Playing sample audio'
            : status.isLoaded
              ? 'Ready'
              : 'Loading sample audio…'}
      </Text>
      <Text style={ui.body}>
        {Math.floor(status.currentTime || 0)} /{' '}
        {Math.round(status.duration || 0)} seconds
      </Text>
      {(error || status.error) && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error || status.error}
        </Text>
      )}
      {(error || status.error) && (
        <GivingButton
          label="Reload sample audio"
          secondary
          onPress={() => {
            operations.current.invalidate();
            player.pause();
            setError('');
            try {
              player.replace(require('../assets/demo/player-sample.wav'));
            } catch {
              setError('Sample audio could not be reloaded.');
            }
          }}
        />
      )}
      <GivingButton
        label={status.playing ? 'Pause' : 'Play sample audio'}
        disabled={!status.isLoaded}
        onPress={() => {
          void play();
        }}
      />
      <GivingButton
        label="Restart audio"
        secondary
        disabled={!status.isLoaded}
        onPress={() => {
          operations.current.invalidate();
          player.pause();
          void player.seekTo(0).catch(() => {
            if (focused.current) setError('Could not restart audio.');
          });
        }}
      />
      <View style={ui.wrap}>
        <GivingButton
          label="Back 2 seconds"
          secondary
          disabled={!status.isLoaded}
          onPress={() => {
            void player
              .seekTo(Math.max(0, status.currentTime - 2))
              .catch(() => {
                if (focused.current) setError('Could not seek audio.');
              });
          }}
        />
        <GivingButton
          label="Forward 2 seconds"
          secondary
          disabled={!status.isLoaded}
          onPress={() => {
            void player
              .seekTo(Math.min(status.duration, status.currentTime + 2))
              .catch(() => setError('Could not seek audio.'));
          }}
        />
      </View>
    </View>
  );
}
