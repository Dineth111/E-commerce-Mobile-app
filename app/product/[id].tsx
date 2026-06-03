import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import { getProductById } from '@/services/products';
import { getOutfitSuggestions } from '@/services/anthropic';
import { useCartStore } from '@/stores/useCartStore';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useStyleProfileStore } from '@/stores/useStyleProfileStore';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ProductCard } from '@/components/product/ProductCard';
import { MOCK_PRODUCTS, MOCK_REVIEWS } from '@/constants/mockData';
import type { Size, Color } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem, totalItems } = useCartStore();
  const { toggleItem, isWishlisted } = useWishlistStore();
  const { addToBrowsingHistory } = useStyleProfileStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const cartBtnScale = useSharedValue(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id!),
    enabled: !!id,
  });

  React.useEffect(() => {
    if (product) {
      addToBrowsingHistory(product.id);
      setSelectedColor(product.colors[0] ?? null);
    }
  }, [product?.id]);

  const outfitCatalog = MOCK_PRODUCTS.filter((p) => p.id !== id).map((p) => ({
    id: p.id, name: p.name, category: p.category, tags: p.tags,
  }));

  const { data: outfitSuggestions } = useQuery({
    queryKey: ['outfit', id],
    queryFn: () =>
      product
        ? getOutfitSuggestions(
            { name: product.name, category: product.category, color: product.colors[0]?.name ?? '', style: product.tags[0] ?? '' },
            outfitCatalog
          )
        : Promise.resolve([]),
    enabled: !!product,
  });

  const outfitProducts = MOCK_PRODUCTS.filter((p) =>
    (outfitSuggestions ?? []).some((s: any) => s.productId === p.id)
  ).slice(0, 3);

  const handleAddToCart = useCallback(async () => {
    if (!product || !selectedSize || !selectedColor) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    cartBtnScale.value = withSpring(0.92, { damping: 8, stiffness: 400 }, () => {
      cartBtnScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });
    addItem(product, selectedSize, selectedColor);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [product, selectedSize, selectedColor]);

  const handleWishlist = useCallback(async () => {
    if (!product) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleItem(product);
  }, [product]);

  const handleShare = async () => {
    if (!product) return;
    await Share.share({
      message: `Check out ${product.name} by ${product.brand} for $${product.price}! ✦`,
    });
  };

  const cartBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartBtnScale.value }],
  }));

  const wishlisted = product ? isWishlisted(product.id) : false;
  const discount = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  if (isLoading || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={COLORS.foreground} />
          </TouchableOpacity>
        </View>
        <SkeletonLoader height={420} borderRadius={0} />
        <View style={{ padding: SPACING.base, gap: 12 }}>
          <SkeletonLoader height={12} width="40%" />
          <SkeletonLoader height={24} width="80%" />
          <SkeletonLoader height={16} width="30%" />
          <SkeletonLoader height={100} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ─── Image Carousel ─── */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: product.images[selectedImage] }}
            style={styles.mainImage}
            contentFit="cover"
            transition={300}
          />

          {/* Nav overlay */}
          <View style={[styles.imageNav, { top: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
              <Ionicons name="arrow-back" size={20} color={COLORS.foreground} />
            </TouchableOpacity>
            <View style={styles.navRight}>
              <TouchableOpacity style={styles.navBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={COLORS.foreground} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn} onPress={handleWishlist}>
                <Ionicons
                  name={wishlisted ? 'heart' : 'heart-outline'}
                  size={20}
                  color={wishlisted ? COLORS.primary : COLORS.foreground}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Thumbnail row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnails}
          >
            {product.images.map((img, i) => (
              <TouchableOpacity key={i} onPress={() => setSelectedImage(i)}>
                <Image
                  source={{ uri: img }}
                  style={[styles.thumbnail, selectedImage === i && styles.thumbnailActive]}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>

        {/* ─── Product Info ─── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.infoSection}>
          {/* Brand + Rating */}
          <View style={styles.brandRow}>
            <Text style={styles.brand}>{product.brand}</Text>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={styles.rating}>{product.rating} ({product.reviewCount.toLocaleString()})</Text>
            </View>
          </View>

          <Text style={styles.productName}>{product.name}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>${product.originalPrice}</Text>
            )}
            {product.stockCount && product.stockCount < 15 && (
              <View style={styles.stockBadge}>
                <Text style={styles.stockText}>Only {product.stockCount} left!</Text>
              </View>
            )}
          </View>

          {/* ─── Color Selector ─── */}
          <View style={styles.selectorSection}>
            <Text style={styles.selectorLabel}>Color: <Text style={styles.selectorValue}>{selectedColor?.name}</Text></Text>
            <View style={styles.colorRow}>
              {product.colors.map((color) => (
                <TouchableOpacity
                  key={color.name}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color.hex },
                    selectedColor?.name === color.name && styles.colorDotActive,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>

          {/* ─── Size Selector ─── */}
          <View style={styles.selectorSection}>
            <View style={styles.sizeHeader}>
              <Text style={styles.selectorLabel}>Size: <Text style={styles.selectorValue}>{selectedSize ?? 'Select'}</Text></Text>
              <TouchableOpacity onPress={() => setShowSizeGuide(true)}>
                <Text style={styles.sizeGuideLink}>Size Guide</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sizeRow}>
              {product.sizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.sizeChip, selectedSize === size && styles.sizeChipActive]}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedSize(size);
                  }}
                >
                  <Text style={[styles.sizeLabel, selectedSize === size && styles.sizeLabelActive]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ─── Description ─── */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{product.description}</Text>
            {product.material && (
              <View style={styles.materialRow}>
                <Ionicons name="shirt-outline" size={14} color={COLORS.muted} />
                <Text style={styles.materialText}>{product.material}</Text>
              </View>
            )}
          </View>

          {/* ─── Complete The Look (AI) ─── */}
          {outfitProducts.length > 0 && (
            <View style={styles.outfitSection}>
              <View style={styles.aiSectionHeader}>
                <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Complete The Look</Text>
              </View>
              <Text style={styles.sectionSubtitle}>AI-curated outfit suggestions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 8 }}>
                {outfitProducts.map((p) => <ProductCard key={p.id} product={p} width={150} />)}
              </ScrollView>
            </View>
          )}

          {/* ─── AR Try-On Placeholder ─── */}
          <TouchableOpacity style={styles.arBtn}>
            <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
            <View style={styles.arText}>
              <Text style={styles.arTitle}>AR Virtual Try-On</Text>
              <Text style={styles.arSubtitle}>See how it looks on you</Text>
            </View>
            <View style={styles.arBadge}>
              <Text style={styles.arBadgeText}>Coming Soon</Text>
            </View>
          </TouchableOpacity>

          {/* ─── Reviews ─── */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <View style={styles.ratingOverall}>
                <Text style={styles.ratingNumber}>{product.rating}</Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name={s <= Math.round(product.rating) ? 'star' : 'star-outline'}
                      size={14}
                      color={COLORS.warning}
                    />
                  ))}
                </View>
                <Text style={styles.reviewCount}>({product.reviewCount.toLocaleString()})</Text>
              </View>
            </View>

            {/* AI Sentiment Summary */}
            <View style={styles.sentimentCard}>
              <Ionicons name="sparkles" size={14} color={COLORS.primary} />
              <Text style={styles.sentimentText}>
                <Text style={{ color: COLORS.primary, fontFamily: FONTS.semiBold }}>AI Summary: </Text>
                Customers love the quality and fit. Most note it runs true to size. Top praise for fabric quality and fast shipping.
              </Text>
            </View>

            {MOCK_REVIEWS.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} contentFit="cover" />
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewName}>{review.username}</Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons key={s} name={s <= review.rating ? 'star' : 'star-outline'} size={12} color={COLORS.warning} />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                <View style={styles.helpfulRow}>
                  <Ionicons name="thumbs-up-outline" size={14} color={COLORS.muted} />
                  <Text style={styles.helpfulText}>{review.helpful} found this helpful</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* ─── Add to Cart Footer ─── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Price</Text>
          <Text style={styles.footerPriceValue}>${product.price}</Text>
        </View>
        <Animated.View style={[{ flex: 1 }, cartBtnStyle]}>
          <TouchableOpacity
            style={[styles.addToCartBtn, addedToCart && styles.addedBtn]}
            onPress={handleAddToCart}
            activeOpacity={0.85}
          >
            <Ionicons
              name={addedToCart ? 'checkmark-circle' : 'bag-add-outline'}
              size={20}
              color="#fff"
            />
            <Text style={styles.addToCartText}>
              {addedToCart ? 'Added to Bag!' : !selectedSize ? 'Select Size First' : 'Add to Bag'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ─── Size Guide Modal ─── */}
      <Modal visible={showSizeGuide} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSizeGuide(false)}>
        <View style={styles.sizeGuideModal}>
          <View style={styles.sizeGuideHeader}>
            <Text style={styles.sizeGuideTitle}>Size Guide</Text>
            <TouchableOpacity onPress={() => setShowSizeGuide(false)}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.sizeGuideBody}>
            <View style={styles.sizeTable}>
              <View style={styles.sizeTableRow}>
                {['Size', 'Bust', 'Waist', 'Hips'].map((h) => (
                  <Text key={h} style={styles.sizeTableHeader}>{h}</Text>
                ))}
              </View>
              {[
                { size: 'XS', bust: 80, waist: 62, hips: 88 },
                { size: 'S', bust: 84, waist: 66, hips: 92 },
                { size: 'M', bust: 88, waist: 70, hips: 96 },
                { size: 'L', bust: 92, waist: 74, hips: 100 },
                { size: 'XL', bust: 96, waist: 78, hips: 104 },
              ].map((row, i) => (
                <View key={row.size} style={[styles.sizeTableRow, i % 2 === 0 && styles.sizeTableRowAlt]}>
                  {[row.size, `${row.bust}cm`, `${row.waist}cm`, `${row.hips}cm`].map((val, j) => (
                    <Text key={j} style={[styles.sizeTableCell, j === 0 && styles.sizeTableCellBold]}>{val}</Text>
                  ))}
                </View>
              ))}
            </View>
            <View style={styles.sizeNote}>
              <Ionicons name="sparkles" size={14} color={COLORS.primary} />
              <Text style={styles.sizeNoteText}>
                AI Recommendation: Based on your profile, we suggest <Text style={{ color: COLORS.primary, fontFamily: FONTS.semiBold }}>Size M</Text> for a comfortable fit.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: {},
  loadingHeader: { padding: SPACING.base, paddingTop: SPACING['2xl'] },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  imageSection: { position: 'relative' },
  mainImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.15 },
  imageNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(10,10,15,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  navRight: { flexDirection: 'row', gap: 8 },
  thumbnails: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  thumbnail: { width: 60, height: 70, borderRadius: RADIUS.md },
  thumbnailActive: { borderWidth: 2, borderColor: COLORS.primary },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  discountText: { fontSize: FONT_SIZES.xs, color: '#fff', fontFamily: FONTS.bold },
  infoSection: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    gap: 0,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  brand: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.medium, textTransform: 'uppercase', letterSpacing: 0.8 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${COLORS.warning}15`,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  rating: { fontSize: FONT_SIZES.xs, color: COLORS.warning, fontFamily: FONTS.semiBold },
  productName: { fontSize: FONT_SIZES['2xl'], color: COLORS.foreground, fontFamily: FONTS.bold, lineHeight: 32, marginBottom: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.lg },
  price: { fontSize: FONT_SIZES.xl, color: COLORS.foreground, fontFamily: FONTS.bold },
  originalPrice: { fontSize: FONT_SIZES.base, color: COLORS.muted, textDecorationLine: 'line-through', fontFamily: FONTS.regular },
  stockBadge: { backgroundColor: `${COLORS.warning}15`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, marginLeft: 'auto' },
  stockText: { fontSize: FONT_SIZES.xs, color: COLORS.warning, fontFamily: FONTS.semiBold },
  selectorSection: { marginBottom: SPACING.lg },
  selectorLabel: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.medium, marginBottom: 10 },
  selectorValue: { color: COLORS.foreground, fontFamily: FONTS.semiBold },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorDot: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2, borderColor: 'transparent',
  },
  colorDotActive: { borderColor: COLORS.primary, transform: [{ scale: 1.15 }] },
  sizeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sizeGuideLink: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontFamily: FONTS.semiBold },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeChip: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  sizeChipActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}10` },
  sizeLabel: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.semiBold },
  sizeLabelActive: { color: COLORS.primary },
  descriptionSection: { marginBottom: SPACING.xl, gap: 10 },
  sectionTitle: { fontSize: FONT_SIZES.md, color: COLORS.foreground, fontFamily: FONTS.bold },
  sectionSubtitle: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.regular, marginTop: 2, marginBottom: 4 },
  description: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.regular, lineHeight: 22 },
  materialRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  materialText: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.regular },
  outfitSection: { marginBottom: SPACING.xl },
  aiSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  arBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    marginBottom: SPACING.xl,
  },
  arText: { flex: 1 },
  arTitle: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.semiBold },
  arSubtitle: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.regular, marginTop: 2 },
  arBadge: { backgroundColor: COLORS.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  arBadgeText: { fontSize: 9, color: COLORS.muted, fontFamily: FONTS.semiBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewsSection: { marginBottom: SPACING.xl, gap: 12 },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingOverall: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingNumber: { fontSize: FONT_SIZES.lg, color: COLORS.foreground, fontFamily: FONTS.bold },
  stars: { flexDirection: 'row', gap: 2 },
  reviewCount: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.regular },
  sentimentCard: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: `${COLORS.primary}25`,
  },
  sentimentText: { flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.regular, lineHeight: 20 },
  reviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewMeta: { flex: 1, gap: 2 },
  reviewName: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.semiBold },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewDate: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.regular },
  reviewComment: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.regular, lineHeight: 20 },
  helpfulRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  helpfulText: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.regular },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.md,
  },
  footerPrice: { gap: 2 },
  footerPriceLabel: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.medium },
  footerPriceValue: { fontSize: FONT_SIZES.lg, color: COLORS.foreground, fontFamily: FONTS.bold },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    ...SHADOWS.glow,
  },
  addedBtn: { backgroundColor: COLORS.success },
  addToCartText: { fontSize: FONT_SIZES.base, color: '#fff', fontFamily: FONTS.bold },
  sizeGuideModal: { flex: 1, backgroundColor: COLORS.background },
  sizeGuideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: SPACING.xl,
  },
  sizeGuideTitle: { fontSize: FONT_SIZES.lg, color: COLORS.foreground, fontFamily: FONTS.bold },
  sizeGuideBody: { padding: SPACING.base, gap: 16 },
  sizeTable: { borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  sizeTableRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
  },
  sizeTableRowAlt: { backgroundColor: COLORS.surface2 },
  sizeTableHeader: { flex: 1, padding: 12, fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.bold, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  sizeTableCell: { flex: 1, padding: 12, fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.regular, textAlign: 'center' },
  sizeTableCellBold: { fontFamily: FONTS.bold, color: COLORS.primary },
  sizeNote: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  sizeNoteText: { flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.regular, lineHeight: 20 },
});
