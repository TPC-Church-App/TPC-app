// ===============================================================
// apps/mobile/lib/supabase.ts
// Configure the mobile Supabase client with persistent user sessions.
// ===============================================================

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  createChunkedSecureStorage,
  createMigratingAuthStorage,
} from '@/utils/chunked-secure-storage';

// ===============================================================
// PUBLIC CLIENT CONFIGURATION
// Keep service-role credentials out of the mobile application.
// ===============================================================

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;
const authStorage =
  Platform.OS === 'web'
    ? AsyncStorage
    : createMigratingAuthStorage(createChunkedSecureStorage(SecureStore), {
        getItem: (key) => AsyncStorage.getItem(key),
        setItem: (key, value) => AsyncStorage.setItem(key, value),
        removeItem: (key) => AsyncStorage.removeItem(key),
      });

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
