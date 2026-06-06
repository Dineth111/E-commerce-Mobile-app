import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface MockOrder {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: OrderStatus;
  time: string;
}

const MOCK_ORDERS: MockOrder[] = [
  { id: 'ORD-001', customer: 'Amali Perera', items: 2, total: 8500, status: 'pending', time: '5 min ago' },
  { id: 'ORD-002', customer: 'Kasun Silva', items: 1, total: 14500, status: 'confirmed', time: '23 min ago' },
  { id: 'ORD-003', customer: 'Nisha Fernando', items: 3, total: 22800, status: 'shipped', time: '1 hr ago' },
  { id: 'ORD-004', customer: 'Ruwan Jayawardena', items: 1, total: 9800, status: 'delivered', time: '2 hr ago' },
  { id: 'ORD-005', customer: 'Dilini Rathnayake', items: 2, total: 31200, status: 'cancelled', time: '3 hr ago' },
  { id: 'ORD-006', customer: 'Chamara Wickrama', items: 1, total: 7200, status: 'pending', time: '4 hr ago' },
];

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

  const filtered = active === 'all' ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.status === active);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.count}>{filtered.length} orders</Text>
      </View>

      {/* Filter pills */}
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

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/order/${item.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <Text style={styles.orderId}>#{item.id}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            <View style={styles.cardMid}>
              <Text style={styles.customer}>{item.customer}</Text>
              <Text style={styles.items}>{item.items} item{item.items > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.cardBot}>
              <Text style={styles.total}>LKR {item.total.toLocaleString()}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor[item.status] + '22' }]}>
                <Text style={[styles.badgeText, { color: statusColor[item.status] }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
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
  filtersContainer: { paddingHorizontal: Spacing.lg, paddingBottom: 12, gap: 8, flexDirection: 'row' },
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
