import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

const FILTERS: Array<{ label: string; value: OrderStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const statusColor: Record<string, string> = {
  pending: Colors.pending,
  confirmed: Colors.confirmed,
  shipped: Colors.shipped,
  delivered: Colors.delivered,
  cancelled: Colors.cancelled,
};

export default function OrdersScreen() {
  const router = useRouter();
  const [active, setActive] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      // In a real scenario, you'd fetch customer profiles too via a join
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });
        
      if (error && error.code !== '42P01') {
        console.error("Order fetch error", error);
      }
      return data || [];
    }
  });

  const filtered = orders.filter((o: any) => {
    const matchesStatus = active === 'all' || o.status === active;
    const matchesSearch = o.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.count}>{filtered.length} orders</Text>
      </View>

      {/* Premium Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID or customer..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor={Colors.accent}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter pills */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[styles.pill, active === f.value && styles.pillActive]}
              onPress={() => setActive(f.value)}
            >
              <Text style={[styles.pillText, active === f.value && styles.pillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
              <Text style={{ color: Colors.textMuted, marginTop: 12 }}>No orders found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/order/${item.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <Text style={styles.orderId}>#{item.id?.substring(0, 8).toUpperCase()}</Text>
                <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.cardMid}>
                <Text style={styles.customer}>{item.profiles?.full_name || 'Guest Customer'}</Text>
                <Text style={styles.items}>{item.items?.length || 1} item(s)</Text>
              </View>
              <View style={styles.cardBot}>
                <Text style={styles.total}>LKR {(item.total_amount || 0).toLocaleString()}</Text>
                <View style={[styles.badge, { backgroundColor: (statusColor[item.status] || Colors.textMuted) + '22' }]}>
                  <Text style={[styles.badgeText, { color: statusColor[item.status] || Colors.textMuted }]}>
                    {(item.status || 'pending').toUpperCase()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
  searchContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, height: 48,
    shadowColor: Colors.text, shadowOpacity: 0.05,
    shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15, height: '100%' },
  clearBtn: { padding: 4, marginLeft: 4 },
  filtersContainer: { paddingHorizontal: Spacing.lg, paddingBottom: 16, gap: 8, flexDirection: 'row' },
  pill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  pillTextActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, marginBottom: Spacing.sm,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  orderId: { fontSize: 13, fontWeight: '700', color: Colors.text },
  time: { fontSize: 12, color: Colors.textMuted },
  cardMid: { flexDirection: 'row', justifyContent: 'space-between' },
  customer: { fontSize: 14, fontWeight: '600', color: Colors.text },
  items: { fontSize: 13, color: Colors.textMuted },
  cardBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 15, fontWeight: '700', color: Colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: 10, fontWeight: '700' },
});
