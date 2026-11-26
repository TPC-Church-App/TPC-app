// ===============================================================
// File: apps/mobile/components/ui/social-auth-row.tsx
// Description: Google & Apple OAuth buttons with PKCE/implicit handling & onboarding check.
// Author: Josiah Ewumi
// ===============================================================

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { fonts, palette, radii, shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <Path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </Svg>
  );
}

function AppleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#111111"
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z"
      />
    </Svg>
  );
}

type SocialAuthRowProps = {
  variant: 'compact' | 'continue';
  dividerLabel: string;
  onNotice: (message: string) => void;
};

function needsOnboarding(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return true;
  const phone = typeof metadata.phone === 'string' ? metadata.phone.trim() : '';
  const age = typeof metadata.age === 'string' ? metadata.age.trim() : '';
  const address =
    typeof metadata.address === 'string' ? metadata.address.trim() : '';
  return !phone || !age || !address;
}

export default function SocialAuthRow({
  variant,
  dividerLabel,
  onNotice,
}: SocialAuthRowProps) {
  const [busyProvider, setBusyProvider] = useState<'google' | 'apple' | null>(
    null,
  );

  async function routeAuthenticatedUser() {
    const { data } = await supabase.auth.getUser();
    const metadata = data.user?.user_metadata as
      Record<string, unknown> | undefined;
    if (needsOnboarding(metadata)) {
      router.replace('/(auth)/complete-profile' as Href);
    } else {
      router.replace('/(tabs)/home');
    }
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    if (busyProvider) return;
    setBusyProvider(provider);
    onNotice('');
    const label = provider === 'google' ? 'Google' : 'Apple';

    try {
      const redirectTo = Linking.createURL('auth-callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        onNotice(
          `${label} sign-in is not enabled yet in Supabase Auth. Please use email and password, or enable the ${label} provider in Supabase.`,
        );
        return;
      }

      if (Platform.OS !== 'web' && data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
        );

        if (result.type === 'success' && result.url) {
          const parsedUrl = new URL(result.url);
          const hashParams = new URLSearchParams(
            parsedUrl.hash.replace(/^#/, ''),
          );
          const errorDesc =
            parsedUrl.searchParams.get('error_description') ||
            hashParams.get('error_description') ||
            parsedUrl.searchParams.get('error') ||
            hashParams.get('error');

          if (errorDesc) {
            onNotice(
              `${label} sign-in could not complete (${errorDesc.replace(/\+/g, ' ')}).`,
            );
            return;
          }

          const code = parsedUrl.searchParams.get('code');
          if (code) {
            const { error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeError) {
              await routeAuthenticatedUser();
              return;
            }
          }

          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!sessionError) {
              await routeAuthenticatedUser();
              return;
            }
          }

          onNotice(
            `${label} sign-in returned without a valid session. Make sure ${redirectTo} is added to Supabase Redirect URLs.`,
          );
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          onNotice(`${label} sign-in was cancelled.`);
        }
      }
    } catch {
      onNotice(
        `${label} sign-in is unavailable right now. Please use email and password.`,
      );
    } finally {
      setBusyProvider(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.hairline} />
        <Text style={styles.dividerText}>{dividerLabel}</Text>
        <View style={styles.hairline} />
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          disabled={busyProvider !== null}
          onPress={() => void handleOAuth('google')}
          style={({ pressed }) => [
            styles.socialButton,
            shadows.card,
            pressed && styles.pressed,
          ]}
        >
          <GoogleLogo />
          <Text
            numberOfLines={variant === 'continue' ? 2 : 1}
            style={[
              styles.socialText,
              variant === 'continue' && styles.socialTextCompact,
            ]}
          >
            {busyProvider === 'google'
              ? 'Opening…'
              : variant === 'continue'
                ? 'Continue with\nGoogle'
                : 'Google'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
          disabled={busyProvider !== null}
          onPress={() => void handleOAuth('apple')}
          style={({ pressed }) => [
            styles.socialButton,
            shadows.card,
            pressed && styles.pressed,
          ]}
        >
          <AppleLogo />
          <Text
            numberOfLines={variant === 'continue' ? 2 : 1}
            style={[
              styles.socialText,
              variant === 'continue' && styles.socialTextCompact,
            ]}
          >
            {busyProvider === 'apple'
              ? 'Opening…'
              : variant === 'continue'
                ? 'Continue with\nApple'
                : 'Apple'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  hairline: {
    flex: 1,
    height: 1,
    backgroundColor: palette.borderSubtle,
  },
  dividerText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: palette.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: palette.surfaceWarm,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    borderRadius: radii.pill,
  },
  socialText: {
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    color: palette.textPrimary,
  },
  socialTextCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.72,
  },
});
