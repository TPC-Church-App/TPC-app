// ===============================================================
// File: apps/mobile/app/index.tsx
// Description: Branded Warm Ivory & Gold welcome screen for TPC.
// Author: Josiah Ewumi
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

import BrandBackdrop from '@/components/ui/brand-backdrop';
import GoldButton from '@/components/ui/gold-button';
import { fonts, palette, shadows } from '@/constants/theme';
import { useMemberDraft } from '@/store/member-draft';

export default function WelcomeScreen() {
  const { setEntryMode } = useMemberDraft();

  function startRegistration() {
    setEntryMode('register');
    router.push('/(auth)/register');
  }

  function startSignIn() {
    setEntryMode('signIn');
    router.push('/(auth)/login');
  }

  return (
    <BrandBackdrop>
      <SafeAreaView style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.outerRing}>
              <View style={styles.innerRing}>
                <View style={[styles.logoFrame, shadows.card]}>
                  <Image
                    source={require('../assets/light/church-logo-transparent.png')}
                    style={styles.logo}
                    resizeMode="contain"
                    accessibilityLabel="The Pentecostal Congregation logo"
                  />
                </View>
              </View>
            </View>

            <Text accessibilityRole="header" style={styles.title}>
              The Pentecostal{'\n'}Congregation
            </Text>

            <Text style={styles.tagline}>
              A place to belong. A faith to live.
            </Text>
          </View>

          <View style={styles.footer}>
            <GoldButton label="Get Started" onPress={startRegistration} />

            <Pressable
              accessibilityRole="button"
              onPress={startSignIn}
              style={({ pressed }) => [
                styles.signInButton,
                pressed && styles.signInPressed,
              ]}
            >
              <Text style={styles.signInMuted}>Already have an account? </Text>
              <Text style={styles.signInGold}>Sign In</Text>
            </Pressable>

            <Text style={styles.motto}>FAITH · FAMILY · PURPOSE</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BrandBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  brand: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    width: '100%',
  },
  outerRing: {
    width: 236,
    height: 236,
    borderRadius: 118,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  innerRing: {
    width: 204,
    height: 204,
    borderRadius: 102,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFrame: {
    width: 172,
    height: 172,
    borderRadius: 86,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    marginTop: 28,
    fontFamily: fonts.extraBold,
    fontSize: 28,
    lineHeight: 35,
    textAlign: 'center',
    color: palette.inkNavy,
    letterSpacing: -0.4,
  },
  tagline: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 15.5,
    lineHeight: 23,
    textAlign: 'center',
    color: palette.textSecondary,
  },
  footer: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    paddingTop: 20,
  },
  signInButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 12,
  },
  signInPressed: {
    opacity: 0.7,
  },
  signInMuted: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: palette.textPrimary,
  },
  signInGold: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: palette.goldText,
  },
  motto: {
    marginTop: 20,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.8,
    textAlign: 'center',
    color: palette.textMuted,
  },
});
