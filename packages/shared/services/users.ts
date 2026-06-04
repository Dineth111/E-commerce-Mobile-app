import { supabase } from '../supabase/client';
import type { Profile } from '../types';

export async function getUsers(search?: string): Promise<Profile[]> {
  let query = supabase.from('profiles').select('*');

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  query = query.order('full_name', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function getUserById(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Profile;
}

/** Admin only — ban a user */
export async function banUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: true })
    .eq('id', id);
  if (error) throw error;
}

/** Admin only — unban a user */
export async function unbanUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: false })
    .eq('id', id);
  if (error) throw error;
}
