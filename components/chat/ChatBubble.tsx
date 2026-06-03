import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';
import type { ChatMessage, Product } from '@/types';
import { useRouter } from 'expo-router';

interface ChatBubbleProps {
  message: ChatMessage;
  index: number;
}

export function ChatBubble({ message, index }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={isUser ? FadeInUp.duration(300) : FadeInDown.duration(400)}
      style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAssistant]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>✦</Text>
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {message.imageUri && (
          <Image
            source={{ uri: message.imageUri }}
            style={styles.attachedImage}
            contentFit="cover"
          />
        )}
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
          {message.content}
        </Text>

        {message.products && message.products.length > 0 && (
          <InlineProducts products={message.products} />
        )}

        <Text style={[styles.time, isUser ? styles.timeUser : styles.timeAssistant]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </Animated.View>
  );
}

function InlineProducts({ products }: { products: Product[] }) {
  const router = useRouter();
  return (
    <View style={styles.inlineProducts}>
      {products.slice(0, 3).map((product) => (
        <TouchableOpacity
          key={product.id}
          style={styles.inlineProduct}
          onPress={() => router.push(`/product/${product.id}`)}
        >
          <Image source={{ uri: product.images[0] }} style={styles.productThumb} contentFit="cover" />
          <View style={styles.productInfo}>
            <Text style={styles.productBrand} numberOfLines={1}>{product.brand}</Text>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            <Text style={styles.productPrice}>${product.price}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={COLORS.muted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function formatTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: SPACING.base,
    gap: 10,
  },
  wrapperUser: { justifyContent: 'flex-end' },
  wrapperAssistant: { justifyContent: 'flex-start' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}20`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}40`,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  avatarText: { fontSize: 14, color: COLORS.primary },
  bubble: {
    maxWidth: '78%',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: 8,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: COLORS.surface2,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: { fontSize: FONT_SIZES.base, lineHeight: 22 },
  textUser: { color: '#fff', fontFamily: FONTS.regular },
  textAssistant: { color: COLORS.foreground, fontFamily: FONTS.regular },
  time: { fontSize: FONT_SIZES.xs },
  timeUser: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  timeAssistant: { color: COLORS.muted },
  attachedImage: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS.md,
  },
  inlineProducts: {
    gap: 8,
    marginTop: 4,
  },
  inlineProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productThumb: {
    width: 48,
    height: 56,
    borderRadius: RADIUS.sm,
  },
  productInfo: { flex: 1 },
  productBrand: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.medium },
  productName: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.semiBold, marginVertical: 2 },
  productPrice: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontFamily: FONTS.bold },
});
