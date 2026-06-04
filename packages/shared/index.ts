// ─── Types ─────────────────────────────────────────────────────────────────
export * from './types';

// ─── Supabase Client ───────────────────────────────────────────────────────
export { supabase, getUserRole } from './supabase/client';

// ─── Services ──────────────────────────────────────────────────────────────
export * as productService from './services/products';
export * as orderService from './services/orders';
export * as userService from './services/users';
export * as promotionService from './services/promotions';
export * as analyticsService from './services/analytics';
