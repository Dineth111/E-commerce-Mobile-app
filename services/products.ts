import type { Product, SearchFilters, SearchResult, Category } from '@/types';
import { supabase } from '@/services/supabase';

// Helper to map Supabase snake_case columns to our frontend camelCase types
const mapSupabaseProduct = (row: any): Product => ({
  id: row.id,
  name: row.name,
  brand: row.brand,
  price: Number(row.price),
  originalPrice: row.original_price ? Number(row.original_price) : undefined,
  images: row.images,
  category: row.category as Category,
  sizes: row.sizes,
  colors: row.colors, // jsonb gets parsed automatically by supabase-js
  rating: Number(row.rating),
  reviewCount: row.review_count,
  description: row.description,
  material: row.material,
  tags: row.tags,
  isNew: row.is_new,
  isTrending: row.is_trending,
  stockCount: row.stock_count,
});

// ─── Get All Products ─────────────────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*');
  if (error) throw error;
  return data.map(mapSupabaseProduct);
}

// ─── Get Product By ID ────────────────────────────────────────────────────────
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }
  return data ? mapSupabaseProduct(data) : null;
}

// ─── Get Trending Products ────────────────────────────────────────────────────
export async function getTrendingProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').eq('is_trending', true).limit(8);
  if (error) throw error;
  return data.map(mapSupabaseProduct);
}

// ─── Get New Arrivals ─────────────────────────────────────────────────────────
export async function getNewArrivals(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').eq('is_new', true).limit(8);
  if (error) throw error;
  return data.map(mapSupabaseProduct);
}

// ─── Get Products By Category ─────────────────────────────────────────────────
export async function getProductsByCategory(category: Category): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').eq('category', category);
  if (error) throw error;
  return data.map(mapSupabaseProduct);
}

// ─── Search Products ──────────────────────────────────────────────────────────
export async function searchProducts(
  query: string,
  filters?: SearchFilters,
  page = 1
): Promise<SearchResult> {
  let queryBuilder = supabase.from('products').select('*', { count: 'exact' });

  // Text search using full text search or ilike (using ilike across name and brand for simplicity here)
  if (query.trim()) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,brand.ilike.%${query}%`);
  }

  // Apply filters
  if (filters) {
    if (filters.category) queryBuilder = queryBuilder.eq('category', filters.category);
    if (filters.brands?.length) queryBuilder = queryBuilder.in('brand', filters.brands);
    if (filters.minPrice !== undefined) queryBuilder = queryBuilder.gte('price', filters.minPrice);
    if (filters.maxPrice !== undefined) queryBuilder = queryBuilder.lte('price', filters.maxPrice);
    if (filters.minRating !== undefined) queryBuilder = queryBuilder.gte('rating', filters.minRating);
    if (filters.sizes?.length) {
      // Postgres array intersection
      queryBuilder = queryBuilder.overlaps('sizes', filters.sizes);
    }
  }

  const pageSize = 12;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, error, count } = await queryBuilder.range(start, end);

  if (error) throw error;

  return {
    products: data.map(mapSupabaseProduct),
    total: count ?? 0,
    page,
  };
}

// ─── Get Autocomplete Suggestions ────────────────────────────────────────────
export async function getAutocompleteSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from('products')
    .select('name')
    .ilike('name', `%${query}%`)
    .limit(6);

  if (error) throw error;
  return Array.from(new Set(data.map((p) => p.name)));
}

// ─── Get Products For Recommendations ────────────────────────────────────────
export async function getRecommendedProducts(productIds: string[]): Promise<Product[]> {
  if (!productIds.length) {
    const { data } = await supabase.from('products').select('*').limit(6);
    return (data || []).map(mapSupabaseProduct);
  }

  const { data, error } = await supabase.from('products').select('*').in('id', productIds);
  if (error) throw error;
  return data.map(mapSupabaseProduct);
}
