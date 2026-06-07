import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/SkeletonLoader';
import { searchProducts, getAutocompleteSuggestions } from '@/services/products';
import { visualSearch } from '@/services/anthropic';
import type { SearchFilters, Category } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FILTER_CATEGORIES: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'dresses', label: 'Dresses' },
  { id: 'tops', label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'activewear', label: 'Activewear' },
  { id: 'formal', label: 'Formal' },
];

const CATEGORY_IMAGES: Record<string, string> = {
  all: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80',
  dresses: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=80',
  tops: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&q=80',
  bottoms: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&q=80',
  outerwear: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&q=80',
  shoes: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80',
  accessories: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80',
  activewear: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80',
  formal: 'https://images.unsplash.com/photo-1487309078313-be80b3aa1b42?w=500&q=80',
};

const POPULAR_VIBES = [
  { label: 'Minimalist', emoji: '🕶️' },
  { label: 'Streetwear', emoji: '🛹' },
  { label: 'Bohemian', emoji: '🌸' },
  { label: 'Vintage', emoji: '🕰️' },
  { label: 'Formal Suit', emoji: '👔' },
  { label: 'Athleisure', emoji: '👟' }
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [visualSearchLoading, setVisualSearchLoading] = useState(false);
  const [visualResult, setVisualResult] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([
    'Silk Wrap Dress',
    'Leather Jacket',
    'Denim Trousers',
    'Gold Earrings',
  ]);
  const inputRef = useRef<TextInput>(null);

  const hasQuery = query.trim().length > 0 || activeCategory !== 'all';

  const { data, isLoading } = useQuery({
    queryKey: ['search', query, activeCategory, filters],
    queryFn: () =>
      searchProducts(query, {
        ...filters,
        category: activeCategory !== 'all' ? activeCategory : undefined,
      }),
    enabled: hasQuery,
  });

  const handleQueryChange = async (text: string) => {
    setQuery(text);
    if (text.length > 1) {
      const s = await getAutocompleteSuggestions(text);
      setSuggestions(s);
    } else {
      setSuggestions([]);
    }
  };

  const selectQuery = (text: string) => {
    setQuery(text);
    setSuggestions([]);
    if (!history.includes(text)) {
      setHistory(prev => [text, ...prev.slice(0, 4)]);
    }
  };

  const clearHistoryItem = (itemToClear: string) => {
    setHistory(prev => prev.filter(h => h !== itemToClear));
  };

  const handleVisualSearch = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setVisualSearchLoading(true);
      try {
        const { items } = await visualSearch(result.assets[0].base64 ?? '');
        setVisualResult(items.map((i: any) => `${i.type} (${i.color}, ${i.style})`).join(', '));
        selectQuery(items[0]?.type ?? '');
      } finally {
        setVisualSearchLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        
        {/* ─── Premium Header ─── */}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.premiumHeaderTitle}>DISCOVER</Text>
          <Text style={styles.premiumHeaderSubtitle}>Curated styles for your personal vibe</Text>
        </View>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={18} color={COLORS.muted} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={query}
              onChangeText={handleQueryChange}
              onSubmitEditing={() => selectQuery(query)}
              placeholder="Search styles, brands, vibes..."
              placeholderTextColor={COLORS.muted}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); }}>
                <Ionicons name="close-circle" size={18} color={COLORS.muted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.visualBtn, visualSearchLoading && styles.visualBtnLoading]}
            onPress={handleVisualSearch}
          >
            <Ionicons name="camera" size={20} color={visualSearchLoading ? COLORS.muted : COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
            onPress={() => setShowFilters((v) => !v)}
          >
            <Ionicons name="options" size={20} color={showFilters ? COLORS.primary : COLORS.foreground} />
          </TouchableOpacity>
        </View>

        {/* ─── Visual Search Result ─── */}
        {visualResult && (
          <Animated.View entering={FadeIn} style={styles.visualResult}>
            <Ionicons name="sparkles" size={14} color={COLORS.primary} />
            <Text style={styles.visualResultText} numberOfLines={1}>Found: {visualResult}</Text>
            <TouchableOpacity onPress={() => setVisualResult(null)}>
              <Ionicons name="close" size={16} color={COLORS.muted} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ─── Autocomplete ─── */}
        {suggestions.length > 0 && (
          <Animated.View entering={SlideInDown.duration(200)} style={styles.suggestions}>
            {suggestions.map((s) => (
              <TouchableOpacity key={s} style={styles.suggestionItem} onPress={() => selectQuery(s)}>
                <Ionicons name="search-outline" size={14} color={COLORS.muted} />
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* ─── Category Mini-Cards ─── */}
        <View style={{ height: 65, marginBottom: 8 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {FILTER_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catCard, isActive && styles.catCardActive]}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveCategory(cat.id);
                  }}
                >
                  <Image
                    source={{ uri: CATEGORY_IMAGES[cat.id] }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={isActive ? ['rgba(233,30,140,0.65)', 'rgba(233,30,140,0.85)'] : ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={[styles.catCardText, isActive && styles.catCardTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Results or Empty State ─── */}
        {!hasQuery ? (
          <ScrollView contentContainerStyle={styles.emptyState}>
            
            {/* Visual Categories Grid */}
            <Text style={styles.sectionTitle}>✦ Explore Categories</Text>
            <View style={styles.categoryGrid}>
              {FILTER_CATEGORIES.filter(c => c.id !== 'all').map((cat, index) => {
                const isWide = index === 0 || index === 5 || index === 6;
                const cardWidth = isWide ? SCREEN_WIDTH - 32 : (SCREEN_WIDTH - 44) / 2;
                const cardHeight = isWide ? 130 : 160;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.gridCatCard, { width: cardWidth, height: cardHeight }]}
                    onPress={async () => {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setActiveCategory(cat.id);
                    }}
                  >
                    <Image
                      source={{ uri: CATEGORY_IMAGES[cat.id] }}
                      style={StyleSheet.absoluteFillObject}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.85)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.gridCatCardOverlay}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.gridCatCardText}>{cat.label}</Text>
                        <Text style={styles.gridCatCardSubtext}>
                          {cat.id === 'dresses' && 'Elegant and flowing silhouettes'}
                          {cat.id === 'tops' && 'Everyday luxury and statement tops'}
                          {cat.id === 'bottoms' && 'Tailored trousers and denim'}
                          {cat.id === 'outerwear' && 'Coats, jackets, and blazers'}
                          {cat.id === 'shoes' && 'Premium leather and sneakers'}
                          {cat.id === 'accessories' && 'Gold jewelry and leather bags'}
                          {cat.id === 'activewear' && 'High-performance athletic sets'}
                          {cat.id === 'formal' && 'Elegant tailoring and eveningwear'}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward-circle" size={24} color="#fff" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Popular Vibes / Tags */}
            <Text style={styles.sectionTitle}>✦ Discover Vibes</Text>
            <View style={styles.vibesContainer}>
              {POPULAR_VIBES.map((vibe) => (
                <TouchableOpacity
                  key={vibe.label}
                  style={styles.vibePill}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    selectQuery(vibe.label);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.vibeText}>{vibe.emoji} #{vibe.label.toLowerCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Searches */}
            {history.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>✦ Recent Searches</Text>
                <View style={styles.historyItemsContainer}>
                  {history.map((h) => (
                    <View key={h} style={styles.historyPill}>
                      <TouchableOpacity style={styles.historyPillButton} onPress={() => selectQuery(h)}>
                        <Ionicons name="time-outline" size={14} color={COLORS.muted} />
                        <Text style={styles.historyText}>{h}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => clearHistoryItem(h)} style={styles.historyCloseButton}>
                        <Ionicons name="close" size={14} color={COLORS.muted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
          </ScrollView>
        ) : (
          <View style={styles.results}>
            {/* Result count & Clear filter */}
            <Animated.View entering={FadeIn} style={styles.resultHeader}>
              <Text style={styles.resultCount}>
                {isLoading ? 'Searching...' : `${data?.total ?? 0} results ${query ? `for "${query}"` : ''}`}
              </Text>
              {(query || activeCategory !== 'all') && (
                <TouchableOpacity onPress={() => { setQuery(''); setActiveCategory('all'); setFilters({}); }}>
                  <Text style={styles.clearAllBtn}>Clear all</Text>
                </TouchableOpacity>
              )}
            </Animated.View>

            {(() => {
              const ListComponent = FlashList as any;
              return (
                <ListComponent
                  data={isLoading ? Array.from({ length: 6 }) : (data?.products ?? [])}
                  numColumns={2}
                  masonry
                  estimatedItemSize={280}
                  contentContainerStyle={styles.grid}
                  renderItem={({ item, index }: any) => {
                    if (isLoading) {
                      return (
                        <View style={styles.gridItem}>
                          <ProductCardSkeleton />
                        </View>
                      );
                    }
                    const itemIndex = index ?? 0;
                    // Alternate aspect ratios to give a beautiful magazine staggered feel
                    const aspect = itemIndex % 3 === 0 ? 1.2 : itemIndex % 3 === 1 ? 1.45 : 1.32;
                    return (
                      <View style={styles.gridItem}>
                        <ProductCard
                          product={item as any}
                          width={(SCREEN_WIDTH - 44) / 2}
                          aspectRatio={aspect}
                        />
                      </View>
                    );
                  }}
                  ListEmptyComponent={
                    !isLoading ? (
                      <View style={styles.noResults}>
                        <Ionicons name="sad-outline" size={48} color={COLORS.muted} />
                        <Text style={styles.noResultsText}>No results found</Text>
                        <Text style={styles.noResultsSubtext}>Try adjusting your keywords or category filters</Text>
                      </View>
                    ) : null
                  }
                />
              );
            })()}
          </View>
        )}

        {/* ─── Filter Modal ─── */}
        <FilterModal
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          onApply={(f) => { setFilters(f); setShowFilters(false); }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FilterModal({ visible, onClose, onApply }: {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: SearchFilters) => void;
}) {
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('1000');
  const [minRating, setMinRating] = useState(0);

  const RATINGS = [4.5, 4.0, 3.5];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={filterStyles.container}>
        <View style={filterStyles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.foreground} />
          </TouchableOpacity>
          <Text style={filterStyles.title}>Filters</Text>
          <TouchableOpacity onPress={() => onApply({})}>
            <Text style={filterStyles.reset}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={filterStyles.body}>
          <Text style={filterStyles.label}>Price Range</Text>
          <View style={filterStyles.priceInputs}>
            <TextInput
              style={filterStyles.priceInput}
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
              placeholder="Min"
              placeholderTextColor={COLORS.muted}
            />
            <Text style={filterStyles.dash}>—</Text>
            <TextInput
              style={filterStyles.priceInput}
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
              placeholder="Max"
              placeholderTextColor={COLORS.muted}
            />
          </View>

          <Text style={filterStyles.label}>Minimum Rating</Text>
          <View style={filterStyles.ratings}>
            {RATINGS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[filterStyles.ratingChip, minRating === r && filterStyles.ratingChipActive]}
                onPress={() => setMinRating(r === minRating ? 0 : r)}
              >
                <Ionicons name="star" size={12} color={minRating === r ? '#fff' : COLORS.warning} />
                <Text style={[filterStyles.ratingText, minRating === r && { color: '#fff' }]}>{r}+</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={filterStyles.applyBtn}
          onPress={() => onApply({ minPrice: +minPrice, maxPrice: +maxPrice, minRating: minRating || undefined })}
        >
          <Text style={filterStyles.applyText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerTitleContainer: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  premiumHeaderTitle: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.foreground,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
  },
  premiumHeaderSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 16,
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    height: 48,
    ...SHADOWS.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.foreground,
    fontFamily: FONTS.regular,
  },
  visualBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: `${COLORS.primary}35`,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  visualBtnLoading: { opacity: 0.5 },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  filterBtnActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}15` },
  visualResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SPACING.base,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    marginBottom: 8,
  },
  visualResultText: { flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.primary, fontFamily: FONTS.medium },
  suggestions: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
    overflow: 'hidden',
    zIndex: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.regular },
  
  categories: { paddingHorizontal: SPACING.base, gap: 10, paddingVertical: 2 },
  catCard: {
    width: 100,
    height: 52,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catCardActive: {
    borderColor: COLORS.primary,
    ...SHADOWS.primary,
  },
  catCardText: {
    color: '#E0E0E0',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    zIndex: 1,
  },
  catCardTextActive: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },

  emptyState: { paddingHorizontal: SPACING.base, paddingTop: SPACING.sm, paddingBottom: SPACING['3xl'] },
  sectionTitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.foreground,
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  gridCatCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  gridCatCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridCatCardText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.bold,
  },
  gridCatCardSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  
  vibesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vibePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  vibeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.foregroundSecondary,
    fontFamily: FONTS.medium,
  },

  historySection: {
    width: '100%',
  },
  historyItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  historyPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 8,
  },
  historyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.foregroundSecondary,
    fontFamily: FONTS.regular,
  },
  historyCloseButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },

  results: { flex: 1 },
  resultHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.base, 
    paddingBottom: SPACING.sm 
  },
  resultCount: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.medium },
  clearAllBtn: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontFamily: FONTS.semiBold },
  grid: { paddingHorizontal: 12, paddingBottom: SPACING['3xl'] },
  gridItem: { padding: 4 },
  noResults: { alignItems: 'center', paddingTop: SPACING['5xl'], paddingHorizontal: SPACING['2xl'] },
  noResultsText: { fontSize: FONT_SIZES.lg, color: COLORS.foreground, fontFamily: FONTS.semiBold, marginTop: 16 },
  noResultsSubtext: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.regular, marginTop: 8, textAlign: 'center' },
});

const filterStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: SPACING.xl,
  },
  title: { fontSize: FONT_SIZES.lg, color: COLORS.foreground, fontFamily: FONTS.bold },
  reset: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontFamily: FONTS.semiBold },
  body: { padding: SPACING.base, gap: 16 },
  label: { fontSize: FONT_SIZES.base, color: COLORS.foreground, fontFamily: FONTS.semiBold, marginBottom: 8 },
  priceInputs: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceInput: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: FONT_SIZES.base,
    color: COLORS.foreground,
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'center',
  },
  dash: { fontSize: FONT_SIZES.lg, color: COLORS.muted },
  ratings: { flexDirection: 'row', gap: 10 },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ratingChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  ratingText: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.semiBold },
  applyBtn: {
    margin: SPACING.base,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyText: { fontSize: FONT_SIZES.md, color: '#fff', fontFamily: FONTS.bold },
});

