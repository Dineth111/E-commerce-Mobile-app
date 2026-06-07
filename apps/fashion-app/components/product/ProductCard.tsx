import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS, FONTS, FONT_SIZES } from '@/constants/theme';
import type { Product } from '@/types';
import { useWishlistStore } from '@/stores/useWishlistStore';

interface ProductCardProps {
  product: Product;
  width?: number;
  style?: object;
  aspectRatio?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ProductCard({ product, width = 168, style, aspectRatio }: ProductCardProps) {
  const router = useRouter();
  const { isWishlisted, toggleItem } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);

  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const heartOpacity = useSharedValue(wishlisted ? 1 : 0.6);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withSpring(0.96, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    router.push(`/product/${product.id}`);
  }, [product.id]);

  const handleWishlist = useCallback(async (e: any) => {
    e.stopPropagation();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    heartOpacity.value = withTiming(wishlisted ? 0.6 : 1, { duration: 200 });
    toggleItem(product);
  }, [wishlisted, product]);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Animated.View style={[{ width }, cardStyle, style]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images[0] }}
            style={[styles.image, { height: width * (aspectRatio ?? 1.35) }]}
            contentFit="cover"
            transition={300}
          />

          {/* Gradient overlay */}
          <View style={styles.gradient} />

          {/* Badges */}
          <View style={styles.badges}>
            {product.isNew && (
              <View style={[styles.badge, styles.newBadge]}>
                <Text style={styles.badgeText}>NEW</Text>
              </View>
            )}
            {discount > 0 && (
              <View style={[styles.badge, styles.saleBadge]}>
                <Text style={styles.badgeText}>-{discount}%</Text>
              </View>
            )}
          </View>

          {/* Wishlist */}
          <TouchableOpacity style={styles.wishlistBtn} onPress={handleWishlist} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Animated.View style={heartStyle}>
              <Ionicons
                name={wishlisted ? 'heart' : 'heart-outline'}
                size={20}
                color={wishlisted ? COLORS.primary : COLORS.foreground}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>${product.originalPrice}</Text>
            )}
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color={COLORS.warning} />
              <Text style={styles.rating}>{product.rating}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface2,
    ...SHADOWS.sm,
  },
  image: {
    width: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
  },
  badges: {
    position: 'absolute',
    top: 8,
    left: 8,
    gap: 4,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  newBadge: {
    backgroundColor: COLORS.primary,
  },
  saleBadge: {
    backgroundColor: COLORS.success,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    paddingTop: 10,
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  brand: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  name: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.foreground,
    fontFamily: FONTS.semiBold,
    lineHeight: 18,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: FONT_SIZES.base,
    color: COLORS.foreground,
    fontFamily: FONTS.bold,
  },
  originalPrice: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    textDecorationLine: 'line-through',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  rating: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    fontFamily: FONTS.medium,
  },
});
