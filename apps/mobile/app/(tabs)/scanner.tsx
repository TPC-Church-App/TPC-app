// apps/mobile/app/(tabs)/scanner.tsx
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </SafeAreaView>
    );
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || loading) return;
    
    setScanned(true);
    setLoading(true);

    try {
      // Call the Supabase Edge Function we deployed earlier
      const { data: responseData, error } = await supabase.functions.invoke('attendance-check-in', {
        body: { qr_code: data },
      });

      if (error) throw new Error(error.message);
      
      // Success!
      Alert.alert(
        "Check-in Successful! 🎉",
        `You have been marked present for: ${responseData.service_title || 'Service'}`,
        [{ text: "OK", onPress: () => router.replace('/(tabs)/home') }]
      );

    } catch (err: any) {
      // Handle errors like "Invalid QR", "Already checked in", etc.
      Alert.alert(
        "Check-in Failed",
        err.message || "This QR code is invalid or has expired.",
        [{ text: "Try Again", onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
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
            {loading ? "Verifying..." : "Align QR code within the frame"}
          </Text>
        </View>
      </View>
    </View>
  );
}

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
  borderTopLeft: {
    position: 'absolute', top: 0, left: 0, width: 40, height: 40,
    borderTopWidth: 4, borderLeftWidth: 4, borderColor: colors.primary,
  },
  borderTopRight: {
    position: 'absolute', top: 0, right: 0, width: 40, height: 40,
    borderTopWidth: 4, borderRightWidth: 4, borderColor: colors.primary,
  },
  borderBottomLeft: {
    position: 'absolute', bottom: 0, left: 0, width: 40, height: 40,
    borderBottomWidth: 4, borderLeftWidth: 4, borderColor: colors.primary,
  },
  borderBottomRight: {
    position: 'absolute', bottom: 0, right: 0, width: 40, height: 40,
    borderBottomWidth: 4, borderRightWidth: 4, borderColor: colors.primary,
  },
});