// ===============================================================
// apps/mobile/utils/use-reduced-motion.ts
// Respect the device's motion preference and release the listener
// when the component using this hook unmounts.
// ===============================================================

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// ===============================================================
// DEVICE MOTION PREFERENCE AND LISTENER CLEANUP
// ===============================================================

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    let active = true;
    let preferenceChanged = false;

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        preferenceChanged = true;
        setReducedMotion(enabled);
      },
    );

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active && !preferenceChanged) {
          setReducedMotion(enabled);
        }
      })
      .catch(() => {
        // Keep motion off if the preference cannot be read.
        if (active && !preferenceChanged) {
          setReducedMotion(true);
        }
      });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
