import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY!;

let customStorage;

if (Platform.OS !== 'web') {
  customStorage = {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
    removeItem: (key: string) => AsyncStorage.removeItem(key),
  };
} else if (typeof window !== 'undefined') {
  customStorage = window.localStorage;
} else {
  customStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Role = 'admin' | 'customer';

export async function getUserRole(userId: string): Promise<Role | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
  
  return (data?.role as Role) ?? null;
}
