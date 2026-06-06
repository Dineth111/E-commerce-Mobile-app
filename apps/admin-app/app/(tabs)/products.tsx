import { useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  Switch, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';

const MOCK_PRODUCTS = [
  { id: '1', name: 'Silk Wrap Dress', category: 'Dresses', price: 14500, stock: 23, is_active: true },
  { id: '2', name: 'Leather Biker Jacket', category: 'Jackets', price: 28900, stock: 8, is_active: true },
  { id: '3', name: 'Linen Wide-Leg Trousers', category: 'Bottoms', price: 9800, stock: 15, is_active: true },
  { id: '4', name: 'Cashmere Turtleneck', category: 'Tops', price: 18600, stock: 0, is_active: false },
  { id: '5', name: 'Floral Midi Skirt', category: 'Skirts', price: 7200, stock: 32, is_active: true },
];

export default function ProductsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState(MOCK_PRODUCTS);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );

  const toggleActive = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <Text style={styles.count}>{products.length} items</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productRow}
            onPress={() => router.push(`/product/${item.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.imgPlaceholder}>
              <Ionicons name="image-outline" size={24} color={Colors.textMuted} />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category}</Text>
              <Text style={styles.productPrice}>LKR {item.price.toLocaleString()}</Text>
            </View>
            <View style={styles.productRight}>
              <View style={[
                styles.stockBadge,
                { backgroundColor: item.stock > 0 ? Colors.green + '22' : Colors.cancelled + '22' }
              ]}>
                <Text style={[
                  styles.stockText,
                  { color: item.stock > 0 ? Colors.green : Colors.cancelled }
                ]}>
                  {item.stock > 0 ? `${item.stock} in stock` : 'Out'}
                </Text>
              </View>
              <Switch
                value={item.is_active}
                onValueChange={() => toggleActive(item.id)}
                trackColor={{ false: Colors.border, true: Colors.accent + '88' }}
                thumbColor={item.is_active ? Colors.accent : Colors.textMuted}
                style={{ transform: [{ scale: 0.85 }] }}
              />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/product/new' as any)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  count: { fontSize: 13, color: Colors.textMuted },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.surface2, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  productRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: 12, marginBottom: Spacing.sm,
  },
  imgPlaceholder: {
    width: 60, height: 60, borderRadius: Radius.md,
    backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  productCategory: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  productPrice: { fontSize: 13, fontWeight: '600', color: Colors.accent },
  productRight: { alignItems: 'flex-end', gap: 6 },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  stockText: { fontSize: 10, fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOpacity: 0.5,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
