import { createClient } from '@supabase/supabase-js';
import type { Role } from '../types';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(URL, KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/** Helper: get the current logged-in user's role from the profiles table */
export async function getUserRole(userId: string): Promise<Role | null> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return (data?.role as Role) ?? null;
}
