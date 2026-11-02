// apps/mobile/app/(auth)/register.tsx
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    Keyboard.dismiss();
    if (!firstName || !surname || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            first_name: firstName.trim(),
            surname: surname.trim(),
          },
        },
      });

      if (error) throw error;

      // If email confirmation is off, they are logged in immediately
      if (data.session) {
        router.replace('/(tabs)/home');
      } else {
        alert('Registration successful! Please check your email to verify.');
        router.push('/(auth)/login');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={styles.title}>Create an account</Text>
          <Text style={styles.description}>Join the TPC community today.</Text>

          <Text style={styles.label}>First name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor={colors.secondaryText}
          />

          <Text style={styles.label}>Surname</Text>
          <TextInput
            style={styles.input}
            value={surname}
            onChangeText={setSurname}
            placeholder="Surname"
            placeholderTextColor={colors.secondaryText}
          />

          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={colors.secondaryText}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password (min 6 chars)"
            secureTextEntry
            autoCapitalize="none"
            placeholderTextColor={colors.secondaryText}
          />

          {error !== '' && <Text style={styles.errorText}>{error}</Text>}

          <Pressable onPress={handleRegister} disabled={loading} style={styles.button}>
            <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Sign Up'}</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/(auth)/login')} style={styles.switchButton}>
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 24, width: '100%', maxWidth: 480, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 8 },
  description: { fontSize: 16, color: colors.secondaryText, marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 16, fontSize: 16, marginBottom: 16 },
  errorText: { color: colors.error, fontSize: 14, marginBottom: 12 },
  button: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary, marginTop: 8 },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  switchButton: { minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 16, fontWeight: '600', color: colors.link },
});