import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TEMPORARY HARDCODE FOR APK TESTING
const supabaseUrl = 'https://eqkicyqqwwrjpikcsbas.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa2ljeXFxd3dyanBpa2NzYmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MTAzMzEsImV4cCI6MjEwODE4NjMzMX0.rQ1EwEmpN0d6OIjrQaDa-KpRjScw8Ma1EptiuQG82jM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});