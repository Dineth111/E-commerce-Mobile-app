// ─── Color Palette ────────────────────────────────────────────────────────────
export const COLORS = {
  // Primary rose/pink
  primary: '#E91E8C',
  primaryLight: '#F37BBD',
  primaryDark: '#C01870',

  // Backgrounds (dark mode first)
  background: '#0A0A0F',
  surface: '#141419',
  surface2: '#1E1E28',
  surface3: '#252530',

  // Borders
  border: '#2A2A35',
  borderLight: '#3A3A48',

  // Text
  foreground: '#F0F0F5',
  foregroundSecondary: '#C8C8D5',
  muted: '#8B8B9A',
  mutedLight: '#6B6B7A',

  // Semantic
  success: '#22C55E',
  successBg: '#14532D22',
  warning: '#F59E0B',
  warningBg: '#78350F22',
  error: '#EF4444',
  errorBg: '#7F1D1D22',
  info: '#3B82F6',

  // Gradient stops
  gradientStart: '#E91E8C',
  gradientMid: '#9B59B6',
  gradientEnd: '#3B82F6',

  // Glassmorphism
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.08)',

  // Overlay
  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.4)',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 40,
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primary: {
    shadowColor: '#E91E8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: {
    shadowColor: '#E91E8C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
} as const;

// ─── Animation ────────────────────────────────────────────────────────────────
export const ANIMATION = {
  spring: { damping: 15, stiffness: 150, mass: 1 },
  springFast: { damping: 20, stiffness: 300, mass: 0.8 },
  duration: { fast: 150, normal: 250, slow: 400 },
} as const;

// ─── Layout ───────────────────────────────────────────────────────────────────
export const LAYOUT = {
  tabBarHeight: 72,
  headerHeight: 60,
  productCardWidth: 168,
  productCardHeight: 248,
  storySize: 68,
} as const;
