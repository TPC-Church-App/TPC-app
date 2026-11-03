// ===============================================================
// apps/mobile/app/(tabs)/profile.tsx
// Show account metadata with editable device-only profile details.
// ===============================================================

// Saved profiles belong to this demo device, not to the contact entered at login.
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  GivingPage,
  GivingButton,
  GivingChoice,
  givingStyles as ui,
} from '@/components/giving-ui';
import ProfilePhoto from '@/components/profile-photo';
import DepartmentRequest from '@/components/department-request';
import MemberField from '@/components/member-field';
import { useMemberDraft } from '@/store/member-draft';
import { profileError } from '@/utils/member-demo';
import { supabase } from '@/lib/supabase';

// ===============================================================
// PROFILE DRAFT AND EDIT STATE
// ===============================================================

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
  const [saving, setSaving] = useState(false);
  const [accountProfile, setAccountProfile] = useState({
    firstName: '',
    surname: '',
    age: '',
  });
  const [fields, setFields] = useState({
    firstName: draft.firstName,
    surname: draft.surname,
    age: draft.age,
  });

  useEffect(() => {
    let active = true;
    void supabase.auth
      .getSession()
      .then(({ data: sessionData }) => {
        if (!active) return;
        const metadata = sessionData.session?.user.user_metadata;
        const fullName =
          typeof metadata?.full_name === 'string' ? metadata.full_name : '';
        const [first, ...rest] = fullName.trim().split(/\s+/);
        setAccountProfile({
          firstName: first ?? '',
          surname: rest.join(' '),
          age: typeof metadata?.age === 'string' ? metadata.age : '',
        });
      })
      .catch(() => {
        // Keep the existing device preview when no auth session can be read.
      });
    return () => {
      active = false;
    };
  }, []);

  const displayedProfile = {
    firstName: draft.firstName || accountProfile.firstName,
    surname: draft.surname || accountProfile.surname,
    age: draft.age || accountProfile.age,
  };

  // ===============================================================
  // PROFILE EDIT AND SAVE ACTIONS
  // ===============================================================

  function edit() {
    setFields({
      firstName: displayedProfile.firstName,
      surname: displayedProfile.surname,
      age: displayedProfile.age,
    });
    setEditing(true);
    setNotice('');
  }
  async function save() {
    setSaving(true);
    const ok = await saveProfile();
    setSaving(false);
    setNotice(
      ok
        ? 'Profile saved on this demo device.'
        : 'Profile was not saved. Check the message below.',
    );
  }

  // ===============================================================
  // PROFILE, PHOTO AND DEPARTMENT INTERFACE
  // ===============================================================

  return (
    <GivingPage
      title="Your profile"
      subtitle="A place to belong. A faith to live."
      sectionLabel="PROFILE"
    >
      <View style={ui.card}>
        <ProfilePhoto />
        <Text style={ui.heading}>
          {[displayedProfile.firstName, displayedProfile.surname]
            .filter(Boolean)
            .join(' ') || 'Welcome to TPC'}
        </Text>
        <Text style={ui.caption}>
          Account name comes from sign-up details; edits and photos remain a
          device preview until profile sync is connected.
        </Text>
      </View>
      {!ready && !storageError && (
        <Text style={ui.body}>Loading saved profile…</Text>
      )}
      {savedProfile && (
        <GivingButton
          label="Load saved device demo profile"
          secondary
          disabled={!ready || saving || profileBusy}
          onPress={() => {
            loadSavedProfile();
            setEditing(false);
            setNotice(
              'Loaded the device demo profile. This does not verify who owns the phone or email.',
            );
          }}
        />
      )}
      <View style={ui.card}>
        <Text style={ui.heading}>About you</Text>
        {editing ? (
          <>
            <MemberField
              label="First name"
              value={fields.firstName}
              onChangeText={(v) => setFields((p) => ({ ...p, firstName: v }))}
            />
            <MemberField
              label="Surname"
              value={fields.surname}
              onChangeText={(v) => setFields((p) => ({ ...p, surname: v }))}
            />
            <MemberField
              label="Age"
              value={fields.age}
              maxLength={3}
              keyboardType="number-pad"
              onChangeText={(v) => setFields((p) => ({ ...p, age: v }))}
            />
            <GivingButton
              label="Apply profile changes"
              onPress={() => {
                const error = profileError(
                  fields.firstName,
                  fields.surname,
                  fields.age,
                );
                if (error) {
                  setNotice(error);
                  return;
                }
                updateDraft({
                  ...fields,
                  firstName: fields.firstName.trim(),
                  surname: fields.surname.trim(),
                });
                setEditing(false);
                setNotice(
                  'Changes applied. Save this demo profile to keep them after reload.',
                );
              }}
            />
            <GivingButton
              label="Cancel editing"
              secondary
              onPress={() => {
                setEditing(false);
                setNotice('');
              }}
            />
          </>
        ) : (
          <>
            <Text style={ui.body}>
              First name: {displayedProfile.firstName || 'Not provided'}
            </Text>
            <Text style={ui.body}>
              Surname: {displayedProfile.surname || 'Not provided'}
            </Text>
            <Text style={ui.body}>
              Age: {displayedProfile.age || 'Not provided'}
            </Text>
            <GivingButton label="Edit profile" onPress={edit} />
          </>
        )}
        <Text style={ui.label}>Church connection (optional)</Text>
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
        <GivingButton
          label={saving ? 'Saving…' : 'Save demo profile and photo'}
          disabled={!ready || saving || editing || profileBusy}
          onPress={save}
        />
      </View>
      {!!notice && (
        <Text accessibilityLiveRegion="polite" style={ui.body}>
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
          ? 'Web photos remain in this session; profile text can be saved in browser storage.'
          : 'Saved demo details use encrypted device storage. The photo stays in app files.'}{' '}
        No account is created. Save again after changing your department
        request.
      </Text>
      <Text style={ui.heading}>Departments</Text>
      <DepartmentRequest />
      <GivingButton
        label="Save department demo changes"
        secondary
        disabled={!ready || saving || editing}
        onPress={save}
      />
      <GivingButton
        label="Settings and notification preferences"
        secondary
        onPress={() => router.navigate('/(tabs)/settings')}
      />
      <GivingButton label="Exit preview" secondary onPress={closeDemo} />
    </GivingPage>
  );
}
