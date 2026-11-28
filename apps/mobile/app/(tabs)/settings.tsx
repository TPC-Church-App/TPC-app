// apps/mobile/app/(tabs)/settings.tsx
import { useEffect, useState } from 'react';
import { Text, View, Switch } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  GivingPage,
  GivingButton,
  givingStyles as ui,
} from '@/components/giving-ui';
import { colors } from '@/constants/theme';

export default function SettingsScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <GivingPage title="Settings" subtitle="Loading...">
        <Text style={ui.body}>Loading...</Text>
      </GivingPage>
    );
  }

  return (
    <GivingPage
      title="Settings"
      subtitle="Manage your account and preferences."
      sectionLabel="SETTINGS"
    >
      <View style={ui.card}>
        <Text style={ui.heading}>Profile Details</Text>
        <Text style={ui.label}>Name: {profile?.full_name || 'N/A'}</Text>
        <Text style={ui.label}>Phone: {profile?.phone || 'N/A'}</Text>
        <Text style={ui.label}>Role: {profile?.role || 'member'}</Text>
      </View>

      <View style={ui.card}>
        <Text style={ui.heading}>Notification Preferences</Text>
        <View style={ui.row}>
          <Text style={[ui.label, { flex: 1 }]}>
            Receive Push Notifications
          </Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ true: colors.link }}
          />
        </View>
      </View>

      <GivingButton label="Sign Out" secondary onPress={handleSignOut} />
    </GivingPage>
  );
}
