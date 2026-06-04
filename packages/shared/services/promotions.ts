import { supabase } from '../supabase/client';
import type { Promotion } from '../types';

export async function getPromotions(): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Promotion[];
}

export async function createPromotion(
  promo: Omit<Promotion, 'id' | 'used_count'>
): Promise<Promotion> {
  const { data, error } = await supabase
    .from('promotions')
    .insert({ ...promo, used_count: 0 })
    .select()
    .single();
  if (error) throw error;
  return data as Promotion;
}

export async function togglePromotion(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('promotions')
    .update({ is_active: active })
    .eq('id', id);
  if (error) throw error;
}

export async function deletePromotion(id: string): Promise<void> {
  const { error } = await supabase.from('promotions').delete().eq('id', id);
  if (error) throw error;
}

/** Customer app — validate a promo code */
export async function validatePromoCode(code: string): Promise<Promotion | null> {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  const promo = data as Promotion;
  const now = new Date();
  const expiry = new Date(promo.expires_at);

  if (expiry < now) return null;
  if (promo.used_count >= promo.max_uses) return null;

  return promo;
}
