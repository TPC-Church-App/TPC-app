// ===============================================================
// apps/mobile/app/(tabs)/home.tsx
// Present the member Home using the church palette.
// Sample content and local interactions do not create real records.
// ===============================================================

import { useMemo, useState } from 'react';
import { useAttendanceDraft } from '@/store/attendance-draft';
import { useDemoWorkspace } from '@/store/demo-workspace';
import { formatAttendanceTime } from '@/utils/attendance';
import { Redirect, router } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
} from 'react-native-reanimated';

import { useAppTheme, type ThemeColors } from '@/constants/theme';
import { useMemberDraft } from '@/store/member-draft';
import MemberMenu from '@/components/member-menu';

// ===============================================================
// MEMBER HOME
// Keep preview access separate from real authentication.
// ===============================================================

export default function HomeScreen() {
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const { colors, scheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { draft, entryMode, demoAccess, closeDemo } = useMemberDraft();

  const { service, records } = useAttendanceDraft();
  const { data } = useDemoWorkspace();

  if (!__DEV__ || !demoAccess) {
    return <Redirect href="/" />;
  }

  const firstName = entryMode === 'register' ? draft.firstName.trim() : '';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.identity}>
            <Image
              source={
                scheme === 'dark'
                  ? require('../../assets/dark/church-logo.png')
                  : require('../../assets/light/church-logo.png')
              }
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="The Pentecostal Congregation logo"
            />
            <View style={styles.wordmark}>
              <Text style={styles.churchName}>TPC</Text>
              <Text style={styles.caption}>Faith. Family. Purpose.</Text>
            </View>
          </View>

          <MemberMenu />
        </View>

        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>JESUS CHRIST IS THE CORNERSTONE</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {firstName ? `Welcome, ${firstName}` : 'Welcome to TPC'}
          </Text>
          <Text style={styles.subtitle}>Building End Time Disciples.</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open the weekly church service timetable"
          accessibilityState={{ expanded: scheduleExpanded }}
          onPress={() => setScheduleExpanded((value) => !value)}
          style={({ pressed }) => [
            styles.serviceCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.serviceHeading}>
            <Text style={[styles.eyebrow, { color: colors.onPrimary }]}>
              WEEKLY SERVICE
            </Text>
            <Text style={styles.sampleLabel}>Church Schedule</Text>
          </View>

          <Text accessibilityRole="header" style={styles.serviceTitle}>
            {service.name}
          </Text>
          <Text style={styles.serviceDescription}>
            Let us come together to worship, pray and fellowship.
          </Text>

          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetail}>
              <Text style={styles.detailLabel}>DAY</Text>
              <Text style={styles.detailValue}>
                {new Date(service.startsAt).toLocaleDateString('en-NG', {
                  weekday: 'long',
                  timeZone: 'Africa/Lagos',
                })}
              </Text>
            </View>
            <View style={styles.serviceDetail}>
              <Text style={styles.detailLabel}>TIME</Text>
              <Text style={styles.detailValue}>
                {formatAttendanceTime(service.startsAt)} WAT
              </Text>
            </View>
          </View>
          <Text style={styles.scheduleHint}>
            {scheduleExpanded
              ? 'Hide weekly timetable ↑'
              : 'View weekly timetable ↓'}
          </Text>
        </Pressable>

        {scheduleExpanded && (
          <Animated.View
            entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
            exiting={FadeOut.duration(120).reduceMotion(ReduceMotion.System)}
            style={styles.scheduleCard}
          >
            <Text accessibilityRole="header" style={styles.actionTitle}>
              Weekly church services
            </Text>
            <Text style={styles.caption}>
              Demo schedule · The published timetable will come from the church.
            </Text>
            {[
              'Sunday',
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
            ].map((day) => (
              <View key={day} style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>{day}</Text>
                {day === 'Sunday' ? (
                  <Text style={styles.body}>
                    {service.name} · {formatAttendanceTime(service.startsAt)}{' '}
                    WAT
                  </Text>
                ) : (
                  <Text style={styles.caption}>No sample service listed</Text>
                )}
              </View>
            ))}
            <Text style={styles.caption}>
              Authorized admins will manage the live schedule after the backend
              service is connected.
            </Text>
          </Animated.View>
        )}

        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Take part
        </Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open service check-in"
            onPress={() => router.navigate('/(tabs)/attendance')}
            style={({ pressed }) => [
              styles.actionCard,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionTitle}>Check in</Text>
            <Text style={styles.caption}>Be a part of the Fellowship</Text>
            <Text style={styles.actionLink}>Check in →</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open giving"
            onPress={() => router.navigate('/(tabs)/giving')}
            style={({ pressed }) => [
              styles.actionCard,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionTitle}>Give to the LORD</Text>
            <Text style={styles.caption}>Support the work of church</Text>
            <Text style={styles.actionLink}>Explore other Options →</Text>
          </Pressable>
        </View>

        <View style={styles.messageCard}>
          <Text style={styles.eyebrow}>WORDS OF ENCOURAGEMENT</Text>
          <Text accessibilityRole="header" style={styles.messageTitle}>
            There is a place for you in the Lord’s house.
          </Text>
          <Text style={styles.body}>
            There is rest for everyone when we stop carrying life’s burdens
            alone and rely on the Lord’s strength through every season. You are
            standing on a firm foundation and are deeply loved exactly as you
            are.
          </Text>
          <Text style={styles.messageNote}>A sample church message</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.textButton}
            onPress={() => router.navigate('/(tabs)/messages')}
          >
            <Text style={styles.actionLink}>Read church messages →</Text>
          </Pressable>
        </View>

        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Your recent activity
        </Text>
        <View style={styles.activityCard}>
          <Text style={styles.actionTitle}>
            Your Journey with the LORD starts here
          </Text>
          <Text style={styles.body}>
            {records.length} attendance demo record(s) · {data.payments.length}{' '}
            demo checkout(s). Live account activity is not connected.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.caption}>Local demo · No account signed in</Text>
          <Pressable
            accessibilityRole="button"
            onPress={closeDemo}
            style={({ pressed }) => [
              styles.textButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionLink}>Exit preview</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===============================================================
// HOME STYLES
// Use wrapping rows so cards remain usable on narrow screens.
// ===============================================================

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
      padding: 24,
      paddingBottom: 32,
    },
    header: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    identity: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
      gap: 10,
    },
    logo: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.surface,
    },
    wordmark: {
      flexShrink: 1,
    },
    churchName: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '800',
      color: colors.text,
    },
    caption: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.secondaryText,
    },
    previewBadge: {
      borderWidth: 1,
      borderColor: colors.decorativeBorder,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.surface,
    },
    previewText: {
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.link,
    },
    welcome: {
      marginTop: 32,
      marginBottom: 24,
    },
    eyebrow: {
      fontSize: 11,
      lineHeight: 17,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.link,
    },
    title: {
      fontSize: 30,
      lineHeight: 39,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.secondaryText,
      marginTop: 8,
    },
    serviceCard: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      padding: 24,
    },
    serviceHeading: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    sampleLabel: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.onPrimary,
    },
    serviceTitle: {
      fontSize: 30,
      lineHeight: 39,
      fontWeight: '700',
      color: colors.onPrimary,
      marginTop: 20,
    },
    serviceDescription: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.onPrimary,
      marginTop: 8,
    },
    serviceDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 32,
      marginTop: 24,
    },
    scheduleHint: {
      marginTop: 18,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '700',
      color: colors.onPrimary,
    },
    scheduleCard: {
      marginTop: 12,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.decorativeBorder,
      borderRadius: 18,
      backgroundColor: colors.surface,
      gap: 12,
    },
    scheduleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 8,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.decorativeBorder,
    },
    scheduleDay: {
      minWidth: 92,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '700',
      color: colors.text,
    },
    serviceDetail: {
      gap: 4,
    },
    detailLabel: {
      fontSize: 11,
      lineHeight: 17,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.onPrimary,
    },
    detailValue: {
      fontSize: 18,
      lineHeight: 27,
      fontWeight: '700',
      color: colors.onPrimary,
    },
    sectionTitle: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '700',
      color: colors.text,
      marginTop: 28,
      marginBottom: 14,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    actionCard: {
      flexGrow: 1,
      flexBasis: 145,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.decorativeBorder,
      borderRadius: 18,
      backgroundColor: colors.surface,
      gap: 8,
    },
    actionTitle: {
      fontSize: 17,
      lineHeight: 25,
      fontWeight: '700',
      color: colors.text,
    },
    actionLink: {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '600',
      color: colors.link,
    },
    pressed: {
      opacity: 0.7,
    },
    body: {
      fontSize: 15,
      lineHeight: 23,
      color: colors.secondaryText,
    },
    messageCard: {
      marginTop: 28,
      paddingVertical: 8,
      paddingLeft: 18,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      gap: 10,
    },
    messageTitle: {
      fontSize: 22,
      lineHeight: 31,
      fontWeight: '700',
      color: colors.text,
    },
    messageNote: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.secondaryText,
    },
    activityCard: {
      padding: 20,
      borderWidth: 1,
      borderColor: colors.decorativeBorder,
      borderRadius: 18,
      backgroundColor: colors.surface,
      gap: 8,
    },
    footer: {
      marginTop: 28,
      alignItems: 'center',
      gap: 4,
    },
    textButton: {
      minHeight: 44,
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
  });
}
