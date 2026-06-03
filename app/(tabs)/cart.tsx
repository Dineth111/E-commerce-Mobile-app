import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import { CartItemComponent } from '@/components/cart/CartItem';
import { useCartStore } from '@/stores/useCartStore';
import { ProductCard } from '@/components/product/ProductCard';
import { MOCK_PRODUCTS } from '@/constants/mockData';

export default function CartScreen() {
  const router = useRouter();
  const { items, promoCode, promoDiscount, subtotal, total, applyPromoCode, clearCart } = useCartStore();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'success'>('cart');

  const sub = subtotal();
  const tot = total();
  const shipping = sub > 150 ? 0 : 9.99;
  const upsellProducts = MOCK_PRODUCTS.filter((p) => !items.some((i) => i.product.id === p.id)).slice(0, 3);

  const handlePromoApply = () => {
    try {
      applyPromoCode(promoInput);
      setPromoError('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setPromoError('Invalid promo code. Try: WELCOME20, STYLE15, VIBE25');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleCheckout = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCheckoutStep('success');
    setTimeout(() => {
      clearCart();
      setCheckoutStep('cart');
      router.push('/(tabs)');
    }, 3000);
  };

  if (checkoutStep === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Animated.View entering={FadeInDown.springify()} style={styles.successIcon}>
            <Text style={{ fontSize: 64 }}>🎉</Text>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(200)} style={styles.successTitle}>
            Order Confirmed!
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300)} style={styles.successSubtitle}>
            Your fashion is on its way. Tracking details sent to your email.
          </Animated.Text>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bag</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 64 }}>🛍</Text>
          <Text style={styles.emptyTitle}>Your bag is empty</Text>
          <Text style={styles.emptySubtitle}>Start adding pieces you love</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.shopBtnText}>Explore Fashion</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bag</Text>
        <Text style={styles.itemCount}>{items.length} items</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <Animated.View layout={Layout.springify()}>
          {items.map((item) => (
            <Animated.View key={item.id} layout={Layout.springify()} entering={FadeInDown}>
              <CartItemComponent item={item} />
            </Animated.View>
          ))}
        </Animated.View>

        {/* Free Shipping Banner */}
        {sub < 150 && (
          <View style={styles.shippingBanner}>
            <Ionicons name="rocket-outline" size={16} color={COLORS.primary} />
            <Text style={styles.shippingText}>
              Add <Text style={{ color: COLORS.primary, fontFamily: FONTS.bold }}>${(150 - sub).toFixed(0)}</Text> more for free shipping!
            </Text>
          </View>
        )}

        {/* Promo Code */}
        <View style={styles.promoSection}>
          <Text style={styles.promoLabel}>Promo Code</Text>
          <View style={styles.promoRow}>
            <TextInput
              style={[styles.promoInput, promoCode && styles.promoInputSuccess]}
              value={promoInput}
              onChangeText={setPromoInput}
              placeholder="Enter code (e.g. WELCOME20)"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.promoBtn} onPress={handlePromoApply}>
              <Text style={styles.promoBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {promoCode && (
            <Text style={styles.promoSuccess}>✓ {promoCode} applied — {promoDiscount}% off!</Text>
          )}
          {promoError && (
            <Text style={styles.promoError}>{promoError}</Text>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <SummaryRow label="Subtotal" value={`$${sub.toFixed(2)}`} />
          <SummaryRow label="Shipping" value={shipping === 0 ? 'FREE' : `$${shipping}`} valueColor={shipping === 0 ? COLORS.success : undefined} />
          {promoDiscount > 0 && (
            <SummaryRow label={`Promo (${promoDiscount}%)`} value={`-$${(sub * promoDiscount / 100).toFixed(2)}`} valueColor={COLORS.success} />
          )}
          <View style={styles.summaryDivider} />
          <SummaryRow label="Total" value={`$${(tot + shipping).toFixed(2)}`} isTotal />
        </View>

        {/* AI Upsell */}
        {upsellProducts.length > 0 && (
          <View style={styles.upsell}>
            <View style={styles.upsellHeader}>
              <Ionicons name="sparkles" size={14} color={COLORS.primary} />
              <Text style={styles.upsellTitle}>You Might Also Love</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {upsellProducts.map((p) => <ProductCard key={p.id} product={p} width={150} />)}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Checkout Footer */}
      <View style={styles.checkoutFooter}>
        <View style={styles.totalRow}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal}>${(tot + shipping).toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.85}>
          <Ionicons name="lock-closed" size={16} color="#fff" />
          <Text style={styles.checkoutText}>Secure Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, isTotal, valueColor }: {
  label: string; value: string; isTotal?: boolean; valueColor?: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, isTotal && styles.summaryLabelTotal]}>{label}</Text>
      <Text style={[styles.summaryValue, isTotal && styles.summaryValueTotal, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: FONT_SIZES.xl, color: COLORS.foreground, fontFamily: FONTS.bold },
  itemCount: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.medium },
  scroll: { paddingTop: SPACING.md },
  shippingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SPACING.base,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: `${COLORS.primary}25`,
    marginBottom: SPACING.md,
  },
  shippingText: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.regular },
  promoSection: { paddingHorizontal: SPACING.base, marginBottom: SPACING.lg, gap: 8 },
  promoLabel: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.semiBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  promoRow: { flexDirection: 'row', gap: 8 },
  promoInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    fontSize: FONT_SIZES.base,
    color: COLORS.foreground,
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
  },
  promoInputSuccess: { borderColor: COLORS.success },
  promoBtn: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
  },
  promoBtnText: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.semiBold },
  promoSuccess: { fontSize: FONT_SIZES.sm, color: COLORS.success, fontFamily: FONTS.medium },
  promoError: { fontSize: FONT_SIZES.xs, color: COLORS.error, fontFamily: FONTS.regular },
  summary: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  summaryTitle: { fontSize: FONT_SIZES.md, color: COLORS.foreground, fontFamily: FONTS.bold, marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.regular },
  summaryLabelTotal: { color: COLORS.foreground, fontFamily: FONTS.bold, fontSize: FONT_SIZES.base },
  summaryValue: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.semiBold },
  summaryValueTotal: { fontSize: FONT_SIZES.lg, color: COLORS.foreground, fontFamily: FONTS.bold },
  summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  upsell: { paddingHorizontal: SPACING.base, marginBottom: SPACING.lg, gap: 12 },
  upsellHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  upsellTitle: { fontSize: FONT_SIZES.md, color: COLORS.foreground, fontFamily: FONTS.bold },
  checkoutFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING['2xl'],
    gap: 12,
    ...SHADOWS.md,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.medium },
  footerTotal: { fontSize: FONT_SIZES.xl, color: COLORS.foreground, fontFamily: FONTS.bold },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    ...SHADOWS.glow,
  },
  checkoutText: { fontSize: FONT_SIZES.md, color: '#fff', fontFamily: FONTS.bold },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 80 },
  emptyTitle: { fontSize: FONT_SIZES.xl, color: COLORS.foreground, fontFamily: FONTS.bold },
  emptySubtitle: { fontSize: FONT_SIZES.base, color: COLORS.muted, fontFamily: FONTS.regular },
  shopBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  shopBtnText: { fontSize: FONT_SIZES.md, color: '#fff', fontFamily: FONTS.bold },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: SPACING['3xl'] },
  successIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: `${COLORS.success}20`, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: FONT_SIZES['2xl'], color: COLORS.foreground, fontFamily: FONTS.bold, textAlign: 'center' },
  successSubtitle: { fontSize: FONT_SIZES.base, color: COLORS.muted, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 24 },
});
