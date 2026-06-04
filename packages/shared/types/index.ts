// ─── Roles ────────────────────────────────────────────────────────────────
export type Role = 'admin' | 'customer';

// ─── Product ──────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  brand: string;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: Record<string, number>; // e.g. { S: 10, M: 5, L: 0 }
  is_active: boolean;
  created_at: string;
}

// ─── Order ────────────────────────────────────────────────────────────────
export interface OrderItem {
  product_id: string;
  product_name: string;
  size: string;
  qty: number;
  price: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Address {
  street: string;
  city: string;
  province: string;
  postal_code: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  address: Address;
  promo_code?: string;
  created_at: string;
}

// ─── User Profile ──────────────────────────────────────────────────────────
export interface StyleQuiz {
  body_type: string;
  preferred_styles: string[];
  color_palette: string[];
  budget_range: string;
  favorite_brands: string[];
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  style_quiz: StyleQuiz;
  is_banned: boolean;
  role: Role;
  avatar_url?: string;
}

// ─── Promotions ────────────────────────────────────────────────────────────
export interface Promotion {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
}

// ─── AI Settings ───────────────────────────────────────────────────────────
export interface AISettings {
  id: string;
  system_prompt: string;
  features: {
    chat: boolean;
    visual_search: boolean;
    recommendations: boolean;
    size_advisor: boolean;
  };
  updated_at: string;
}

// ─── Analytics ─────────────────────────────────────────────────────────────
export interface DailyRevenue {
  date: string;
  revenue: number;
  order_count: number;
}

export interface TotalStats {
  total_revenue: number;
  total_orders: number;
  total_users: number;
  avg_order_value: number;
}

export interface TopProduct {
  product: Product;
  sales_count: number;
  revenue: number;
}

export interface OrderStatusCount {
  status: OrderStatus;
  count: number;
}
