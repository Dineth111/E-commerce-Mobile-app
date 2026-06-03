import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StyleProfile, BodyType, StyleType, ColorPalette, BudgetRange } from '@/types';

interface StyleProfileState {
  profile: StyleProfile;
  browsingHistory: string[]; // product IDs
  // Actions
  setBodyType: (bodyType: BodyType) => void;
  toggleStyle: (style: StyleType) => void;
  setColorPalette: (palette: ColorPalette) => void;
  setBudgetRange: (range: BudgetRange) => void;
  toggleBrand: (brand: string) => void;
  completeQuiz: () => void;
  addToBrowsingHistory: (productId: string) => void;
  resetProfile: () => void;
}

const defaultProfile: StyleProfile = {
  bodyType: 'hourglass',
  preferredStyles: [],
  colorPalette: 'neutral',
  budgetRange: 'mid-range',
  favoriteBrands: [],
  quizCompleted: false,
};

export const useStyleProfileStore = create<StyleProfileState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      browsingHistory: [],

      setBodyType: (bodyType) =>
        set((state) => ({ profile: { ...state.profile, bodyType } })),

      toggleStyle: (style) =>
        set((state) => {
          const current = state.profile.preferredStyles;
          const styles = current.includes(style)
            ? current.filter((s) => s !== style)
            : [...current, style];
          return { profile: { ...state.profile, preferredStyles: styles } };
        }),

      setColorPalette: (colorPalette) =>
        set((state) => ({ profile: { ...state.profile, colorPalette } })),

      setBudgetRange: (budgetRange) =>
        set((state) => ({ profile: { ...state.profile, budgetRange } })),

      toggleBrand: (brand) =>
        set((state) => {
          const current = state.profile.favoriteBrands;
          const brands = current.includes(brand)
            ? current.filter((b) => b !== brand)
            : [...current, brand];
          return { profile: { ...state.profile, favoriteBrands: brands } };
        }),

      completeQuiz: () =>
        set((state) => ({
          profile: { ...state.profile, quizCompleted: true },
        })),

      addToBrowsingHistory: (productId) =>
        set((state) => ({
          browsingHistory: [
            productId,
            ...state.browsingHistory.filter((id) => id !== productId),
          ].slice(0, 50),
        })),

      resetProfile: () => set({ profile: defaultProfile, browsingHistory: [] }),
    }),
    {
      name: 'style-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
