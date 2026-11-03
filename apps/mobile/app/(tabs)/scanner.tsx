// ===============================================================
// apps/mobile/app/(tabs)/scanner.tsx
// Preview QR scanning without recording attendance in the internal alpha.
// ===============================================================
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

// ===============================================================
// CAMERA PERMISSION AND SCANNER STATE
// ===============================================================

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // ===============================================================
  // CAMERA ACCESS
  // ===============================================================

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Checking camera permission…</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={requestPermission}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Allow camera access</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ===============================================================
  // REPORT THAT THE CAMERA READ A QR CODE
  // A scan alone is not proof of attendance; no endpoint is connected here.
  // ===============================================================

  function handleBarCodeScanned() {
    if (scanned) return;

    setScanned(true);
  }

  // ===============================================================
  // SCANNER INTERFACE
  // ===============================================================

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      {/* Dark overlay with a clear box in the middle */}
      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer}></View>
        <View style={styles.focusedContainer}>
          <View style={styles.borderTopLeft} />
          <View style={styles.borderTopRight} />
          <View style={styles.borderBottomLeft} />
          <View style={styles.borderBottomRight} />
        </View>
        <View style={styles.unfocusedContainer}>
          <Text style={styles.instructions}>
            {scanned ? 'QR code detected' : 'Align QR code within the frame'}
          </Text>
        </View>
      </View>
      {scanned && (
        <View style={styles.resultBackdrop}>
          <View style={styles.resultCard}>
            <Text accessibilityRole="header" style={styles.resultTitle}>
              QR code detected
            </Text>
            <Text style={styles.resultMessage}>
              This internal alpha does not have the attendance check-in service
              connected. No attendance was recorded.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setScanned(false)}
              style={styles.resultButton}
            >
              <Text style={styles.resultButtonText}>Scan another</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/(tabs)/attendance')}
              style={styles.resultLinkButton}
            >
              <Text style={styles.resultLinkText}>Return to attendance</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ===============================================================
// SCANNER STYLES
// ===============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
    marginTop: 50,
  },
  permissionButton: {
    minHeight: 48,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  permissionButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusedContainer: {
    width: 250,
    height: 250,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  instructions: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
  },
  resultBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  resultCard: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  resultTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.text,
  },
  resultMessage: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: colors.secondaryText,
  },
  resultButton: {
    minHeight: 48,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  resultButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  resultLinkButton: {
    minHeight: 44,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultLinkText: {
    color: colors.link,
    fontSize: 15,
    fontWeight: '600',
  },
  borderTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.primary,
  },
  borderTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.primary,
  },
  borderBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.primary,
  },
  borderBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.primary,
  },
});
