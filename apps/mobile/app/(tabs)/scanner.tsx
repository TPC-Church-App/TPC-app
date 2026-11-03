// ===============================================================
// apps/mobile/app/(tabs)/scanner.tsx
// Scan a service QR and request server-confirmed attendance.
// ===============================================================
import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandedLoader from '@/components/branded-loader';
import MemberBackButton from '@/components/member-back-button';
import { supabase } from '@/lib/supabase';
import {
  getAttendanceCheckInErrorMessage,
  parseAttendanceCheckInResult,
  type AttendanceCheckInResult,
} from '@/utils/attendance-check-in';

// ===============================================================
// CAMERA PERMISSION AND SCANNER STATE
// ===============================================================

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AttendanceCheckInResult | null>(null);
  const [error, setError] = useState('');
  const scanLocked = useRef(false);

  // ===============================================================
  // CAMERA ACCESS
  // ===============================================================

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionHeader}>
          <MemberBackButton fallbackRoute="/(tabs)/attendance" />
        </View>
        <Text style={styles.message}>Checking camera permission…</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionHeader}>
          <MemberBackButton fallbackRoute="/(tabs)/attendance" />
        </View>
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
  // VERIFY THE QR WITH THE AUTHENTICATED ATTENDANCE ENDPOINT
  // A camera scan alone never records attendance.
  // ===============================================================

  async function handleBarCodeScanned(scan: BarcodeScanningResult) {
    if (scanLocked.current || !scan.data.trim() || scan.data.length > 256)
      return;

    scanLocked.current = true;
    setScanned(true);
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data, error: requestError } = await supabase.functions.invoke(
        'attendance-check-in',
        { body: { qr_code: scan.data.trim() } },
      );

      if (requestError) {
        let responseBody: unknown;
        if (requestError.context instanceof Response) {
          try {
            responseBody = await requestError.context.clone().json();
          } catch {
            responseBody = null;
          }
        }
        setError(getAttendanceCheckInErrorMessage(responseBody));
        return;
      }

      const parsed = parseAttendanceCheckInResult(data);
      if (!parsed) {
        setError(
          'The check-in service returned an unexpected response. Try again.',
        );
        return;
      }

      setResult(parsed);
    } catch {
      setError(
        'Your check-in could not be confirmed. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  function resetScanner() {
    scanLocked.current = false;
    setScanned(false);
    setResult(null);
    setError('');
  }

  // ===============================================================
  // SCANNER INTERFACE
  // ===============================================================

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={
          scanned ? undefined : (scan) => void handleBarCodeScanned(scan)
        }
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      <SafeAreaView
        pointerEvents="box-none"
        style={StyleSheet.absoluteFill}
        edges={['top', 'left', 'right']}
      >
        <View pointerEvents="box-none" style={styles.scannerHeader}>
          <MemberBackButton fallbackRoute="/(tabs)/attendance" />
        </View>
      </SafeAreaView>

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
            {scanned
              ? 'Checking service QR…'
              : 'Align QR code within the frame'}
          </Text>
        </View>
      </View>
      {result && (
        <BrandedLoader
          visible
          success
          label={
            result.status === 'confirmed'
              ? 'Attendance confirmed by the server.'
              : 'You are already checked in for this service.'
          }
          onClose={resetScanner}
          closeLabel="Continue scanning"
        >
          {!!result.serviceTitle && (
            <Text style={styles.resultMessage}>{result.serviceTitle}</Text>
          )}
        </BrandedLoader>
      )}
      {!!error && (
        <View style={styles.resultBackdrop}>
          <View style={styles.resultCard}>
            <Text accessibilityRole="header" style={styles.resultTitle}>
              Check-in not confirmed
            </Text>
            <Text accessibilityLiveRegion="polite" style={styles.resultMessage}>
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={resetScanner}
              style={styles.resultButton}
            >
              <Text style={styles.resultButtonText}>Try again</Text>
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
      <BrandedLoader visible={loading} label="Confirming your attendance…" />
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
  permissionHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  scannerHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'flex-start',
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
