// ===============================================================
// apps/mobile/app/(tabs)/sermons.tsx
// Browse sermon notes and preview YouTube/Mixlr media handoffs.
// ===============================================================

import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  GivingButton,
  GivingChoice,
  GivingPage,
  useGivingStyles,
} from '@/components/giving-ui';
import SermonPlayer from '@/components/sermon-player';

const sermons = [
  {
    id: 'faith',
    title: 'A life of faith',
    theme: 'Trusting God through every season',
    speaker: 'Pastor · sample entry',
    passages: ['Hebrews 11:1', 'Proverbs 3:5–6'],
    notes:
      'Faith shapes how we pray, make daily choices and encourage one another. These notes are a sample outline and are not a transcript of a recorded service.',
  },
  {
    id: 'community',
    title: 'Growing together',
    theme: 'Encouragement, fellowship and service',
    speaker: 'Pastor · sample entry',
    passages: ['Hebrews 10:24–25', 'Galatians 6:2'],
    notes:
      'Christian community grows through shared worship, practical care and faithful service. This sample outline will be replaced by the approved weekly message.',
  },
];

// ===============================================================
// TEACHING SELECTION AND SESSION BOOKMARKS
// ===============================================================

export default function SermonsScreen() {
  const ui = useGivingStyles();
  const [id, setId] = useState('faith');
  const [query, setQuery] = useState<'all' | 'saved'>('all');
  const [saved, setSaved] = useState<string[]>([]);
  const chosen = sermons.find((sermon) => sermon.id === id) ?? sermons[0];
  const rows = sermons.filter(
    (sermon) => query === 'all' || saved.includes(sermon.id),
  );

  // ===============================================================
  // MESSAGE NOTES AND MEDIA PREVIEW
  // ===============================================================

  return (
    <GivingPage
      title="Sermons & teaching"
      subtitle="Message notes, Bible passages and service media."
      sectionLabel="SERMONS"
    >
      <View style={ui.card}>
        <Text style={ui.eyebrow}>DEMO LIBRARY</Text>
        <Text style={ui.body}>
          These sample entries show the planned format. No pastor message or
          published recording is connected yet.
        </Text>
        <View style={ui.wrap}>
          <GivingChoice
            label="All teachings"
            selected={query === 'all'}
            onPress={() => setQuery('all')}
          />
          <GivingChoice
            label="Bookmarked"
            selected={query === 'saved'}
            onPress={() => setQuery('saved')}
          />
        </View>
      </View>

      {rows.length ? (
        rows.map((sermon) => (
          <View key={sermon.id} style={ui.card}>
            <Text style={ui.heading}>{sermon.title}</Text>
            <Text style={ui.body}>{sermon.theme}</Text>
            <Text style={ui.caption}>
              {sermon.speaker} · {sermon.passages.join(' · ')}
            </Text>
            <GivingButton
              label={id === sermon.id ? 'Selected message' : 'Open message'}
              secondary
              onPress={() => setId(sermon.id)}
            />
            <GivingButton
              label={
                saved.includes(sermon.id)
                  ? 'Remove bookmark'
                  : 'Bookmark message'
              }
              secondary
              onPress={() =>
                setSaved((current) =>
                  current.includes(sermon.id)
                    ? current.filter((savedId) => savedId !== sermon.id)
                    : [...current, sermon.id],
                )
              }
            />
          </View>
        ))
      ) : (
        <View style={ui.card}>
          <Text style={ui.heading}>No bookmarks yet</Text>
          <Text style={ui.body}>
            Choose All teachings and bookmark a message to find it here.
          </Text>
        </View>
      )}

      <View style={ui.card}>
        <Text style={ui.eyebrow}>SUNDAY MESSAGE · SAMPLE</Text>
        <Text style={ui.caption}>
          Service date: awaiting a published church schedule.
        </Text>
        <Text accessibilityRole="header" style={ui.heading}>
          {chosen.title}
        </Text>
        <Text style={ui.label}>Theme: {chosen.theme}</Text>
        <Text style={ui.body}>{chosen.speaker}</Text>
        <Text style={ui.label}>Bible passages</Text>
        <Text style={ui.body}>{chosen.passages.join(' · ')}</Text>
        <Text style={ui.label}>Pastor’s notes</Text>
        <Text style={ui.body}>{chosen.notes}</Text>
        <Text style={ui.caption}>
          Service recordings and audio links follow a 24-hour period after the
          service ends. This screen previews that policy; server expiry is not
          connected.
        </Text>
      </View>

      <SermonPlayer />
    </GivingPage>
  );
}
