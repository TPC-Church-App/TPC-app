// ===============================================================
// File: apps/mobile/app/(tabs)/profile.tsx
// Description: Member profile with structured names, address, photo persistence, and sign-out.
// Author: Josiah Ewumi
// ===============================================================

import { router, useFocusEffect } from 'expo-router';
import { LogOut, Settings } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import DepartmentRequest from '@/components/department-request';
import {
  GivingButton,
  GivingChoice,
  GivingPage,
  givingStyles as ui,
} from '@/components/giving-ui';
import MemberField from '@/components/member-field';
import ProfilePhoto from '@/components/profile-photo';
import { colors, fonts, palette } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useMemberDraft } from '@/store/member-draft';
import { profileError } from '@/utils/member-demo';

type ProfileFields = {
  firstName: string;
  middleName: string;
  surname: string;
  age: string;
  phone: string;
  address: string;
};

function splitFullName(fullName: string) {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { first: '', middle: '', last: '' };
  if (tokens.length === 1) return { first: tokens[0], middle: '', last: '' };
  if (tokens.length === 2)
    return { first: tokens[0], middle: '', last: tokens[1] };
  return {
    first: tokens[0],
    middle: tokens.slice(1, -1).join(' '),
    last: tokens[tokens.length - 1],
  };
}

export default function ProfileScreen() {
  const {
    draft,
    updateDraft,
    ready,
    canReset,
    retryLoad,
    busy: profileBusy,
    savedProfile,
    storageError,
    saveProfile,
    loadSavedProfile,
    closeDemo,
  } = useMemberDraft();

  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signedInUserId, setSignedInUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');

  const [accountProfile, setAccountProfile] = useState<ProfileFields>({
    firstName: '',
    middleName: '',
    surname: '',
    age: '',
    phone: '',
    address: '',
  });

  const [fields, setFields] = useState<ProfileFields>({
    firstName: '',
    middleName: '',
    surname: '',
    age: '',
    phone: '',
    address: '',
  });

  const loadAccount = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setSignedInUserId(null);
        setUserEmail('');
        return;
      }

      setSignedInUserId(user.id);
      setUserEmail(user.email ?? '');

      const metadata = user.user_metadata ?? {};
      const explicitFirst =
        typeof metadata.first_name === 'string'
          ? metadata.first_name.trim()
          : '';
      const explicitMiddle =
        typeof metadata.middle_name === 'string'
          ? metadata.middle_name.trim()
          : '';
      const explicitSurname =
        typeof metadata.surname === 'string' ? metadata.surname.trim() : '';

      const [profileRes, memberRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('members')
          .select('address')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const rawFull =
        (typeof metadata.full_name === 'string' && metadata.full_name) ||
        (typeof profileRes.data?.full_name === 'string' &&
          profileRes.data.full_name) ||
        '';
      const split = splitFullName(rawFull);

      setAccountProfile({
        firstName: explicitFirst || split.first,
        middleName: explicitMiddle || split.middle,
        surname: explicitSurname || split.last,
        age: typeof metadata.age === 'string' ? metadata.age : '',
        phone:
          (typeof metadata.phone === 'string' && metadata.phone) ||
          (typeof profileRes.data?.phone === 'string' &&
            profileRes.data.phone) ||
          user.phone ||
          '',
        address:
          (typeof memberRes.data?.address === 'string' &&
            memberRes.data.address) ||
          (typeof metadata.address === 'string' && metadata.address) ||
          '',
      });
    } catch {
      // Retain local draft fallback when offline
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAccount();
    }, [loadAccount]),
  );

  const displayedProfile: ProfileFields = {
    firstName: accountProfile.firstName || draft.firstName,
    middleName: accountProfile.middleName,
    surname: accountProfile.surname || draft.surname,
    age: accountProfile.age || draft.age,
    phone: accountProfile.phone,
    address: accountProfile.address,
  };

  const fullDisplayName =
    [
      displayedProfile.firstName,
      displayedProfile.middleName,
      displayedProfile.surname,
    ]
      .filter(Boolean)
      .join(' ') || 'Welcome to TPC';

  const initials = [displayedProfile.firstName, displayedProfile.surname]
    .filter(Boolean)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');

  function startEdit() {
    setFields(displayedProfile);
    setEditing(true);
    setNotice('');
    setNoticeError(false);
  }

  async function saveProfileEdits() {
    const err = profileError(fields.firstName, fields.surname, fields.age);
    if (err) {
      setNotice(err);
      setNoticeError(true);
      return;
    }

    const tFirst = fields.firstName.trim();
    const tMiddle = fields.middleName.trim();
    const tSurname = fields.surname.trim();
    const tAge = fields.age.trim();
    const tPhone = fields.phone.trim();
    const tAddress = fields.address.trim();
    const fullName = [tFirst, tMiddle, tSurname].filter(Boolean).join(' ');

    setSaving(true);
    setNotice('');
    setNoticeError(false);

    updateDraft({
      firstName: tFirst,
      surname: tSurname,
      age: tAge,
    });

    if (signedInUserId) {
      try {
        const { error: authErr } = await supabase.auth.updateUser({
          data: {
            first_name: tFirst,
            middle_name: tMiddle || null,
            surname: tSurname,
            full_name: fullName,
            age: tAge,
            phone: tPhone || undefined,
            address: tAddress || undefined,
          },
        });
        if (authErr) throw authErr;

        await Promise.allSettled([
          supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', signedInUserId),
          supabase
            .from('members')
            .update({ address: tAddress || null })
            .eq('user_id', signedInUserId),
        ]);

        setAccountProfile({
          firstName: tFirst,
          middleName: tMiddle,
          surname: tSurname,
          age: tAge,
          phone: tPhone,
          address: tAddress,
        });
        setEditing(false);
        setNotice('Your profile has been updated.');
      } catch {
        setNoticeError(true);
        setNotice('Could not sync profile changes to the server right now.');
      } finally {
        setSaving(false);
      }
      return;
    }

    const ok = await saveProfile();
    setSaving(false);
    setEditing(false);
    setNoticeError(!ok);
    setNotice(
      ok
        ? 'Profile saved on this device.'
        : 'Profile was not saved. Check your entries.',
    );
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // Proceed to clear local preview
    }
    closeDemo();
    router.replace('/');
  }

  return (
    <GivingPage
      title="Your Profile"
      subtitle="Manage your member identity, photo, and church connection."
      sectionLabel="PROFILE"
    >
      <View style={ui.card}>
        <ProfilePhoto initials={initials} />
        <Text style={styles.memberName}>{fullDisplayName}</Text>
        {!!userEmail && <Text style={styles.memberEmail}>{userEmail}</Text>}
      </View>

      {!ready && !storageError && (
        <Text style={ui.body}>Loading saved profile…</Text>
      )}

      {!signedInUserId && savedProfile && (
        <GivingButton
          label="Load saved device demo profile"
          secondary
          disabled={!ready || saving || profileBusy}
          onPress={() => {
            loadSavedProfile();
            setEditing(false);
            setNoticeError(false);
            setNotice('Loaded saved device demo profile.');
          }}
        />
      )}

      <View style={ui.card}>
        <Text style={ui.heading}>Personal Details</Text>

        {editing ? (
          <>
            <MemberField
              label="First Name"
              value={fields.firstName}
              placeholder="First Name"
              textContentType="givenName"
              autoComplete="name-given"
              autoCapitalize="words"
              onChangeText={(v) => setFields((p) => ({ ...p, firstName: v }))}
            />
            <MemberField
              label="Middle Name (Optional)"
              value={fields.middleName}
              placeholder="Middle Name"
              textContentType="middleName"
              autoComplete="name-middle"
              autoCapitalize="words"
              onChangeText={(v) => setFields((p) => ({ ...p, middleName: v }))}
            />
            <MemberField
              label="Surname"
              value={fields.surname}
              placeholder="Surname"
              textContentType="familyName"
              autoComplete="name-family"
              autoCapitalize="words"
              onChangeText={(v) => setFields((p) => ({ ...p, surname: v }))}
            />
            <MemberField
              label="Phone Number"
              value={fields.phone}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              onChangeText={(v) => setFields((p) => ({ ...p, phone: v }))}
            />
            <MemberField
              label="Age"
              value={fields.age}
              placeholder="Age (4 or above)"
              maxLength={3}
              keyboardType="number-pad"
              textContentType="none"
              autoComplete="off"
              onChangeText={(v) => setFields((p) => ({ ...p, age: v }))}
            />
            <MemberField
              label="Address"
              value={fields.address}
              placeholder="Residential Address"
              textContentType="fullStreetAddress"
              autoComplete="street-address"
              autoCapitalize="words"
              multiline
              onChangeText={(v) => setFields((p) => ({ ...p, address: v }))}
            />

            <GivingButton
              label={saving ? 'Saving…' : 'Save Changes'}
              disabled={saving}
              onPress={() => void saveProfileEdits()}
            />
            <GivingButton
              label="Cancel"
              secondary
              disabled={saving}
              onPress={() => {
                setEditing(false);
                setNotice('');
                setNoticeError(false);
              }}
            />
          </>
        ) : (
          <View style={styles.detailList}>
            <DetailRow
              label="First Name"
              value={displayedProfile.firstName || 'Not provided'}
            />
            <DetailRow
              label="Middle Name"
              value={displayedProfile.middleName || 'Optional'}
            />
            <DetailRow
              label="Surname"
              value={displayedProfile.surname || 'Not provided'}
            />
            <DetailRow
              label="Phone"
              value={displayedProfile.phone || 'Not provided'}
            />
            <DetailRow
              label="Age"
              value={displayedProfile.age || 'Not provided'}
            />
            <DetailRow
              label="Address"
              value={displayedProfile.address || 'Not provided'}
            />

            <View style={{ marginTop: 6 }}>
              <GivingButton label="Edit Profile" onPress={startEdit} />
            </View>
          </View>
        )}

        <Text style={[ui.label, { marginTop: 8 }]}>
          Church connection (optional)
        </Text>
        <View style={ui.wrap}>
          {(
            [
              ['regular', 'Regular attendee'],
              ['visiting', 'Visiting'],
              ['firstVisit', 'First visit'],
              ['', 'Not selected'],
            ] as const
          ).map(([v, label]) => (
            <GivingChoice
              key={v}
              label={label}
              selected={draft.attendance === v}
              onPress={() => updateDraft({ attendance: v })}
            />
          ))}
        </View>
      </View>

      {!!notice && (
        <Text
          accessibilityLiveRegion="polite"
          style={noticeError ? ui.error : styles.noticeSuccess}
        >
          {notice}
        </Text>
      )}

      {!!storageError && (
        <>
          <Text accessibilityRole="alert" style={ui.error}>
            {storageError}
          </Text>
          <GivingButton
            label="Retry loading saved profile"
            secondary
            disabled={!canReset || profileBusy}
            onPress={retryLoad}
          />
        </>
      )}

      <Text style={ui.caption}>
        {Platform.OS === 'web'
          ? 'Profile photos persist in browser storage on this device.'
          : 'Profile photos are saved locally in encrypted/private app storage.'}
      </Text>

      <Text style={ui.heading}>Departments</Text>
      <DepartmentRequest />

      <View style={styles.footerActions}>
        <GivingButton
          label="Settings & Notification Preferences"
          secondary
          onPress={() => router.navigate('/(tabs)/settings')}
        />
        <GivingButton
          label={signedInUserId ? 'Sign Out' : 'Exit Preview'}
          secondary
          onPress={() => void handleSignOut()}
        />
      </View>
      <View style={styles.metaHintRow}>
        <Settings size={14} color={palette.textMuted} />
        <LogOut size={14} color={palette.textMuted} />
      </View>
    </GivingPage>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  memberName: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    lineHeight: 26,
    color: palette.inkNavy,
    textAlign: 'center',
  },
  memberEmail: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: -6,
  },
  detailList: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECE0',
  },
  detailLabel: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: palette.textSecondary,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: palette.textPrimary,
  },
  noticeSuccess: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.success,
  },
  footerActions: {
    gap: 10,
  },
  metaHintRow: {
    height: 0,
    opacity: 0,
    flexDirection: 'row',
  },
});
