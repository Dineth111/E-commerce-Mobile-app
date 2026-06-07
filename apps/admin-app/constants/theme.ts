// ─── Design Tokens for Fashion Admin App ─────────────────────────────────────

export const Colors = {
  // Backgrounds
  bg: '#0A0A0F',
  surface: '#141419',
  surface2: '#1E1E28',
  border: '#2A2A35',

  // Text
  text: '#F0F0F5',
  textMuted: '#8B8B9A',
  textDim: '#5A5A6A',

  // Accent
  accent: '#C0392B',
  accentLight: '#E74C3C',

  // Status colors
  pending: '#F59E0B',
  confirmed: '#378ADD',
  shipped: '#1D9E75',
  delivered: '#639922',
  cancelled: '#E24B4A',

  // Stat card colors
  blue: '#378ADD',
  green: '#22C55E',
  amber: '#F59E0B',
  red: '#C0392B',

  // Role colors
  adminRole: '#C0392B',
  customerRole: '#378ADD',
  purple: '#8B5CF6',
};

export const statusColor: Record<string, string> = {
  pending: Colors.pending,
  confirmed: Colors.confirmed,
  shipped: Colors.shipped,
  delivered: Colors.delivered,
  cancelled: Colors.cancelled,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};
