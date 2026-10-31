// ===============================================================
// apps/mobile/app/(tabs)/community.tsx
// Preview invitations, sponsorship, badges and worker schedules.
// ===============================================================

import { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import {
  GivingPage,
  GivingButton,
  GivingChoice,
  givingStyles as ui,
} from '@/components/giving-ui';
import MemberField from '@/components/member-field';
import DemoStatus from '@/components/demo-status';
import { useDemoWorkspace, type Invitation } from '@/store/demo-workspace';
import { useMemberDraft } from '@/store/member-draft';
import { useAttendanceDraft } from '@/store/attendance-draft';
import { communitySection } from '@/utils/demo-lifecycle';
import { formatAttendanceStamp } from '@/utils/attendance';

// ===============================================================
// COMMUNITY DEMO STATE
// ===============================================================

export default function CommunityScreen() {
  const params = useLocalSearchParams<{ section?: string }>();
  const [tab, setTab] = useState(() => communitySection(params.section));
  // Reapply explicit route selection when returning to this mounted tab,
  // including repeated schedule links carrying the same parameter.
  useFocusEffect(
    useCallback(() => {
      setTab(communitySection(params.section));
    }, [params.section]),
  );
  const { data, commit, ready, busy } = useDemoWorkspace();
  const { draft } = useMemberDraft();
  const attendance = useAttendanceDraft();
  const [kind, setKind] = useState<Invitation['kind']>('newcomer');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState('');
  const approved = draft.departmentRequest?.status === 'demoApproved';

  // ===============================================================
  // PREPARE A LOCAL INVITATION OR SPONSORSHIP REQUEST
  // ===============================================================

  async function prepare() {
    if (!name.trim() || !note.trim()) {
      setNotice('Enter a name and a short message or support request.');
      return;
    }
    if (data.invitations.length >= 30) {
      setNotice(
        'Demo invitation limit reached. Reset old records in Settings.',
      );
      return;
    }
    const ok = await commit((p) => ({
      ...p,
      invitations: [
        {
          id: 'INV-' + Date.now(),
          kind,
          name: name.trim(),
          note: note.trim(),
          status: 'prepared',
        },
        ...p.invitations,
      ],
    }));
    if (ok) {
      setName('');
      setNote('');
      setNotice(
        'Prepared on this demo device. Nobody has been contacted and no financial support has been promised.',
      );
    }
  }

  // ===============================================================
  // DEMO BADGE CRITERIA
  // ===============================================================

  const badges = [
    {
      name: 'Community welcome',
      description: 'Complete your local demo profile.',
      earned: !!draft.firstName && !!draft.surname && !!draft.age,
    },
    {
      name: 'Gathering together',
      description: 'Preview a confirmed attendance result.',
      earned: attendance.records.some((r) => r.state === 'confirmed'),
    },
    {
      name: 'Giving with purpose',
      description: 'Complete a successful demo checkout.',
      earned: data.payments.some((p) => p.status === 'successful'),
    },
  ];

  // ===============================================================
  // INVITATIONS, BADGES AND DEPARTMENT SCHEDULES
  // ===============================================================

  return (
    <GivingPage
      title="Church community"
      subtitle="Connect, serve and grow together."
      sectionLabel="COMMUNITY"
    >
      <DemoStatus />
      <View style={ui.wrap}>
        {(
          [
            ['invitations', 'Invitations & sponsorship'],
            ['badges', 'Badges'],
            ['schedule', 'Rosters & schedules'],
          ] as const
        ).map(([value, label]) => (
          <GivingChoice
            key={value}
            label={label}
            selected={tab === value}
            onPress={() => setTab(value)}
          />
        ))}
      </View>
      {tab === 'invitations' && (
        <>
          <View style={ui.card}>
            <Text style={ui.heading}>Invite or support someone</Text>
            <View style={ui.wrap}>
              <GivingChoice
                label="Welcome a newcomer"
                selected={kind === 'newcomer'}
                onPress={() => setKind('newcomer')}
              />
              <GivingChoice
                label="Request financial sponsorship"
                selected={kind === 'sponsorship'}
                onPress={() => setKind('sponsorship')}
              />
            </View>
            <Text style={ui.body}>
              {kind === 'newcomer'
                ? 'Prepare a personal invitation and offer to help someone find their place at church.'
                : 'Describe the support you are requesting. This demo never guarantees funding or asks for bank/card details.'}
            </Text>
            <MemberField
              label={
                kind === 'newcomer'
                  ? 'Newcomer’s name'
                  : 'Name for this request'
              }
              value={name}
              onChangeText={setName}
            />
            <MemberField
              label={
                kind === 'newcomer'
                  ? 'Invitation and support message'
                  : 'Purpose of the sponsorship request'
              }
              value={note}
              onChangeText={setNote}
              maxLength={500}
              multiline
            />
            <GivingButton
              label="Prepare demo request"
              disabled={!ready || busy}
              onPress={() => {
                void prepare();
              }}
            />
          </View>
          {!!notice && (
            <Text accessibilityLiveRegion="polite" style={ui.body}>
              {notice}
            </Text>
          )}
          <Text style={ui.heading}>Prepared requests</Text>
          {!data.invitations.length && (
            <Text style={ui.body}>
              No requests prepared yet. Saved demo requests will appear here.
            </Text>
          )}
          {data.invitations.map((i) => (
            <View key={i.id} style={ui.card}>
              <Text style={ui.heading}>{i.name}</Text>
              <Text style={ui.label}>
                {i.kind === 'newcomer'
                  ? 'Newcomer invitation'
                  : 'Financial sponsorship'}{' '}
                · {i.status === 'prepared' ? 'Prepared locally' : 'Cancelled'}
              </Text>
              <Text style={ui.body}>{i.note}</Text>
              {i.status === 'prepared' && (
                <GivingButton
                  label="Cancel demo request"
                  secondary
                  disabled={busy}
                  onPress={() => {
                    void commit((p) => ({
                      ...p,
                      invitations: p.invitations.map((r) =>
                        r.id === i.id ? { ...r, status: 'cancelled' } : r,
                      ),
                    }));
                  }}
                />
              )}
            </View>
          ))}
        </>
      )}
      {tab === 'badges' && (
        <>
          <Text style={ui.body}>
            Badges below reflect demo activity only. They do not represent
            church recognition or verified participation.
          </Text>
          {badges.map((b) => (
            <View key={b.name} style={ui.card}>
              <Text style={ui.heading}>
                {b.earned ? '✓ ' : ''}
                {b.name}
              </Text>
              <Text style={ui.label}>
                {b.earned ? 'Unlocked in demo' : 'Not unlocked'}
              </Text>
              <Text style={ui.body}>{b.description}</Text>
            </View>
          ))}
        </>
      )}
      {tab === 'schedule' && (
        <>
          {approved ? (
            <>
              <View style={[ui.card, ui.hero]}>
                <Text style={ui.heading}>
                  {draft.departmentRequest?.department} · Demo schedule
                </Text>
                <Text style={ui.heroBody}>
                  Sample Worship Service ·{' '}
                  {formatAttendanceStamp(attendance.service.startsAt)} WAT
                </Text>
                <Text style={ui.heroBody}>
                  Meet the team 30 minutes before service. This is a sample
                  assignment, not a live church roster.
                </Text>
              </View>
              <View style={ui.card}>
                <Text style={ui.heading}>Worker roster</Text>
                <Text style={ui.body}>
                  Sample duty: welcome and team preparation.
                </Text>
                <Text accessibilityLiveRegion="polite" style={ui.label}>
                  Your demo response:{' '}
                  {
                    {
                      unanswered: 'Awaiting your response',
                      accepted: 'Available · Coordinator review pending',
                      unavailable: 'Unavailable',
                      approved: 'Assignment approved (sample)',
                      rejected: 'Assignment not approved (sample)',
                    }[data.roster]
                  }
                </Text>
                <View style={ui.wrap}>
                  <GivingButton
                    label="I’m available (demo)"
                    disabled={!ready || busy}
                    onPress={() => {
                      void commit((p) => ({ ...p, roster: 'accepted' }));
                    }}
                  />
                  <GivingButton
                    label="I’m unavailable (demo)"
                    secondary
                    disabled={!ready || busy}
                    onPress={() => {
                      void commit((p) => ({ ...p, roster: 'unavailable' }));
                    }}
                  />
                </View>
                <Text style={ui.caption}>
                  Preview a coordinator outcome; these controls never grant real
                  worker access:
                </Text>
                <View style={ui.wrap}>
                  <GivingButton
                    label="Preview roster approval"
                    secondary
                    disabled={!ready || busy}
                    onPress={() => {
                      void commit((p) => ({ ...p, roster: 'approved' }));
                    }}
                  />
                  <GivingButton
                    label="Preview roster rejection"
                    secondary
                    disabled={!ready || busy}
                    onPress={() => {
                      void commit((p) => ({ ...p, roster: 'rejected' }));
                    }}
                  />
                </View>
                <Text style={ui.caption}>
                  No coordinator is notified. Real assignments and permissions
                  must come from the server.
                </Text>
              </View>
            </>
          ) : (
            <View style={ui.card}>
              <Text style={ui.heading}>Departmental schedule</Text>
              <Text style={ui.body}>
                No approved department is loaded. In this demo, preview an
                approved request in Profile to explore a sample roster. Real
                departmental schedules require server-approved membership.
              </Text>
              <GivingButton
                label="Open department request"
                onPress={() => router.navigate('/(tabs)/profile')}
              />
            </View>
          )}
        </>
      )}
    </GivingPage>
  );
}
