// ===============================================================
// File: apps/mobile/app/(tabs)/scanner.tsx
// Description: Scan a service QR and request server-confirmed check-in with working back action.
// Author: Josiah Ewumi
// ===============================================================

import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import { router } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BrandedLoader from '@/components/branded-loader';
import MemberBackButton from '@/components/member-back-button';
import BrandBackdrop from '@/components/ui/brand-backdrop';
import GoldButton from '@/components/ui/gold-button';
import SurfaceCard from '@/components/ui/surface-card';
import { fonts, palette, radii } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import {
  getAttendanceCheckInErrorMessage,
  parseAttendanceCheckInResult,
  type AttendanceCheckInResult,
} from '@/utils/attendance-check-in';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AttendanceCheckInResult | null>(null);
  const [error, setError] = useState('');
  const scanLocked = useRef(false);

  if (!permission) {
    return (
      <BrandBackdrop>
        <SafeAreaView style={styles.permissionScreen}>
          <View style={styles.permissionHeader}>
            <MemberBackButton
              fallbackRoute="/(tabs)/attendance"
              preferFallback
            />
          </View>
          <View style={styles.permissionBody}>
            <Text style={styles.permissionTitle}>Checking camera access…</Text>
          </View>
        </SafeAreaView>
      </BrandBackdrop>
    );
  }

  if (!permission.granted) {
    return (
      <BrandBackdrop>
        <SafeAreaView style={styles.permissionScreen}>
          <View style={styles.permissionHeader}>
            <MemberBackButton
              fallbackRoute="/(tabs)/attendance"
              preferFallback
            />
          </View>
          <View style={styles.permissionBody}>
            <SurfaceCard style={styles.permissionCard}>
              <View style={styles.permissionIconCircle}>
                <Camera size={28} color={palette.goldIcon} strokeWidth={1.8} />
              </View>
              <Text style={styles.permissionTitle}>
                Camera Permission Needed
              </Text>
              <Text style={styles.permissionSubtitle}>
                Allow TPC to use your camera so you can scan the service QR pass
                at the auditorium.
              </Text>
              <GoldButton
                label="Allow Camera Access"
                onPress={() => void requestPermission()}
                style={{ width: '100%', marginTop: 8 }}
              />
            </SurfaceCard>
          </View>
        </SafeAreaView>
      </BrandBackdrop>
    );
  }

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

      {/* Non-interactive overlay rendered underneath the floating header */}
      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.unfocusedContainer} />
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
              : 'Align service QR code within the frame'}
          </Text>
        </View>
      </View>

      {/* Top header placed last with high zIndex/elevation so Back is always tappable */}
      <SafeAreaView
        pointerEvents="box-none"
        style={styles.scannerHeaderWrap}
        edges={['top', 'left', 'right']}
      >
        <View pointerEvents="box-none" style={styles.scannerHeader}>
          <MemberBackButton fallbackRoute="/(tabs)/attendance" preferFallback />
          <View style={styles.scannerPill}>
            <Text style={styles.scannerPillText}>Service Check-in</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

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
            <Text style={styles.resultServiceTitle}>{result.serviceTitle}</Text>
          )}
        </BrandedLoader>
      )}

      {!!error && (
        <View style={styles.resultBackdrop}>
          <SurfaceCard style={styles.resultCard}>
            <Text accessibilityRole="header" style={styles.resultTitle}>
              Check-in Not Confirmed
            </Text>
            <Text accessibilityLiveRegion="polite" style={styles.resultMessage}>
              {error}
            </Text>
            <GoldButton
              label="Try Again"
              onPress={resetScanner}
              style={{ marginTop: 18 }}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/(tabs)/attendance')}
              style={styles.resultLinkButton}
            >
              <Text style={styles.resultLinkText}>Return to Attendance</Text>
            </Pressable>
          </SurfaceCard>
        </View>
      )}

      <BrandedLoader visible={loading} label="Confirming your attendance…" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionScreen: {
    flex: 1,
  },
  permissionHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'flex-start',
  },
  permissionBody: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  permissionCard: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  permissionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: palette.textPrimary,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 21,
    color: palette.textSecondary,
    textAlign: 'center',
  },
  scannerHeaderWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  scannerPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(19, 27, 46, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scannerPillText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: palette.surface,
  },
  headerSpacer: {
    width: 42,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.62)',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusedContainer: {
    width: 256,
    height: 256,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  instructions: {
    fontFamily: fonts.semiBold,
    color: palette.surface,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  resultBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 30,
    elevation: 30,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(19, 27, 46, 0.72)',
  },
  resultCard: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  resultTitle: {
    fontFamily: fonts.bold,
    fontSize: 21,
    lineHeight: 28,
    color: palette.textPrimary,
  },
  resultMessage: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: palette.textSecondary,
  },
  resultServiceTitle: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: palette.textPrimary,
  },
  resultLinkButton: {
    minHeight: 44,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultLinkText: {
    fontFamily: fonts.semiBold,
    color: palette.goldText,
    fontSize: 14.5,
  },
  borderTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 42,
    height: 42,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
    borderColor: palette.gold,
  },
  borderTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 42,
    height: 42,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
    borderColor: palette.gold,
  },
  borderBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 42,
    height: 42,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
    borderColor: palette.gold,
  },
  borderBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 42,
    height: 42,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
    borderColor: palette.gold,
  },
});
