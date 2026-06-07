import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import { StoryRow } from '@/components/home/StoryRow';
import { TrendingRow } from '@/components/home/TrendingRow';
import { StyleTipCard } from '@/components/home/StyleTipCard';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/SkeletonLoader';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { getTrendingProducts, getNewArrivals } from '@/services/products';
import { MOCK_STORIES, MOCK_PRODUCTS } from '@/constants/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user, isOnboarded } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount());

  const { data: trending, isLoading: loadingTrending, refetch: refetchTrending } = useQuery({
    queryKey: ['trending'],
    queryFn: getTrendingProducts,
  });

  const { data: newArrivals, isLoading: loadingNew, refetch: refetchNew } = useQuery({
    queryKey: ['newArrivals'],
    queryFn: getNewArrivals,
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchTrending(), refetchNew()]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!isOnboarded) router.replace('/onboarding');
  }, [isOnboarded]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ─── Header ─── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] ?? 'Fashionista'} ✦</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Ionicons name="search-outline" size={22} color={COLORS.foreground} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconBtn}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.foreground} />
              {unreadCount > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Image
                source={{ uri: user?.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ─── Hero Banner ─── */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.heroBanner}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80' }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroTag}>
              <Ionicons name="sparkles" size={12} color={COLORS.primary} />
              <Text style={styles.heroTagText}>AI Curated For You</Text>
            </View>
            <Text style={styles.heroTitle}>Spring Drop{'\n'}2025 ✦</Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Text style={styles.heroBtnText}>Explore Now</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ─── Categories ─── */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <CategoryRow onPress={(cat) => router.push({ pathname: '/(tabs)/search', params: { category: cat } })} />
        </Animated.View>

        {/* ─── Stories ─── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <SectionHeader title="Outfit Inspiration" subtitle="Today's looks from the community" />
          <StoryRow stories={MOCK_STORIES} />
        </Animated.View>

        {/* ─── Style Tip ─── */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={{ marginTop: SPACING.lg }}>
          <StyleTipCard />
        </Animated.View>

        {/* ─── Trending ─── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginTop: SPACING.xl }}>
          <TrendingRow
            products={trending ?? []}
            isLoading={loadingTrending}
            title="Trending Now 🔥"
            subtitle="What everyone is wearing"
            onSeeAll={() => router.push('/(tabs)/search')}
          />
        </Animated.View>

        {/* ─── New Arrivals Grid ─── */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <SectionHeader
            title="New Arrivals ✨"
            subtitle="Fresh drops this week"
            onSeeAll={() => router.push('/(tabs)/search')}
          />
          <View style={styles.grid}>
            {(loadingNew ? Array.from({ length: 4 }) : (newArrivals ?? [])).map((item, i) =>
              loadingNew || !item ? (
                <ProductCardSkeleton key={i} />
              ) : (
                <ProductCard key={(item as any).id} product={item as any} width={(SCREEN_WIDTH - 48) / 2} />
              )
            )}
          </View>
        </Animated.View>

        {/* ─── For You Section ─── */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <SectionHeader
            title="For You 💖"
            subtitle="Personalized picks based on your style"
            onSeeAll={() => router.push('/(tabs)/search')}
          />
          <TrendingRow
            products={MOCK_PRODUCTS.slice(4, 10)}
            title=""
            onSeeAll={() => router.push('/(tabs)/search')}
          />
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  subtitle,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const CATEGORIES_DISPLAY = [
  { id: 'all', label: 'All', emoji: '✦' },
  { id: 'dresses', label: 'Dresses', emoji: '👗' },
  { id: 'tops', label: 'Tops', emoji: '👚' },
  { id: 'outerwear', label: 'Outerwear', emoji: '🧥' },
  { id: 'shoes', label: 'Shoes', emoji: '👠' },
  { id: 'accessories', label: 'Bags', emoji: '👜' },
];

function CategoryRow({ onPress }: { onPress: (cat: string) => void }) {
  const [active, setActive] = React.useState('all');
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.catRow}
    >
      {CATEGORIES_DISPLAY.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.catChip, active === cat.id && styles.catChipActive]}
          onPress={() => {
            setActive(cat.id);
            onPress(cat.id);
          }}
        >
          <Text style={styles.catEmoji}>{cat.emoji}</Text>
          <Text style={[styles.catLabel, active === cat.id && styles.catLabelActive]}>
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING['2xl'] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.base,
  },
  greeting: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.foreground,
    fontFamily: FONTS.bold,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  heroBanner: {
    marginHorizontal: SPACING.base,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    height: 200,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.base,
    backgroundColor: 'rgba(0,0,0,0.45)',
    gap: 8,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.primary}30`,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: `${COLORS.primary}50`,
  },
  heroTagText: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontFamily: FONTS.semiBold },
  heroTitle: {
    fontSize: FONT_SIZES.xl,
    color: '#fff',
    fontFamily: FONTS.bold,
    lineHeight: 28,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  heroBtnText: { fontSize: FONT_SIZES.sm, color: '#fff', fontFamily: FONTS.semiBold },
  catRow: { paddingHorizontal: SPACING.base, gap: 8, paddingVertical: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChipActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.medium },
  catLabelActive: { color: COLORS.primary, fontFamily: FONTS.semiBold },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    marginTop: SPACING.xl,
  },
  sectionTitle: { fontSize: FONT_SIZES.lg, color: COLORS.foreground, fontFamily: FONTS.bold },
  sectionSubtitle: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.regular, marginTop: 2 },
  seeAll: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontFamily: FONTS.semiBold },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.base,
    gap: 12,
  },
});
