import type { Product, SearchFilters, SearchResult, Category } from '@/types';
import { MOCK_PRODUCTS } from '@/constants/mockData';

// ─── Get All Products ─────────────────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  await delay(300);
  return MOCK_PRODUCTS;
}

// ─── Get Product By ID ────────────────────────────────────────────────────────
export async function getProductById(id: string): Promise<Product | null> {
  await delay(200);
  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
}

// ─── Get Trending Products ────────────────────────────────────────────────────
export async function getTrendingProducts(): Promise<Product[]> {
  await delay(250);
  return MOCK_PRODUCTS.filter((p) => p.isTrending).slice(0, 8);
}

// ─── Get New Arrivals ─────────────────────────────────────────────────────────
export async function getNewArrivals(): Promise<Product[]> {
  await delay(200);
  return MOCK_PRODUCTS.filter((p) => p.isNew).slice(0, 8);
}

// ─── Get Products By Category ─────────────────────────────────────────────────
export async function getProductsByCategory(category: Category): Promise<Product[]> {
  await delay(300);
  return MOCK_PRODUCTS.filter((p) => p.category === category);
}

// ─── Search Products ──────────────────────────────────────────────────────────
export async function searchProducts(
  query: string,
  filters?: SearchFilters,
  page = 1
): Promise<SearchResult> {
  await delay(400);

  let results = MOCK_PRODUCTS;

  // Text search
  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
    );
  }

  // Apply filters
  if (filters) {
    if (filters.category) results = results.filter((p) => p.category === filters.category);
    if (filters.brands?.length) results = results.filter((p) => filters.brands!.includes(p.brand));
    if (filters.minPrice !== undefined) results = results.filter((p) => p.price >= filters.minPrice!);
    if (filters.maxPrice !== undefined) results = results.filter((p) => p.price <= filters.maxPrice!);
    if (filters.minRating !== undefined) results = results.filter((p) => p.rating >= filters.minRating!);
    if (filters.sizes?.length) {
      results = results.filter((p) => p.sizes.some((s) => filters.sizes!.includes(s)));
    }
  }

  const pageSize = 12;
  const start = (page - 1) * pageSize;
  return {
    products: results.slice(start, start + pageSize),
    total: results.length,
    page,
  };
}

// ─── Get Autocomplete Suggestions ────────────────────────────────────────────
export async function getAutocompleteSuggestions(query: string): Promise<string[]> {
  await delay(150);
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const suggestions = new Set<string>();
  MOCK_PRODUCTS.forEach((p) => {
    if (p.name.toLowerCase().includes(q)) suggestions.add(p.name);
    if (p.brand.toLowerCase().includes(q)) suggestions.add(p.brand);
    p.tags.forEach((t) => { if (t.toLowerCase().includes(q)) suggestions.add(t); });
  });
  return Array.from(suggestions).slice(0, 6);
}

// ─── Get Products For Recommendations ────────────────────────────────────────
export async function getRecommendedProducts(productIds: string[]): Promise<Product[]> {
  await delay(200);
  if (!productIds.length) return MOCK_PRODUCTS.slice(0, 6);
  const found = productIds.map((id) => MOCK_PRODUCTS.find((p) => p.id === id)).filter(Boolean) as Product[];
  return found.length ? found : MOCK_PRODUCTS.slice(0, 6);
}

// ─── Helper ───────────────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
