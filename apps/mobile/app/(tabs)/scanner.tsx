// ===============================================================
// apps/mobile/app/(tabs)/scanner.tsx
// Camera QR preview based on the supplied dark/gold scanner reference.
// Recognize only the public demo pass. Never follow scanned URLs.
// Request consent before location capture; never confirm attendance here.
// ===============================================================

import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Keyboard,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import BrandedLoader from '@/components/branded-loader';
import {
  GivingButton as ActionButton,
  GivingPage as MemberPage,
  givingStyles as ui,
} from '@/components/giving-ui';
import { colors } from '@/constants/theme';
import { useAttendanceDraft } from '@/store/attendance-draft';
import {
  DEMO_SERVICE_PASS,
  formatAttendanceStamp,
  getCheckInState,
  isDemoServicePass,
  type AttendanceAttempt,
  type LocationEvidence,
} from '@/utils/attendance';

// ===============================================================
// SCANNER STATE AND LIFECYCLE
// ===============================================================

export default function ScannerScreen() {
  const { service, attempt, saveEvidence, ready } = useAttendanceDraft();
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(false);
  const [appActive, setAppActive] = useState(
    AppState.currentState === 'active',
  );
  const [torch, setTorch] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanError, setScanError] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scan, setScan] = useState<{
    scannedAt: string;
    source: AttendanceAttempt['source'];
  } | null>(null);
  const [evidenceError, setEvidenceError] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [requestingCamera, setRequestingCamera] = useState(false);
  const scanLocked = useRef(false);
  const focusedRef = useRef(false);
  const captureId = useRef(0);
  const busy = useRef(false);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      setFocused(true);
      scanLocked.current = false;
      setScan(null);
      setScanError('');
      setCameraError('');
      setEvidenceError('');
      setManualOpen(false);
      setManualCode('');
      setRequestingCamera(false);
      return () => {
        focusedRef.current = false;
        captureId.current += 1;
        busy.current = false;
        setCapturing(false);
        setFocused(false);
        setTorch(false);
      };
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
      if (state === 'background') {
        captureId.current++;
        busy.current = false;
        setCapturing(false);
        setTorch(false);
      }
    });
    return () => subscription.remove();
  }, []);

  // ===============================================================
  // DEMO SERVICE PASS VALIDATION
  // ===============================================================

  function readPass(data: string, source: AttendanceAttempt['source']) {
    if (!ready || !focusedRef.current || scanLocked.current || attempt) return;
    Keyboard.dismiss();
    scanLocked.current = true;
    if (getCheckInState(service) !== 'open') {
      setScanError('The service check-in window is not open.');
      return;
    }
    if (!isDemoServicePass(data)) {
      setScanError(
        'This code cannot be verified in this preview. Use the labelled TPC demo pass.',
      );
      return;
    }
    setScanError('');
    setScan({ scannedAt: new Date().toISOString(), source });
  }

  function tryAgain() {
    scanLocked.current = false;
    setScan(null);
    setScanError('');
    setCameraError('');
    setEvidenceError('');
  }

  async function allowCamera() {
    if (requestingCamera) return;
    setRequestingCamera(true);
    try {
      await requestPermission();
    } catch {
      if (focusedRef.current)
        setCameraError(
          'Camera permission could not be requested. Use the manual demo code instead.',
        );
    } finally {
      if (focusedRef.current) setRequestingCamera(false);
    }
  }

  // ===============================================================
  // SAVE PENDING ATTENDANCE EVIDENCE
  // ===============================================================

  async function save(location: LocationEvidence | null) {
    if (!scan || !focusedRef.current) return;
    const result = await saveEvidence({ ...scan, location });
    if (!focusedRef.current) return;
    if (!result.ok) {
      setEvidenceError(result.message);
      return;
    }
    router.replace('/(tabs)/attendance');
  }

  function cancelLocation() {
    captureId.current += 1;
    busy.current = false;
    setCapturing(false);
  }

  // ===============================================================
  // LOCATION CONSENT AND CAPTURE
  // ===============================================================

  async function captureLocation() {
    if (!scan || busy.current) return;
    const operation = ++captureId.current;
    busy.current = true;
    setCapturing(true);
    setEvidenceError('');
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const consent = await Location.requestForegroundPermissionsAsync();
      if (!focusedRef.current || captureId.current !== operation) return;
      if (!consent.granted) {
        setEvidenceError(
          'Location was not enabled. You can request a witness instead, or leave without recording attendance.',
        );
        return;
      }

      const position = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error('LOCATION_TIMEOUT')),
            12_000,
          );
        }),
      ]);
      if (!focusedRef.current || captureId.current !== operation) return;

      await save({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        observedAt: new Date(position.timestamp).toISOString(),
      });
    } catch (error) {
      if (focusedRef.current && captureId.current === operation) {
        setEvidenceError(
          error instanceof Error && error.message === 'LOCATION_TIMEOUT'
            ? 'Location is taking too long. Try again or request a witness instead.'
            : 'Location could not be captured. Check device location services or request a witness instead.',
        );
      }
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
      if (focusedRef.current && captureId.current === operation) {
        busy.current = false;
        setCapturing(false);
      }
    }
  }

  if (attempt) {
    return (
      <MemberPage
        sectionLabel="CHECK-IN"
        title="Check-in already captured"
        subtitle="One local attempt is kept for this demo service."
      >
        <ActionButton
          label="View your check-in"
          onPress={() => router.navigate('/(tabs)/attendance')}
        />
      </MemberPage>
    );
  }

  // ===============================================================
  // SCANNER INTERFACE
  // ===============================================================

  const cameraActive =
    focused &&
    appActive &&
    permission?.granted &&
    !scan &&
    !scanError &&
    !cameraError &&
    !manualOpen;

  return (
    <>
      <MemberPage
        sectionLabel="CHECK-IN"
        title={scan ? 'Keep your attendance evidence' : "You're welcome here"}
        subtitle={
          scan
            ? 'The demo pass was recognised. Choose how to support this check-in.'
            : 'Point your camera at the service QR code inside the entrance.'
        }
      >
        {scan ? (
          <>
            <View style={ui.card}>
              <Text style={ui.heading}>{service.name}</Text>
              <Text style={ui.body}>
                Scan time: {formatAttendanceStamp(scan.scannedAt)} WAT
              </Text>
              <Text style={ui.caption}>
                No attendance has been confirmed. This is a demo service pass.
              </Text>
            </View>
            <View style={ui.card}>
              <Text style={ui.heading}>Location evidence is your choice</Text>
              <Text style={ui.body}>
                With your permission, capture your current location and its
                reported accuracy alongside the scan time. Native evidence is
                encrypted on this device until you clear it in Settings. Web
                reloads discard coordinates and require a witness.
              </Text>
              <ActionButton
                label="Allow location and save evidence"
                onPress={captureLocation}
              />
              <ActionButton
                label="Request a witness instead"
                secondary
                onPress={() => save(null)}
              />
              <Text style={ui.caption}>
                A witness must be a verified member with confirmed attendance at
                this same service. This preview cannot contact or verify that
                member.
              </Text>
              {evidenceError !== '' && (
                <Text accessibilityRole="alert" style={ui.error}>
                  {evidenceError}
                </Text>
              )}
            </View>
            <ActionButton label="Scan again" secondary onPress={tryAgain} />
          </>
        ) : (
          <>
            <View style={styles.scannerCard}>
              <Text style={styles.scannerTitle}>TPC · SERVICE CHECK-IN</Text>
              <View style={styles.cameraFrame}>
                {cameraActive ? (
                  <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    enableTorch={torch}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={({ data }) => readPass(data, 'qr')}
                    onMountError={() =>
                      setCameraError(
                        'The camera could not start. Try again or use the manual demo code.',
                      )
                    }
                  />
                ) : (
                  <View style={styles.cameraPlaceholder}>
                    <Text style={styles.scannerText}>
                      {manualOpen
                        ? 'Manual code entry selected'
                        : permission?.granted
                          ? 'Camera paused'
                          : 'Camera access is needed to scan a service QR'}
                    </Text>
                  </View>
                )}
                <View pointerEvents="none" style={styles.scanGuide} />
              </View>
              <Text style={styles.scannerText}>
                {service.name} · Sample pass only
              </Text>
            </View>

            {!permission?.granted && (
              <View style={ui.card}>
                <Text style={ui.body}>
                  Use the camera only to read a QR code. This flow does not take
                  photos, record video or request microphone access.
                </Text>
                {permission?.canAskAgain !== false ? (
                  <ActionButton
                    label={
                      requestingCamera
                        ? 'Requesting camera permission…'
                        : 'Allow camera'
                    }
                    disabled={requestingCamera}
                    onPress={allowCamera}
                  />
                ) : (
                  <ActionButton
                    label="Open app permission settings"
                    onPress={() => {
                      Linking.openSettings().catch(() =>
                        setCameraError(
                          'Open Expo Go permissions in your device Settings.',
                        ),
                      );
                    }}
                  />
                )}
                <Text style={ui.caption}>
                  Camera access is optional. You can use manual demo-code entry
                  below.
                </Text>
              </View>
            )}

            {(scanError !== '' || cameraError !== '') && (
              <View style={ui.card}>
                <Text accessibilityRole="alert" style={ui.error}>
                  {scanError || cameraError}
                </Text>
                <ActionButton
                  label="Try scanning again"
                  secondary
                  onPress={tryAgain}
                />
              </View>
            )}
            {cameraActive && (
              <ActionButton
                label={torch ? 'Turn torch off' : 'Turn torch on'}
                secondary
                onPress={() => setTorch((current) => !current)}
              />
            )}

            <ActionButton
              label={
                manualOpen ? 'Return to camera' : 'Enter service code instead'
              }
              secondary
              onPress={() => {
                tryAgain();
                setManualOpen((current) => !current);
              }}
            />
            {manualOpen && (
              <View style={ui.card}>
                <Text style={ui.label}>Demo service code</Text>
                <TextInput
                  accessibilityLabel="Demo service code"
                  value={manualCode}
                  onChangeText={(value) => {
                    setManualCode(value);
                    scanLocked.current = false;
                    setScanError('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={256}
                  style={ui.input}
                  placeholder="Enter the demo service code"
                  placeholderTextColor={colors.secondaryText}
                  returnKeyType="done"
                  onSubmitEditing={() => readPass(manualCode, 'manualDemo')}
                />
                <ActionButton
                  label="Enter code"
                  onPress={() => readPass(manualCode, 'manualDemo')}
                />
                <ActionButton
                  label="Fill sample code"
                  secondary
                  onPress={() => {
                    setManualCode(DEMO_SERVICE_PASS);
                    scanLocked.current = false;
                    setScanError('');
                  }}
                />
              </View>
            )}
            <Text style={ui.caption}>
              The backend QR contract is not connected. This scanner recognises
              only the labelled demo pass and never opens scanned links.
            </Text>
          </>
        )}
        <ActionButton
          label={
            scan ? 'Leave without recording attendance' : 'Back to attendance'
          }
          secondary
          onPress={() => {
            cancelLocation();
            tryAgain();
            router.navigate('/(tabs)/attendance');
          }}
        />
      </MemberPage>

      <BrandedLoader
        visible={capturing}
        label="Capturing location evidence…"
        closeLabel="Cancel location check"
        onClose={cancelLocation}
      />
    </>
  );
}

// ===============================================================
// SCANNER STYLES
// ===============================================================

const styles = StyleSheet.create({
  scannerCard: {
    padding: 18,
    gap: 16,
    borderRadius: 24,
    backgroundColor: '#26291F',
  },
  scannerTitle: {
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 1,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  scannerText: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.background,
    textAlign: 'center',
  },
  cameraFrame: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    aspectRatio: 0.9,
    maxHeight: 420,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#171A14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraPlaceholder: { padding: 24 },
  scanGuide: {
    position: 'absolute',
    width: '76%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 18,
  },
});
