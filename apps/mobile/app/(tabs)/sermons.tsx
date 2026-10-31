// ===============================================================
// apps/mobile/app/(tabs)/sermons.tsx
// Browse sample teachings and open playback controls.
// ===============================================================

import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  GivingPage,
  GivingButton,
  GivingChoice,
  givingStyles as ui,
} from '@/components/giving-ui';
import SermonPlayer from '@/components/sermon-player';
const sermons = [
  {
    id: 'faith',
    title: 'A life of faith',
    speaker: 'Sample teaching',
    scripture: 'Hebrews 11:1',
    summary:
      'A sample outline about trusting God, prayer and living out faith in everyday choices.',
  },
  {
    id: 'community',
    title: 'Growing together',
    speaker: 'Sample teaching',
    scripture: 'Hebrews 10:24–25',
    summary:
      'A sample outline about encouragement, fellowship and serving our neighbours.',
  },
];

// ===============================================================
// TEACHING SELECTION AND SESSION BOOKMARKS
// ===============================================================

export default function SermonsScreen() {
  const [id, setId] = useState('faith');
  const [query, setQuery] = useState<'all' | 'saved'>('all');
  const [saved, setSaved] = useState<string[]>([]);
  const chosen = sermons.find((s) => s.id === id)!;
  const rows = sermons.filter((s) => query === 'all' || saved.includes(s.id));

  // ===============================================================
  // TEACHING LIBRARY AND PLAYER INTERFACE
  // ===============================================================

  return (
    <GivingPage
      title="Sermons & teaching"
      subtitle="Make space for the Word through the week."
      sectionLabel="SERMONS"
    >
      <Text style={ui.caption}>
        Demo library · No real sermon recordings are connected. Bookmarks last
        for this screen session.
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
      {rows.length ? (
        rows.map((s) => (
          <View key={s.id} style={ui.card}>
            <Text style={ui.heading}>{s.title}</Text>
            <Text style={ui.body}>
              {s.speaker} · {s.scripture}
            </Text>
            <GivingButton
              label={id === s.id ? 'Selected teaching' : 'Open teaching'}
              secondary
              onPress={() => setId(s.id)}
            />
            <GivingButton
              label={
                saved.includes(s.id) ? 'Remove bookmark' : 'Bookmark teaching'
              }
              secondary
              onPress={() =>
                setSaved((v) =>
                  v.includes(s.id) ? v.filter((i) => i !== s.id) : [...v, s.id],
                )
              }
            />
          </View>
        ))
      ) : (
        <Text style={ui.body}>
          No bookmarked teachings yet. Open All teachings to choose one.
        </Text>
      )}
      <View style={ui.card}>
        <Text style={ui.heading}>{chosen.title}</Text>
        <Text style={ui.body}>{chosen.summary}</Text>
      </View>
      <SermonPlayer key={id} />
    </GivingPage>
  );
}
