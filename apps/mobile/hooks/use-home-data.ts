// ===============================================================
// File: apps/mobile/hooks/use-home-data.ts
// Description: Live Supabase home data, default TPC schedules fallback, and persisted avatar.
// Author: Josiah Ewumi
// ===============================================================

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DEMO_MESSAGES } from '@/constants/messages';
import { supabase } from '@/lib/supabase';
import { getStoredProfilePhoto } from '@/services/profile-photo-storage';
import { useAttendanceDraft } from '@/store/attendance-draft';
import { useMemberDraft } from '@/store/member-draft';
import {
  DEFAULT_TPC_SCHEDULES,
  formatRelativeTime,
  formatServiceDateTime,
  getGreetingForHour,
  getServiceCountdown,
  resolveNextService,
  type LiveServiceRecord,
  type RecurringScheduleRecord,
  type ResolvedNextService,
} from '@/utils/service-schedule';

export type HomeAnnouncement = {
  id: string;
  title: string;
  body: string;
  iconType: 'megaphone' | 'church' | 'calendar' | 'heart';
  relativeTime: string;
};

export type HomeMonthlyStats = {
  attendedCount: number;
  monthServiceCount: number;
  givenNaira: number;
  streakWeeks: number;
};

export type ChurchVenueSettings = {
  churchName: string;
  defaultLocation: string;
  defaultAddress: string | null;
  defaultDirectionsUrl: string | null;
};

function isMissingTableError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /does not exist|Could not find the table/i.test(error.message ?? '')
  );
}

function getWatMonthBounds(nowMs: number) {
  const watOffsetMs = 60 * 60_000;
  const shifted = new Date(nowMs + watOffsetMs);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const startIso = new Date(
    Date.UTC(year, month, 1) - watOffsetMs,
  ).toISOString();
  const nextMonthStartIso = new Date(
    Date.UTC(year, month + 1, 1) - watOffsetMs,
  ).toISOString();
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startIso, nextMonthStartIso, startDate, endDate };
}

function computeWeeklyStreak(
  checkedInTimestamps: string[],
  nowMs: number,
): number {
  if (checkedInTimestamps.length === 0) return 0;
  const weekMs = 7 * 24 * 60 * 60_000;
  const getWeekKey = (ms: number) => {
    const d = new Date(ms + 60 * 60_000);
    const day = d.getUTCDay();
    const sunday = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day),
    );
    return Math.floor(sunday.getTime() / weekMs);
  };

  const activeWeeks = new Set(
    checkedInTimestamps
      .map((ts) => Date.parse(ts))
      .filter((ms) => Number.isFinite(ms))
      .map(getWeekKey),
  );

  const currentWeek = getWeekKey(nowMs);
  let cursor = activeWeeks.has(currentWeek) ? currentWeek : currentWeek - 1;
  let streak = 0;

  while (activeWeeks.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

export function useHomeData() {
  const { draft, entryMode, demoAccess } = useMemberDraft();
  const { service: demoService } = useAttendanceDraft();

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [storedPhotoUri, setStoredPhotoUri] = useState<string | null>(null);
  const [services, setServices] = useState<LiveServiceRecord[]>([]);
  const [schedules, setSchedules] = useState<RecurringScheduleRecord[]>([]);
  const [announcements, setAnnouncements] = useState<
    Array<{
      id: string;
      title: string;
      body: string;
      icon_type: 'megaphone' | 'church' | 'calendar' | 'heart';
      published_at: string;
    }>
  >([]);
  const [venueSettings, setVenueSettings] = useState<ChurchVenueSettings>({
    churchName: 'The Pentecostal Congregation',
    defaultLocation: 'Main Auditorium',
    defaultAddress: null,
    defaultDirectionsUrl: null,
  });
  const [monthlyStats, setMonthlyStats] = useState<HomeMonthlyStats>({
    attendedCount: 0,
    monthServiceCount: 4,
    givenNaira: 0,
    streakWeeks: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [usingDevFallback, setUsingDevFallback] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const ticker = setInterval(() => {
      if (mountedRef.current) setNowMs(Date.now());
    }, 30_000);
    return () => {
      mountedRef.current = false;
      clearInterval(ticker);
    };
  }, []);

  const refreshPhotoOnly = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      const uri = await getStoredProfilePhoto(uid);
      if (mountedRef.current) setStoredPhotoUri(uri);
    } catch {
      // Ignore storage read errors
    }
  }, []);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);

      try {
        const currentNow = Date.now();
        const { startIso, nextMonthStartIso, startDate, endDate } =
          getWatMonthBounds(currentNow);

        const [
          sessionRes,
          servicesRes,
          schedulesRes,
          settingsRes,
          announcementsRes,
        ] = await Promise.all([
          supabase.auth.getSession(),
          supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('service_date', { ascending: true })
            .order('start_time', { ascending: true }),
          supabase.from('service_schedules').select('*').eq('is_active', true),
          supabase
            .from('church_settings')
            .select(
              'church_name, default_location, default_address, default_directions_url',
            )
            .eq('id', 'default')
            .maybeSingle(),
          supabase
            .from('announcements')
            .select('id, title, body, icon_type, published_at')
            .eq('is_active', true)
            .order('published_at', { ascending: false })
            .limit(4),
        ]);

        if (!mountedRef.current) return;

        const liveServices = Array.isArray(servicesRes.data)
          ? (servicesRes.data as LiveServiceRecord[])
          : [];
        setServices(liveServices);

        if (!schedulesRes.error && Array.isArray(schedulesRes.data)) {
          setSchedules(schedulesRes.data as RecurringScheduleRecord[]);
        } else if (isMissingTableError(schedulesRes.error)) {
          setSchedules([]);
        }

        if (!settingsRes.error && settingsRes.data) {
          setVenueSettings({
            churchName:
              settingsRes.data.church_name || 'The Pentecostal Congregation',
            defaultLocation:
              settingsRes.data.default_location || 'Main Auditorium',
            defaultAddress: settingsRes.data.default_address ?? null,
            defaultDirectionsUrl:
              settingsRes.data.default_directions_url ?? null,
          });
        }

        if (!announcementsRes.error && Array.isArray(announcementsRes.data)) {
          setAnnouncements(
            announcementsRes.data as Array<{
              id: string;
              title: string;
              body: string;
              icon_type: 'megaphone' | 'church' | 'calendar' | 'heart';
              published_at: string;
            }>,
          );
        }

        const monthDatedCount = liveServices.filter(
          (s) => s.service_date >= startDate && s.service_date <= endDate,
        ).length;

        const user = sessionRes.data.session?.user;
        const savedPhoto = await getStoredProfilePhoto(user?.id ?? null);
        if (mountedRef.current) setStoredPhotoUri(savedPhoto);

        if (user) {
          setUsingDevFallback(false);
          const explicitFirst =
            typeof user.user_metadata?.first_name === 'string'
              ? user.user_metadata.first_name.trim()
              : '';
          const metaFullFirst =
            typeof user.user_metadata?.full_name === 'string'
              ? (user.user_metadata.full_name.trim().split(/\s+/)[0] ?? '')
              : '';

          const eightWeeksAgoIso = new Date(
            currentNow - 56 * 24 * 60 * 60_000,
          ).toISOString();

          const [profileRes, attendanceRes, offeringsRes, notificationsRes] =
            await Promise.all([
              supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .maybeSingle(),
              supabase
                .from('attendance')
                .select('checked_in_at')
                .eq('user_id', user.id)
                .gte('checked_in_at', eightWeeksAgoIso),
              supabase
                .from('offerings')
                .select('amount')
                .eq('user_id', user.id)
                .eq('status', 'successful')
                .gte('created_at', startIso)
                .lt('created_at', nextMonthStartIso),
              supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false),
            ]);

          if (!mountedRef.current) return;

          const profileFirst =
            typeof profileRes.data?.full_name === 'string'
              ? (profileRes.data.full_name.trim().split(/\s+/)[0] ?? '')
              : '';
          setFirstName(explicitFirst || metaFullFirst || profileFirst);

          const timestamps = Array.isArray(attendanceRes.data)
            ? attendanceRes.data
                .map((row) => row.checked_in_at)
                .filter((v): v is string => typeof v === 'string')
            : [];

          const monthAttended = timestamps.filter(
            (ts) => ts >= startIso && ts < nextMonthStartIso,
          ).length;

          const givenSum = Array.isArray(offeringsRes.data)
            ? offeringsRes.data.reduce(
                (acc, row) => acc + (Number(row.amount) || 0),
                0,
              )
            : 0;

          setMonthlyStats({
            attendedCount: monthAttended,
            monthServiceCount: Math.max(4, monthDatedCount),
            givenNaira: Math.round(givenSum),
            streakWeeks: computeWeeklyStreak(timestamps, currentNow),
          });
          setUnreadCount(notificationsRes.count ?? 0);
        } else {
          setFirstName(entryMode === 'register' ? draft.firstName.trim() : '');
          setUsingDevFallback(__DEV__ && demoAccess);
          setMonthlyStats({
            attendedCount: 0,
            monthServiceCount: Math.max(4, monthDatedCount),
            givenNaira: 0,
            streakWeeks: 0,
          });
          setUnreadCount(__DEV__ && demoAccess ? 2 : 0);
        }
      } catch {
        if (mountedRef.current) {
          setUsingDevFallback(__DEV__ && demoAccess);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [demoAccess, draft.firstName, entryMode],
  );

  useEffect(() => {
    void loadData(false);

    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      void loadData(false);
    });

    const channel = supabase
      .channel('tpc-home-live-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => void loadData(false),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_schedules' },
        () => void loadData(false),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => void loadData(false),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'church_settings' },
        () => void loadData(false),
      )
      .subscribe();

    return () => {
      authSub.subscription.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void refreshPhotoOnly();
      void loadData(false);
    }, [loadData, refreshPhotoOnly]),
  );

  const resolvedNextService: ResolvedNextService | null = useMemo(() => {
    const live = resolveNextService(services, schedules, nowMs);
    if (live) return live;

    // Fallback to TPC's confirmed recurring Sunday & Wednesday timetable
    const defaultSchedule = resolveNextService(
      [],
      DEFAULT_TPC_SCHEDULES,
      nowMs,
    );
    if (defaultSchedule) return defaultSchedule;

    if (usingDevFallback && demoService) {
      const start = new Date(demoService.startsAt);
      const end = new Date(demoService.endsAt);
      const watStart = new Date(start.getTime() + 60 * 60_000);
      const watEnd = new Date(end.getTime() + 60 * 60_000);

      return resolveNextService(
        [
          {
            id: demoService.id,
            title: demoService.name,
            service_date: watStart.toISOString().slice(0, 10),
            start_time: watStart.toISOString().slice(11, 19),
            end_time: watEnd.toISOString().slice(11, 19),
            location: venueSettings.defaultLocation,
            directions_url: venueSettings.defaultDirectionsUrl,
            is_active: true,
          },
        ],
        [],
        nowMs,
      );
    }

    return null;
  }, [
    demoService,
    nowMs,
    schedules,
    services,
    usingDevFallback,
    venueSettings.defaultDirectionsUrl,
    venueSettings.defaultLocation,
  ]);

  const countdown = useMemo(
    () =>
      resolvedNextService
        ? getServiceCountdown(resolvedNextService, nowMs)
        : null,
    [nowMs, resolvedNextService],
  );

  const formattedServiceDateTime = useMemo(
    () =>
      resolvedNextService ? formatServiceDateTime(resolvedNextService) : '',
    [resolvedNextService],
  );

  const homeAnnouncements: HomeAnnouncement[] = useMemo(() => {
    if (announcements.length > 0) {
      return announcements.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        iconType: item.icon_type || 'megaphone',
        relativeTime: formatRelativeTime(item.published_at, nowMs),
      }));
    }

    if (usingDevFallback) {
      return DEMO_MESSAGES.slice(0, 2).map((msg, idx) => ({
        id: msg.id,
        title: msg.title,
        body: msg.body,
        iconType: idx === 0 ? 'megaphone' : 'church',
        relativeTime: idx === 0 ? '2h ago' : '1d ago',
      }));
    }

    return [];
  }, [announcements, nowMs, usingDevFallback]);

  return {
    loading,
    refreshing,
    refresh: () => void loadData(true),
    greeting: getGreetingForHour(nowMs),
    firstName: firstName || draft.firstName.trim(),
    photoUri: storedPhotoUri ?? draft.photoUri,
    nextService: resolvedNextService,
    countdown,
    formattedServiceDateTime,
    venueSettings,
    monthlyStats,
    announcements: homeAnnouncements,
    unreadCount,
  };
}
