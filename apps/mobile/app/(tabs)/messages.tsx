// ===============================================================
// apps/mobile/app/(tabs)/messages.tsx
// Browse church samples and saved read/unread state.
// ===============================================================

import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View, Pressable } from 'react-native';
import {
  GivingPage,
  GivingButton,
  GivingChoice,
  GivingSheet,
  givingStyles as ui,
} from '@/components/giving-ui';
import DemoStatus from '@/components/demo-status';
import { DEMO_MESSAGES } from '@/constants/messages';
import { useDemoWorkspace } from '@/store/demo-workspace';
type Message = (typeof DEMO_MESSAGES)[number];

// ===============================================================
// MESSAGE FILTERS AND SAVED READ STATE
// ===============================================================

export default function MessagesScreen() {
  const { data, commit, ready, busy } = useDemoWorkspace();
  const [tab, setTab] = useState<'church' | 'notifications'>('church');
  const [selected, setSelected] = useState<Message | null>(null);
  const [unread, setUnread] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const records = DEMO_MESSAGES.filter(
    (m) =>
      (tab === 'church'
        ? ['announcements', 'weekly'].includes(m.type)
        : data.preferences[m.type]) &&
      (!unread || !data.readIds.includes(m.id)),
  );

  // ===============================================================
  // OPEN A MESSAGE AND SAVE ITS READ STATE
  // ===============================================================

  function open(m: Message) {
    setSelected(m);
    void commit((p) => ({ ...p, readIds: [...new Set([...p.readIds, m.id])] }));
  }

  // ===============================================================
  // CHURCH MESSAGES AND NOTIFICATION INTERFACE
  // ===============================================================

  return (
    <GivingPage
      title="Messages & notifications"
      subtitle="Church news, encouragement and updates in one place."
      sectionLabel="MESSAGES"
    >
      <DemoStatus />
      <View style={ui.wrap}>
        <GivingChoice
          label="Church messages"
          selected={tab === 'church'}
          onPress={() => setTab('church')}
        />
        <GivingChoice
          label="Notifications"
          selected={tab === 'notifications'}
          onPress={() => setTab('notifications')}
        />
        <GivingChoice
          label="Unread only"
          selected={unread}
          onPress={() => setUnread((p) => !p)}
        />
      </View>
      <Text style={ui.caption}>
        All content below is sample content. Preferences apply to the
        notification tab.
      </Text>
      {loadError ? (
        <View style={ui.card}>
          <Text accessibilityRole="alert" style={ui.error}>
            Demo loading-error state. Your saved messages have not been deleted.
          </Text>
          <GivingButton
            label="Retry demo loading"
            onPress={() => setLoadError(false)}
          />
        </View>
      ) : records.length ? (
        records.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityLabel={
              m.title + (data.readIds.includes(m.id) ? ', read' : ', unread')
            }
            disabled={!ready || busy}
            style={({ pressed }) => [ui.card, pressed && ui.pressed]}
            onPress={() => open(m)}
          >
            <Text style={ui.caption}>
              {m.date} · {data.readIds.includes(m.id) ? 'Read' : 'Unread'}
            </Text>
            <Text style={ui.heading}>{m.title}</Text>
            <Text numberOfLines={2} style={ui.body}>
              {m.body}
            </Text>
            <Text style={ui.link}>Read message →</Text>
          </Pressable>
        ))
      ) : (
        <View style={ui.card}>
          <Text style={ui.heading}>You’re all caught up</Text>
          <Text style={ui.body}>
            Change the unread filter or your notification preferences to see
            more sample messages.
          </Text>
        </View>
      )}
      <GivingButton
        label="Mark visible messages as read"
        secondary
        disabled={!ready || busy || !records.length}
        onPress={() => {
          void commit((p) => ({
            ...p,
            readIds: [...new Set([...p.readIds, ...records.map((m) => m.id)])],
          }));
        }}
      />
      <GivingButton
        label="Notification preferences"
        secondary
        onPress={() => router.navigate('/(tabs)/settings')}
      />
      <GivingButton
        label="Preview loading error"
        secondary
        onPress={() => setLoadError(true)}
      />
      <GivingSheet
        title={selected?.title || 'Message'}
        visible={!!selected}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <Text style={ui.caption}>{selected.date}</Text>
            <Text style={ui.body}>{selected.body}</Text>
            <GivingButton
              label="Mark as unread"
              secondary
              disabled={!ready || busy}
              onPress={() => {
                void commit((p) => ({
                  ...p,
                  readIds: p.readIds.filter((id) => id !== selected.id),
                }));
                setSelected(null);
              }}
            />
          </>
        )}
      </GivingSheet>
    </GivingPage>
  );
}
