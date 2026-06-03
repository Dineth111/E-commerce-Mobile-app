export const ROUTES = {
  ONBOARDING: '/onboarding',
  QUIZ: '/quiz',
  HOME: '/(tabs)',
  SEARCH: '/(tabs)/search',
  CHAT: '/(tabs)/chat',
  CART: '/(tabs)/cart',
  PROFILE: '/(tabs)/profile',
  PRODUCT: (id: string) => `/product/${id}`,
} as const;
