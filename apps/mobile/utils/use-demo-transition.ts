// ===============================================================
// apps/mobile/utils/use-demo-transition.ts
// Demonstrate loading → success → navigation in development only.
// Backend integration must use actual request results instead.
// Cancel scheduled work when leaving the screen.
// The sequence uses O(1) time and space for two scheduled callbacks.
// ===============================================================

import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

type Phase = 'idle' | 'loading' | 'success';

// ===============================================================
// DEVELOPMENT TRANSITION AND TIMER CLEANUP
// ===============================================================

export function useDemoTransition() {
  const [phase, setPhase] = useState<Phase>('idle');
  const focused = useRef(false);
  const running = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setPhase('idle');

      return () => {
        focused.current = false;
        timers.current.forEach(clearTimeout);
        timers.current = [];
        running.current = false;
      };
    }, []),
  );

  function start(onComplete: () => void) {
    if (!__DEV__ || !focused.current || running.current) return;

    running.current = true;
    setPhase('loading');

    timers.current = [
      setTimeout(() => {
        if (focused.current) setPhase('success');
      }, 450),

      setTimeout(() => {
        if (!focused.current) return;

        timers.current = [];
        running.current = false;
        setPhase('idle');
        onComplete();
      }, 950),
    ];
  }

  return { phase, busy: phase !== 'idle', start };
}
