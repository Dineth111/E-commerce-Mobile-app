import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatStore } from '@/stores/useChatStore';
import { useStyleProfileStore } from '@/stores/useStyleProfileStore';
import { streamChatMessage } from '@/services/anthropic';
import type { ChatMessage } from '@/types';

const QUICK_PROMPTS = [
  'What should I wear to a summer wedding?',
  'Help me style my leather jacket',
  'Create a minimalist capsule wardrobe',
  'What are the trends for 2025?',
];

export default function ChatScreen() {
  const { messages, addMessage, isStreaming, streamingText, setStreaming, appendStreamingText, finalizeStreamingMessage, clearMessages } = useChatStore();
  const { profile } = useStyleProfileStore();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length === 0) {
      // Welcome message
      addMessage({
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm **Aria**, your personal AI stylist ✦\n\nI know your style profile and I'm here to help you look amazing. Ask me anything — outfit ideas, style advice, size help, or what's trending right now!`,
        timestamp: new Date(),
      });
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0 || isStreaming) scrollToBottom();
  }, [messages.length, streamingText]);

  const handleSend = useCallback(async (text: string, imageUri?: string) => {
    if (!text && !imageUri) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text || 'What do you think of this outfit?',
      timestamp: new Date(),
      imageUri,
    };

    addMessage(userMessage);
    setStreaming(true);
    scrollToBottom();

    await streamChatMessage(
      [...messages, userMessage],
      profile,
      (chunk) => appendStreamingText(chunk),
      () => finalizeStreamingMessage(),
      (err) => {
        setStreaming(false);
        addMessage({
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I had trouble responding. Please try again.',
          timestamp: new Date(),
        });
      }
    );
  }, [messages, profile]);

  const handleQuickPrompt = (prompt: string) => handleSend(prompt);

  const renderMessage = useCallback(({ item, index }: { item: ChatMessage; index: number }) => (
    <ChatBubble message={item} index={index} />
  ), []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <View style={styles.ariaAvatar}>
            <Text style={styles.ariaIcon}>✦</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.ariaName}>Aria AI</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Your Personal Stylist</Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearMessages} style={styles.clearBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="refresh-outline" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* ─── Messages ─── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListHeaderComponent={
            messages.length <= 1 ? (
              <View style={styles.quickPromptsContainer}>
                <Text style={styles.quickPromptsTitle}>Quick Start</Text>
                <View style={styles.quickPrompts}>
                  {QUICK_PROMPTS.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={styles.quickPrompt}
                      onPress={() => handleQuickPrompt(p)}
                    >
                      <Text style={styles.quickPromptText}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={
            isStreaming && streamingText ? (
              <Animated.View entering={FadeIn} style={styles.streamingBubble}>
                <View style={styles.streamingAvatar}>
                  <Text style={styles.ariaIcon}>✦</Text>
                </View>
                <View style={styles.streamingContent}>
                  <Text style={styles.streamingText}>{streamingText}</Text>
                  <View style={styles.streamingDots}>
                    {[0, 1, 2].map((i) => (
                      <View key={i} style={[styles.streamingDot, { opacity: 0.3 + i * 0.3 }]} />
                    ))}
                  </View>
                </View>
              </Animated.View>
            ) : null
          }
        />

        {/* ─── Input ─── */}
        <ChatInput onSend={handleSend} isLoading={isStreaming} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  ariaAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: `${COLORS.primary}20`,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ariaIcon: { fontSize: 18, color: COLORS.primary },
  headerText: { flex: 1 },
  ariaName: { fontSize: FONT_SIZES.md, color: COLORS.foreground, fontFamily: FONTS.bold },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.success },
  onlineText: { fontSize: FONT_SIZES.xs, color: COLORS.success, fontFamily: FONTS.medium },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: { paddingVertical: SPACING.md, gap: 4 },
  quickPromptsContainer: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.lg,
    gap: 12,
  },
  quickPromptsTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    fontFamily: FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  quickPrompts: { gap: 8 },
  quickPrompt: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickPromptText: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.medium },
  streamingBubble: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: 10,
    alignItems: 'flex-end',
  },
  streamingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}20`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamingContent: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.xl,
    borderBottomLeftRadius: 4,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  streamingText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.foreground,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  streamingDots: { flexDirection: 'row', gap: 4 },
  streamingDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.primary },
});
