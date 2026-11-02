// ===============================================================
// apps/mobile/components/sermon-player.tsx
// Hand off published sermon media to approved external providers.
// ===============================================================

import { useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { GivingButton, useGivingStyles } from '@/components/giving-ui';

type SermonPlayerProps = {
  youtubeUrl?: string;
  mixlrUrl?: string;
  mediaAvailable?: boolean;
};

// ===============================================================
// EXTERNAL PROVIDER URL CHECKS
// Accept HTTPS links only, and restrict each action to its named provider.
// ===============================================================

function isAllowedProviderUrl(url: string, provider: 'youtube' | 'mixlr') {
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== 'https:' ||
      parsed.username !== '' ||
      parsed.password !== '' ||
      parsed.port !== ''
    )
      return false;
    const hostname = parsed.hostname.toLowerCase();
    const hasContentPath = parsed.pathname.split('/').some(Boolean);

    if (provider === 'youtube') {
      return (
        hasContentPath &&
        (hostname === 'youtube.com' ||
          hostname.endsWith('.youtube.com') ||
          hostname === 'youtu.be')
      );
    }

    return (
      hasContentPath &&
      (hostname === 'mixlr.com' || hostname.endsWith('.mixlr.com'))
    );
  } catch {
    return false;
  }
}

// ===============================================================
// DEMO MEDIA HANDOFFS
// Missing service links stay visible as unavailable demo actions.
// ===============================================================

export default function SermonPlayer({
  youtubeUrl,
  mixlrUrl,
  mediaAvailable = false,
}: SermonPlayerProps) {
  const ui = useGivingStyles();
  const [notice, setNotice] = useState('');

  async function openProvider(
    provider: 'YouTube' | 'Mixlr',
    url: string | undefined,
  ) {
    setNotice('');
    if (!mediaAvailable || !url) {
      setNotice(
        `${provider} playback is unavailable in this demo or after its service window.`,
      );
      return;
    }

    const providerKey = provider === 'YouTube' ? 'youtube' : 'mixlr';
    if (!isAllowedProviderUrl(url, providerKey)) {
      setNotice(
        `This ${provider} link is invalid. Ask the church to update it.`,
      );
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      setNotice(`${provider} could not open. Check your connection and retry.`);
    }
  }

  return (
    <View style={ui.card}>
      <Text style={ui.heading}>Watch or listen to the service</Text>
      <Text style={ui.body}>
        Video opens through YouTube. Audio-only service links open through
        Mixlr. Provider links have not been published to this demo yet.
      </Text>
      <GivingButton
        label="Watch on YouTube"
        onPress={() => void openProvider('YouTube', youtubeUrl)}
      />
      <GivingButton
        label="Listen on Mixlr"
        secondary
        onPress={() => void openProvider('Mixlr', mixlrUrl)}
      />
      {!!notice && (
        <Text accessibilityLiveRegion="polite" style={ui.caption}>
          {notice}
        </Text>
      )}
    </View>
  );
}
