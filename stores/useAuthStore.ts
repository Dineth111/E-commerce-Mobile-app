import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StyleProfile, User } from '@/types';

interface AuthState {
  user: User | null;
  isOnboarded: boolean;
  isQuizCompleted: boolean;
  // Actions
  setUser: (user: User) => void;
  updateProfile: (updates: Partial<User>) => void;
  setOnboarded: () => void;
  setQuizCompleted: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: {
        id: 'user-1',
        name: 'Sofia Chen',
        email: 'sofia@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
      },
      isOnboarded: false,
      isQuizCompleted: false,

      setUser: (user) => set({ user }),

      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setOnboarded: () => set({ isOnboarded: true }),

      setQuizCompleted: () => set({ isQuizCompleted: true }),

      logout: () =>
        set({
          user: null,
          isOnboarded: false,
          isQuizCompleted: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
