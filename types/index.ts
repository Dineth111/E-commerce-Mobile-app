// ─── Product ──────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: Category;
  sizes: Size[];
  colors: Color[];
  rating: number;
  reviewCount: number;
  description: string;
  material?: string;
  tags: string[];
  isNew?: boolean;
  isTrending?: boolean;
  isFavorite?: boolean;
  stockCount?: number;
  sizeChart?: SizeChartEntry[];
}

export type Category =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'accessories'
  | 'activewear'
  | 'formal';

export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '6' | '7' | '8' | '9' | '10' | '11';

export interface Color {
  name: string;
  hex: string;
}

export interface SizeChartEntry {
  size: string;
  bust?: number;
  waist?: number;
  hips?: number;
  length?: number;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  product: Product;
  size: Size;
  color: Color;
  quantity: number;
}

// ─── User & Style Profile ─────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  styleProfile?: StyleProfile;
}

export interface StyleProfile {
  bodyType: BodyType;
  preferredStyles: StyleType[];
  colorPalette: ColorPalette;
  budgetRange: BudgetRange;
  favoriteBrands: string[];
  measurements?: UserMeasurements;
  quizCompleted: boolean;
}

export type BodyType = 'pear' | 'apple' | 'hourglass' | 'rectangle' | 'inverted-triangle';
export type StyleType = 'casual' | 'formal' | 'streetwear' | 'bohemian' | 'minimalist' | 'vintage' | 'athleisure' | 'romantic';
export type ColorPalette = 'warm' | 'cool' | 'neutral' | 'bold' | 'pastel' | 'earthy';
export type BudgetRange = 'budget' | 'mid-range' | 'premium' | 'luxury';

export interface UserMeasurements {
  height: number; // cm
  weight: number; // kg
  bust?: number;  // cm
  waist?: number; // cm
  hips?: number;  // cm
}

// ─── Chat / AI ────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: Product[]; // inline product suggestions
  imageUri?: string;    // user uploaded image
}

export interface AIRecommendation {
  productId: string;
  reason: string;
  matchScore: number;
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  shippingAddress?: string;
  trackingNumber?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

// ─── Outfit ───────────────────────────────────────────────────────────────────
export interface OutfitSuggestion {
  id: string;
  name: string;
  products: Product[];
  occasion: string;
}

// ─── Search ───────────────────────────────────────────────────────────────────
export interface SearchFilters {
  category?: Category;
  sizes?: Size[];
  colors?: string[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

export interface SearchResult {
  products: Product[];
  total: number;
  page: number;
}

// ─── Story / Inspiration ──────────────────────────────────────────────────────
export interface Story {
  id: string;
  username: string;
  avatar: string;
  image: string;
  hasNew: boolean;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: number;
  images?: string[];
}
