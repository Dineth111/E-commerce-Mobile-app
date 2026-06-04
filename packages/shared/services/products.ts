import { supabase } from '../supabase/client';
import type { Product } from '../types';

interface ProductFilters {
  category?: string;
  is_active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  let query = supabase.from('products').select('*');

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProductById(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Product;
}

/** Admin only — create or update a product */
export async function upsertProduct(product: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .upsert(product)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

/** Admin only — delete a product */
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

/** Admin only — toggle product active/inactive */
export async function toggleProductActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_active: active })
    .eq('id', id);
  if (error) throw error;
}
