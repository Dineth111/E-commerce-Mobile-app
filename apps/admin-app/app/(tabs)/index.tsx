import { ScrollView, View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';

const STATS = [
  { label: "Today's Orders", value: '12', icon: 'cart', color: Colors.blue },
  { label: 'Revenue', value: 'LKR 45,600', icon: 'cash', color: Colors.green },
  { label: 'Pending', value: '5', icon: 'time', color: Colors.amber },
  { label: 'Total Users', value: '128', icon: 'people', color: Colors.red },
];

const RECENT_ORDERS = [
  { id: 'ORD-001ABC', customer: 'Amali Perera', total: 8500, status: 'pending', time: '5 min ago' },
  { id: 'ORD-002DEF', customer: 'Kasun Silva', total: 12400, status: 'confirmed', time: '23 min ago' },
  { id: 'ORD-003GHI', customer: 'Nisha Fernando', total: 3200, status: 'shipped', time: '1 hr ago' },
];

const statusColor: Record<string, string> = {
  pending: Colors.pending,
  confirmed: Colors.confirmed,
  shipped: Colors.shipped,
  delivered: Colors.delivered,
  cancelled: Colors.cancelled,
};

export default function DashboardScreen() {
  const router = useRouter();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: stat.color + '22' }]}>
                <Ionicons name={stat.icon as any} size={22} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Orders */}
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {RECENT_ORDERS.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            onPress={() => router.push(`/order/${order.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.orderTop}>
              <Text style={styles.orderId}>#{order.id}</Text>
              <Text style={styles.orderTime}>{order.time}</Text>
            </View>
            <View style={styles.orderBottom}>
              <Text style={styles.orderCustomer}>{order.customer}</Text>
              <View style={styles.orderRight}>
                <Text style={styles.orderTotal}>LKR {order.total.toLocaleString()}</Text>
                <View style={[styles.badge, { backgroundColor: statusColor[order.status] + '22' }]}>
                  <Text style={[styles.badgeText, { color: statusColor[order.status] }]}>
                    {order.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
  header: { paddingTop: Spacing.lg, marginBottom: Spacing.xl },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  date: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  statLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontSize: 13, fontWeight: '700', color: Colors.text },
  orderTime: { fontSize: 12, color: Colors.textMuted },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderCustomer: { fontSize: 14, color: Colors.textMuted },
  orderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderTotal: { fontSize: 14, fontWeight: '700', color: Colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  badgeText: { fontSize: 10, fontWeight: '700' },
});
