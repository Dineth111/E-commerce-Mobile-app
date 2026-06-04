import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import type { User } from '@/types';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isInitialized: boolean;
  isOnboarded: boolean;
  isQuizCompleted: boolean;
  // Actions
  initializeSupabaseAuth: () => void;
  updateProfile: (updates: Partial<User>) => void;
  setOnboarded: () => void;
  setQuizCompleted: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isInitialized: false,
      isOnboarded: false,
      isQuizCompleted: false,

      initializeSupabaseAuth: () => {
        if (get().isInitialized) return;
        
        supabase.auth.getSession().then(({ data: { session } }) => {
          set({ 
            session, 
            user: session?.user ? {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              avatar: session.user.user_metadata?.avatar_url,
            } : null,
            isInitialized: true 
          });
        });

        supabase.auth.onAuthStateChange((_event, session) => {
          set({ 
            session,
            user: session?.user ? {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              avatar: session.user.user_metadata?.avatar_url,
            } : null,
          });
        });
      },

      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setOnboarded: () => set({ isOnboarded: true }),

      setQuizCompleted: () => set({ isQuizCompleted: true }),

      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          session: null,
          isOnboarded: false,
          isQuizCompleted: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        isOnboarded: state.isOnboarded, 
        isQuizCompleted: state.isQuizCompleted 
        // We do not persist `user` or `session` via Zustand because Supabase 
        // handles its own secure token persistence internally via our custom adapter!
      }),
    }
  )
);
