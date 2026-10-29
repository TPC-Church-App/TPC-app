// ===============================================================
// apps/mobile/app/index.tsx
// Display the church branding and open the existing sign-in screen.
// ===============================================================

import { router } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

// ===============================================================
// BRANDED OPENING SCREEN
// Preserve the logo's proportions and keep navigation explicit.
// The circles are decorative rather than loading indicators.
// ===============================================================

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <View style={styles.outerRing}>
            <View style={styles.innerRing}>
              <View style={styles.logoFrame}>
                <Image
                  source={require('../assets/light/church-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityLabel="The Pentecostal Congregation logo"
                />
              </View>
            </View>
          </View>

          <Text accessibilityRole="header" style={styles.title}>
            TPC
          </Text>

          <Text style={styles.tagline}>
            A place to belong. A faith to live.
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(auth)/login')}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Get started</Text>
          </Pressable>

          <Text style={styles.motto}>FAITH · FAMILY · PURPOSE</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===============================================================
// SCREEN STYLES
// Use open space, fine circular borders and the reference palette.
// ===============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  brand: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    width: '100%',
  },
  outerRing: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: colors.decorativeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 212,
    height: 212,
    borderRadius: 106,
    borderWidth: 1,
    borderColor: colors.decorativeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFrame: {
    width: 184,
    height: 184,
    borderRadius: 92,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    marginTop: 28,
    fontSize: 40,
    lineHeight: 50,
    fontWeight: '700',
    color: colors.text,
  },
  tagline: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    color: colors.secondaryText,
  },
  footer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    paddingTop: 24,
  },
  button: {
    width: '100%',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  motto: {
    marginTop: 24,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 1.5,
    textAlign: 'center',
    color: colors.secondaryText,
  },
});
