import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.link,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Sign In' }} />
      <Stack.Screen name="register" options={{ title: 'Register' }} />
      <Stack.Screen name="otp" options={{ title: 'Verification' }} />
    </Stack>
  );
}