// ===============================================================
// apps/mobile/components/department-request.tsx
// Preview review outcomes without granting any real departmental authority.
// ===============================================================

import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, {
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';
import BrandedLoader from '@/components/branded-loader';
import MemberField from '@/components/member-field';
import {
  GivingButton,
  GivingSheet,
  givingStyles as ui,
} from '@/components/giving-ui';
import { useMemberDraft } from '@/store/member-draft';

// ===============================================================
// LOCAL DEPARTMENT REQUEST STATE
// ===============================================================

export default function DepartmentRequest() {
  const { draft, updateDraft } = useMemberDraft();
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(false);
  const request = draft.departmentRequest;

  // ===============================================================
  // PREPARE A DEMO REQUEST WITHOUT GRANTING ACCESS
  // ===============================================================

  function submit() {
    const name = department.trim();
    if (!name || name.length > 100) {
      setError('Enter a department name (up to 100 characters).');
      return;
    }
    updateDraft({
      departmentRequest: { department: name, status: 'demoPending' },
    });
    setError('');
  }
  const approved = request?.status === 'demoApproved';
  const rejected = request?.status === 'demoRejected';

  // ===============================================================
  // REQUEST SUMMARY AND REVIEW OUTCOME INTERFACE
  // ===============================================================

  return (
    <>
      <Animated.View
        layout={LinearTransition.duration(240).reduceMotion(
          ReduceMotion.System,
        )}
        style={ui.card}
      >
        {request ? (
          <>
            <Text style={ui.heading}>{request.department}</Text>
            <Text accessibilityLiveRegion="polite" style={ui.label}>
              Demo request ·{' '}
              {approved
                ? 'Approved'
                : rejected
                  ? 'Not approved'
                  : 'Approval pending'}
            </Text>
            <GivingButton
              label="View request progress"
              secondary
              onPress={() => setProgress(true)}
            />
            {approved && (
              <GivingButton
                label="View sample departmental schedule"
                onPress={() =>
                  router.navigate({
                    pathname: '/(tabs)/community',
                    params: { section: 'schedule' },
                  })
                }
              />
            )}
            <Text style={ui.caption}>
              Preview outcome controls below do not grant real membership or
              staff access.
            </Text>
            <View style={ui.wrap}>
              {(['demoPending', 'demoApproved', 'demoRejected'] as const).map(
                (status) => (
                  <GivingButton
                    key={status}
                    label={
                      status === 'demoPending'
                        ? 'Preview pending'
                        : status === 'demoApproved'
                          ? 'Preview approval'
                          : 'Preview rejection'
                    }
                    secondary
                    onPress={() =>
                      updateDraft({ departmentRequest: { ...request, status } })
                    }
                  />
                ),
              )}
            </View>
            <GivingButton
              label={
                rejected ? 'Start a new demo request' : 'Cancel demo request'
              }
              secondary
              onPress={() => {
                updateDraft({ departmentRequest: null });
                setDepartment('');
              }}
            />
          </>
        ) : (
          <>
            <Text style={ui.heading}>Find your place to serve</Text>
            <Text style={ui.body}>
              Departmental access and schedules require admin approval. Ordinary
              app access never requires this approval.
            </Text>
            <MemberField
              label="Department name"
              value={department}
              maxLength={100}
              onChangeText={setDepartment}
            />
            {!!error && (
              <Text accessibilityRole="alert" style={ui.error}>
                {error}
              </Text>
            )}
            <Text style={ui.caption}>
              Demo only · This will not contact an admin.
            </Text>
            <GivingButton label="Request approval" onPress={submit} />
          </>
        )}
      </Animated.View>
      <BrandedLoader
        visible={progress && !!request && !rejected}
        success={approved}
        label={approved ? 'Demo approval received' : 'Approval pending'}
        onClose={() => setProgress(false)}
        closeLabel="Back to profile"
      >
        <Text style={ui.heading}>{request?.department}</Text>
        <Text style={ui.body}>
          {approved
            ? 'This previews an approved request. Real access must come from the server.'
            : 'Your demo request is in process. No real request was submitted and no review time is available.'}
        </Text>
      </BrandedLoader>
      <GivingSheet
        title="Department request not approved"
        visible={progress && rejected}
        onClose={() => setProgress(false)}
      >
        <Text style={ui.body}>
          Sample outcome: more information is needed about your preferred
          department. You can start another demo request or speak with a
          department representative when live review is available.
        </Text>
      </GivingSheet>
    </>
  );
}
