// ===============================================================
// File: apps/mobile/app/(tabs)/home.tsx
// Description: Member Home screen matching Image 1 with live schedule sync.
// Author: Josiah Ewumi
// ===============================================================

import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import {
  Bell,
  Calendar,
  CalendarPlus,
  Church,
  Gift,
  Heart,
  MapPin,
  Megaphone,
  Play,
  Send,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BrandBackdrop from '@/components/ui/brand-backdrop';
import GoldButton from '@/components/ui/gold-button';
import SectionHeader from '@/components/ui/section-header';
import SurfaceCard from '@/components/ui/surface-card';
import { colors, fonts, palette, radii, shadows } from '@/constants/theme';
import { useHomeData, type HomeAnnouncement } from '@/hooks/use-home-data';

function AnnouncementIcon({
  iconType,
}: {
  iconType: HomeAnnouncement['iconType'];
}) {
  if (iconType === 'church') {
    return <Church size={18} color={palette.goldIcon} strokeWidth={1.9} />;
  }
  if (iconType === 'calendar') {
    return <Calendar size={18} color={palette.goldIcon} strokeWidth={1.9} />;
  }
  if (iconType === 'heart') {
    return <Heart size={18} color={palette.goldIcon} strokeWidth={1.9} />;
  }
  return <Megaphone size={18} color={palette.goldIcon} strokeWidth={1.9} />;
}

export default function HomeScreen() {
  const {
    refreshing,
    refresh,
    greeting,
    firstName,
    photoUri,
    nextService,
    countdown,
    formattedServiceDateTime,
    venueSettings,
    monthlyStats,
    announcements,
    unreadCount,
  } = useHomeData();

  const [directionsVisible, setDirectionsVisible] = useState(false);

  const initials = firstName ? firstName.slice(0, 2).toUpperCase() : '';
  const serviceLocation =
    nextService?.location || venueSettings.defaultLocation || 'Main Auditorium';
  const directionsUrl =
    nextService?.directionsUrl || venueSettings.defaultDirectionsUrl;

  async function handleDirectionsPress() {
    if (directionsUrl) {
      try {
        const supported = await Linking.canOpenURL(directionsUrl);
        if (supported) {
          await Linking.openURL(directionsUrl);
          return;
        }
      } catch {
        // Fall through to venue info sheet
      }
    }
    setDirectionsVisible(true);
  }

  return (
    <BrandBackdrop>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={palette.gold}
              colors={[palette.gold]}
            />
          }
        >
          {/* ===========================================================
              TOP HEADER: BELL, TIME-OF-DAY GREETING, AVATAR
              =========================================================== */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open messages and notifications"
                onPress={() => router.navigate('/(tabs)/messages')}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.pressed,
                ]}
              >
                <Bell
                  size={22}
                  color={palette.textPrimary}
                  strokeWidth={1.85}
                />
                {unreadCount > 0 && <View style={styles.unreadDot} />}
              </Pressable>

              <View style={styles.greetingBlock}>
                <Text style={styles.greetingSub}>{greeting}</Text>
                <Text accessibilityRole="header" style={styles.greetingName}>
                  {firstName || 'Welcome'}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open your profile"
              onPress={() => router.navigate('/(tabs)/profile')}
              style={({ pressed }) => [
                styles.avatarButton,
                shadows.card,
                pressed && styles.pressed,
              ]}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              ) : initials ? (
                <Text style={styles.avatarInitials}>{initials}</Text>
              ) : (
                <User size={20} color={palette.goldIcon} strokeWidth={2} />
              )}
            </Pressable>
          </View>

          {/* ===========================================================
              NEXT SERVICE HERO CARD (LIVE SCHEDULE + COUNTDOWN)
              =========================================================== */}
          <View style={[styles.heroShadowWrap, shadows.hero]}>
            <LinearGradient
              colors={palette.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <Image
                source={require('../../assets/light/hero-worship-overlay.png')}
                style={styles.heroArtwork}
                resizeMode="cover"
                accessible={false}
              />

              <View style={styles.heroTopRow}>
                <View style={styles.eyebrowGroup}>
                  <Text style={styles.heroEyebrow}>NEXT SERVICE</Text>
                  <View style={styles.eyebrowLine} />
                </View>

                {countdown && (
                  <View style={styles.countdownPill}>
                    <Text style={styles.countdownText}>
                      {countdown.badgeLabel}
                    </Text>
                  </View>
                )}
              </View>

              <Text accessibilityRole="header" style={styles.heroTitle}>
                {nextService?.title ?? 'No Upcoming Service'}
              </Text>

              {nextService?.periodLabel && (
                <Text style={styles.heroPeriod}>{nextService.periodLabel}</Text>
              )}

              <View style={styles.heroMetaList}>
                <View style={styles.heroMetaRow}>
                  <Calendar
                    size={15}
                    color="rgba(255,255,255,0.92)"
                    strokeWidth={2}
                  />
                  <Text style={styles.heroMetaText}>
                    {nextService
                      ? formattedServiceDateTime
                      : 'Check back for updated service times'}
                  </Text>
                </View>
                <View style={styles.heroMetaRow}>
                  <MapPin
                    size={15}
                    color="rgba(255,255,255,0.92)"
                    strokeWidth={2}
                  />
                  <Text style={styles.heroMetaText}>{serviceLocation}</Text>
                </View>
              </View>

              <View style={styles.heroActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Check In to service"
                  onPress={() => router.navigate('/(tabs)/scanner')}
                  style={({ pressed }) => [
                    styles.checkInBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Play
                    size={13}
                    color={palette.goldIcon}
                    fill={palette.goldIcon}
                  />
                  <Text style={styles.checkInBtnText}>Check In</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Get directions to service venue"
                  onPress={() => void handleDirectionsPress()}
                  style={({ pressed }) => [
                    styles.directionsBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Send size={13} color={palette.surface} strokeWidth={2} />
                  <Text style={styles.directionsBtnText}>Directions</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>

          {/* ===========================================================
              QUICK ACTIONS
              =========================================================== */}
          <View style={styles.section}>
            <SectionHeader
              title="Quick actions"
              onActionPress={() => router.navigate('/(tabs)/more')}
            />
            <View style={styles.threeColRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.navigate('/(tabs)/giving')}
                style={({ pressed }) => [
                  styles.quickCardWrap,
                  pressed && styles.pressed,
                ]}
              >
                <SurfaceCard style={styles.quickCard}>
                  <Heart size={24} color={palette.goldIcon} strokeWidth={1.8} />
                  <Text style={styles.quickLabel}>Give</Text>
                </SurfaceCard>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.navigate('/(tabs)/history')}
                style={({ pressed }) => [
                  styles.quickCardWrap,
                  pressed && styles.pressed,
                ]}
              >
                <SurfaceCard style={styles.quickCard}>
                  <Users size={24} color={palette.goldIcon} strokeWidth={1.8} />
                  <Text style={styles.quickLabel}>My Giving</Text>
                </SurfaceCard>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.navigate('/(tabs)/attendance')}
                style={({ pressed }) => [
                  styles.quickCardWrap,
                  pressed && styles.pressed,
                ]}
              >
                <SurfaceCard style={styles.quickCard}>
                  <CalendarPlus
                    size={24}
                    color={palette.goldIcon}
                    strokeWidth={1.8}
                  />
                  <Text style={styles.quickLabel}>My Attendance</Text>
                </SurfaceCard>
              </Pressable>
            </View>
          </View>

          {/* ===========================================================
              THIS MONTH STATS
              =========================================================== */}
          <View style={styles.section}>
            <SectionHeader title="This month" />
            <View style={styles.threeColRow}>
              <SurfaceCard style={styles.statCard}>
                <View style={styles.statTop}>
                  <Users size={18} color={palette.goldIcon} strokeWidth={1.8} />
                  <Text style={styles.statLabel}>Services{'\n'}attended</Text>
                </View>
                <Text style={styles.statValue}>
                  {monthlyStats.attendedCount}/{monthlyStats.monthServiceCount}
                </Text>
              </SurfaceCard>

              <SurfaceCard style={styles.statCard}>
                <View style={styles.statTop}>
                  <Gift size={18} color={palette.goldIcon} strokeWidth={1.8} />
                  <Text style={styles.statLabel}>Given</Text>
                </View>
                <Text style={styles.statValue} numberOfLines={1}>
                  ₦{monthlyStats.givenNaira.toLocaleString('en-NG')}
                </Text>
              </SurfaceCard>

              <SurfaceCard style={styles.statCard}>
                <View style={styles.statTop}>
                  <TrendingUp
                    size={18}
                    color={palette.goldIcon}
                    strokeWidth={1.8}
                  />
                  <Text style={styles.statLabel}>Streak</Text>
                </View>
                <Text style={styles.statValue}>
                  {monthlyStats.streakWeeks}{' '}
                  {monthlyStats.streakWeeks === 1 ? 'wk' : 'wks'}
                </Text>
              </SurfaceCard>
            </View>
          </View>

          {/* ===========================================================
              ANNOUNCEMENTS
              =========================================================== */}
          <View style={styles.section}>
            <SectionHeader
              title="Announcements"
              onActionPress={() => router.navigate('/(tabs)/messages')}
            />
            <SurfaceCard style={styles.announcementsCard}>
              {announcements.length === 0 ? (
                <View style={styles.emptyAnnouncements}>
                  <Text style={styles.emptyText}>
                    No announcements posted yet.
                  </Text>
                </View>
              ) : (
                announcements.map((item, idx) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => router.navigate('/(tabs)/messages')}
                    style={({ pressed }) => [
                      styles.announcementRow,
                      idx > 0 && styles.announcementDivider,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.announcementIconCircle}>
                      <AnnouncementIcon iconType={item.iconType} />
                    </View>
                    <View style={styles.announcementBody}>
                      <View style={styles.announcementHeader}>
                        <Text
                          style={styles.announcementTitle}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.announcementTime}>
                          {item.relativeTime}
                        </Text>
                      </View>
                      <Text
                        style={styles.announcementSnippet}
                        numberOfLines={1}
                      >
                        {item.body}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </SurfaceCard>
          </View>
        </ScrollView>

        {/* ===========================================================
            VENUE DIRECTIONS MODAL FALLBACK
            =========================================================== */}
        <Modal
          visible={directionsVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDirectionsVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <SurfaceCard style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Service Venue</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close venue details"
                  onPress={() => setDirectionsVisible(false)}
                  hitSlop={8}
                >
                  <X size={20} color={palette.textSecondary} />
                </Pressable>
              </View>
              <Text style={styles.modalChurch}>{venueSettings.churchName}</Text>
              <Text style={styles.modalVenue}>{serviceLocation}</Text>
              {venueSettings.defaultAddress && (
                <Text style={styles.modalAddress}>
                  {venueSettings.defaultAddress}
                </Text>
              )}
              <GoldButton
                label="Close"
                onPress={() => setDirectionsVisible(false)}
                style={{ marginTop: 18 }}
              />
            </SurfaceCard>
          </View>
        </Modal>
      </SafeAreaView>
    </BrandBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  unreadDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: palette.canvas,
  },
  greetingBlock: {
    flexShrink: 1,
  },
  greetingSub: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 18,
    color: palette.textSecondary,
  },
  greetingName: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  avatarButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 2,
    borderColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: palette.goldText,
  },
  heroShadowWrap: {
    borderRadius: radii.hero,
    marginBottom: 22,
  },
  heroCard: {
    borderRadius: radii.hero,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroArtwork: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '82%',
    opacity: 0.42,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eyebrowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  heroEyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    letterSpacing: 1.1,
    color: 'rgba(255,255,255,0.92)',
  },
  eyebrowLine: {
    width: 36,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  countdownPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
  },
  countdownText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: palette.surface,
  },
  heroTitle: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 25,
    lineHeight: 31,
    color: palette.surface,
    letterSpacing: -0.3,
  },
  heroPeriod: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.86)',
  },
  heroMetaList: {
    marginTop: 12,
    gap: 6,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroMetaText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.95)',
  },
  heroActions: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  checkInBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: radii.pill,
    backgroundColor: palette.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 14,
  },
  checkInBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: palette.textPrimary,
  },
  directionsBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: radii.pill,
    backgroundColor: palette.whiteOverlay,
    borderWidth: 1,
    borderColor: palette.whiteOverlayBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 14,
  },
  directionsBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: palette.surface,
  },
  section: {
    marginBottom: 22,
  },
  threeColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCardWrap: {
    flex: 1,
  },
  quickCard: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 88,
  },
  quickLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    lineHeight: 16,
    color: palette.textPrimary,
    textAlign: 'center',
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 88,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statLabel: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 14,
    color: palette.textSecondary,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: palette.textPrimary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  announcementsCard: {
    overflow: 'hidden',
  },
  emptyAnnouncements: {
    padding: 18,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: palette.textSecondary,
  },
  announcementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  announcementDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F3ECE0',
  },
  announcementIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementBody: {
    flex: 1,
    gap: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  announcementTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: palette.textPrimary,
  },
  announcementTime: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: palette.textMuted,
  },
  announcementSnippet: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: palette.textSecondary,
  },
  pressed: {
    opacity: 0.72,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: palette.textPrimary,
  },
  modalChurch: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: palette.goldText,
  },
  modalVenue: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: palette.textPrimary,
  },
  modalAddress: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
  },
});
