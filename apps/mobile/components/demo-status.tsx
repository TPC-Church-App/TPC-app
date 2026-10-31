// ===============================================================
// apps/mobile/components/demo-status.tsx
// Display demo persistence and error feedback.
// ===============================================================

import { Text, View } from 'react-native';
import { GivingButton, givingStyles as ui } from '@/components/giving-ui';
import { useDemoWorkspace } from '@/store/demo-workspace';

// ===============================================================
// SAVED DEMO LOADING AND ERROR FEEDBACK
// ===============================================================

export default function DemoStatus() {
  const { ready, error, busy, canReset, retryLoad } = useDemoWorkspace();
  return (
    <View>
      <Text style={ui.caption}>
        Device demo · No live account, payment or approval.
      </Text>
      {((!ready && !error) || busy) && (
        <Text accessibilityLiveRegion="polite" style={ui.body}>
          {ready ? 'Saving demo changes…' : 'Loading saved demo…'}
        </Text>
      )}
      {!!error && (
        <>
          <Text accessibilityRole="alert" style={ui.error}>
            {error}
          </Text>
          <GivingButton
            label="Retry loading saved demo"
            secondary
            disabled={!canReset || busy}
            onPress={retryLoad}
          />
        </>
      )}
    </View>
  );
}
