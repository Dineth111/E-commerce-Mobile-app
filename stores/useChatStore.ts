import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingText: string;
  // Actions
  addMessage: (message: ChatMessage) => void;
  setStreaming: (streaming: boolean) => void;
  appendStreamingText: (text: string) => void;
  finalizeStreamingMessage: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isStreaming: false,
      streamingText: '',

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      setStreaming: (streaming) =>
        set({ isStreaming: streaming, streamingText: streaming ? '' : get().streamingText }),

      appendStreamingText: (text) =>
        set((state) => ({ streamingText: state.streamingText + text })),

      finalizeStreamingMessage: () => {
        const { streamingText } = get();
        if (!streamingText) return;
        const message: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: streamingText,
          timestamp: new Date(),
        };
        set((state) => ({
          messages: [...state.messages, message],
          isStreaming: false,
          streamingText: '',
        }));
      },

      clearMessages: () => set({ messages: [], isStreaming: false, streamingText: '' }),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ messages: state.messages.slice(-50) }), // keep last 50
    }
  )
);
