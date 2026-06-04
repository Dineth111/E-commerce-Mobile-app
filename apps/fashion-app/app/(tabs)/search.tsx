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
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';
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
  { id: 'activewear', label: 'Active' },
];

const SEARCH_HISTORY = ['Silk midi dress', 'Leather jacket', 'Linen trousers', 'Gold earrings'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [showFilters, setShowFilters] = useState(false);
  const [visualSearchLoading, setVisualSearchLoading] = useState(false);
  const [visualResult, setVisualResult] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  const hasQuery = query.trim().length > 0 || activeCategory !== 'all';

  const { data, isLoading, isFetching } = useQuery({
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
        setQuery(items[0]?.type ?? '');
      } finally {
        setVisualSearchLoading(false);
      }
    }
  };

  const renderProduct = useCallback(({ item }: any) => (
    <ProductCard product={item} width={(SCREEN_WIDTH - 48) / 2} />
  ), []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={18} color={COLORS.muted} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={query}
              onChangeText={handleQueryChange}
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
              <TouchableOpacity key={s} style={styles.suggestionItem} onPress={() => { setQuery(s); setSuggestions([]); }}>
                <Ionicons name="search-outline" size={14} color={COLORS.muted} />
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* ─── Category Pills ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {FILTER_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catPill, activeCategory === cat.id && styles.catPillActive]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveCategory(cat.id);
              }}
            >
              <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ─── Results or Empty State ─── */}
        {!hasQuery ? (
          <ScrollView contentContainerStyle={styles.emptyState}>
            <Text style={styles.emptyTitle}>✦ Discover Fashion</Text>
            <Text style={styles.emptySubtitle}>Search or browse by category</Text>
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Recent Searches</Text>
              {SEARCH_HISTORY.map((h) => (
                <TouchableOpacity key={h} style={styles.historyItem} onPress={() => setQuery(h)}>
                  <Ionicons name="time-outline" size={16} color={COLORS.muted} />
                  <Text style={styles.historyText}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.results}>
            {/* Result count */}
            {!isLoading && data && (
              <Animated.View entering={FadeIn} style={styles.resultHeader}>
                <Text style={styles.resultCount}>
                  {data.total} results {query ? `for "${query}"` : ''}
                </Text>
              </Animated.View>
            )}

            <FlashList
              data={isLoading ? Array.from({ length: 6 }) : (data?.products ?? [])}
              numColumns={2}
              estimatedItemSize={280}
              contentContainerStyle={styles.grid}
              renderItem={({ item, index }) =>
                isLoading ? (
                  <View key={index} style={styles.gridItem}>
                    <ProductCardSkeleton />
                  </View>
                ) : (
                  <View style={styles.gridItem}>
                    <ProductCard product={item as any} width={(SCREEN_WIDTH - 48) / 2} />
                  </View>
                )
              }
              ListEmptyComponent={
                !isLoading ? (
                  <View style={styles.noResults}>
                    <Text style={styles.noResultsText}>No results found</Text>
                    <Text style={styles.noResultsSubtext}>Try a different search or category</Text>
                  </View>
                ) : null
              }
            />
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
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.foreground,
    fontFamily: FONTS.regular,
  },
  visualBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  visualBtnLoading: { opacity: 0.5 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtnActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}10` },
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
  categories: { paddingHorizontal: SPACING.base, gap: 8, paddingVertical: 4 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catPillActive: { backgroundColor: `${COLORS.primary}15`, borderColor: COLORS.primary },
  catLabel: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.medium },
  catLabelActive: { color: COLORS.primary, fontFamily: FONTS.semiBold },
  emptyState: { paddingHorizontal: SPACING.base, paddingTop: SPACING['3xl'], alignItems: 'center' },
  emptyTitle: { fontSize: FONT_SIZES.xl, color: COLORS.foreground, fontFamily: FONTS.bold, marginBottom: 6 },
  emptySubtitle: { fontSize: FONT_SIZES.base, color: COLORS.muted, fontFamily: FONTS.regular, marginBottom: SPACING['2xl'] },
  historySection: { width: '100%', gap: 4 },
  historyTitle: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.semiBold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  historyText: { fontSize: FONT_SIZES.base, color: COLORS.foreground, fontFamily: FONTS.regular },
  results: { flex: 1 },
  resultHeader: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm },
  resultCount: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.medium },
  grid: { paddingHorizontal: SPACING.base, paddingBottom: SPACING['3xl'] },
  gridItem: { paddingVertical: 6, paddingHorizontal: 4 },
  noResults: { alignItems: 'center', paddingTop: SPACING['5xl'] },
  noResultsText: { fontSize: FONT_SIZES.lg, color: COLORS.foreground, fontFamily: FONTS.semiBold },
  noResultsSubtext: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.regular, marginTop: 8 },
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
