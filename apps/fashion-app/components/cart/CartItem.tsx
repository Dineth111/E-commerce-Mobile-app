import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';
import type { CartItem, Size } from '@/types';
import { useCartStore } from '@/stores/useCartStore';

interface CartItemComponentProps {
  item: CartItem;
}

export function CartItemComponent({ item }: CartItemComponentProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const swipeableRef = useRef<Swipeable>(null);

  const handleRemove = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    swipeableRef.current?.close();
    removeItem(item.id);
  };

  const handleQuantity = async (delta: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateQuantity(item.id, item.quantity + delta);
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
    return (
      <TouchableOpacity style={styles.deleteAction} onPress={handleRemove}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <Text style={styles.deleteLabel}>Remove</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
      <View style={styles.container}>
        <Image
          source={{ uri: item.product.images[0] }}
          style={styles.image}
          contentFit="cover"
        />
        <View style={styles.details}>
          <Text style={styles.brand} numberOfLines={1}>{item.product.brand}</Text>
          <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
          <View style={styles.variantRow}>
            <View style={styles.variantTag}>
              <Text style={styles.variantText}>Size {item.size}</Text>
            </View>
            <View style={[styles.colorDot, { backgroundColor: item.color.hex }]} />
            <Text style={styles.colorName}>{item.color.name}</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.price}>${(item.product.price * item.quantity).toFixed(0)}</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQuantity(-1)}>
                <Ionicons name="remove" size={14} color={COLORS.foreground} />
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQuantity(1)}>
                <Ionicons name="add" size={14} color={COLORS.foreground} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 12,
    marginHorizontal: SPACING.base,
    marginBottom: 10,
  },
  image: {
    width: 90,
    height: 110,
    borderRadius: RADIUS.md,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  brand: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  name: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.foreground,
    fontFamily: FONTS.semiBold,
    lineHeight: 18,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  variantTag: {
    backgroundColor: COLORS.surface2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  variantText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    fontFamily: FONTS.medium,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  price: {
    fontSize: FONT_SIZES.md,
    color: COLORS.foreground,
    fontFamily: FONTS.bold,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: FONT_SIZES.base,
    color: COLORS.foreground,
    fontFamily: FONTS.semiBold,
    minWidth: 16,
    textAlign: 'center',
  },
  deleteAction: {
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    marginRight: SPACING.base,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteLabel: {
    fontSize: FONT_SIZES.xs,
    color: '#fff',
    fontFamily: FONTS.semiBold,
  },
});
