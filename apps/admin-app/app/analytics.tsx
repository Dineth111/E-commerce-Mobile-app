import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';

const { width } = Dimensions.get('window');

const STATS = [
  { label: 'Total Revenue', value: 'LKR 1.2M', change: '+12%', icon: 'cash-outline', color: Colors.green },
  { label: 'Total Orders', value: '342', change: '+8%', icon: 'cart-outline', color: Colors.blue },
  { label: 'Avg Order Value', value: 'LKR 3,508', change: '+5%', icon: 'trending-up-outline', color: Colors.amber },
  { label: 'Total Users', value: '128', change: '+22%', icon: 'people-outline', color: Colors.accent },
];

const TOP_PRODUCTS = [
  { name: 'Silk Wrap Dress', sales: 42, revenue: 609000 },
  { name: 'Leather Biker Jacket', sales: 28, revenue: 809200 },
  { name: 'Floral Midi Skirt', sales: 61, revenue: 439200 },
  { name: 'Cashmere Turtleneck', sales: 19, revenue: 353400 },
];

const STATUS_DATA = [
  { status: 'Delivered', count: 180, color: Colors.delivered },
  { status: 'Shipped', count: 72, color: Colors.shipped },
  { status: 'Confirmed', count: 55, color: Colors.confirmed },
  { status: 'Pending', count: 28, color: Colors.pending },
  { status: 'Cancelled', count: 7, color: Colors.cancelled },
];

const totalOrders = STATUS_DATA.reduce((s, d) => s + d.count, 0);

export default function AnalyticsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {STATS.map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '22' }]}>
                <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[styles.statChange, { color: Colors.green }]}>{stat.change} this month</Text>
            </View>
          ))}
        </View>

        {/* Order Status Breakdown */}
        <Text style={styles.sectionTitle}>Order Status</Text>
        <View style={styles.card}>
          {/* Bar chart using flex widths */}
          <View style={styles.barChart}>
            {STATUS_DATA.map(d => (
              <View
                key={d.status}
                style={[styles.barSegment, {
                  width: `${(d.count / totalOrders * 100).toFixed(0)}%` as any,
                  backgroundColor: d.color,
                }]}
              />
            ))}
          </View>
          {STATUS_DATA.map(d => (
            <View key={d.status} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: d.color }]} />
              <Text style={styles.legendLabel}>{d.status}</Text>
              <Text style={styles.legendCount}>{d.count}</Text>
              <Text style={styles.legendPct}>({(d.count / totalOrders * 100).toFixed(0)}%)</Text>
            </View>
          ))}
        </View>

        {/* Top Products */}
        <Text style={styles.sectionTitle}>Top Products</Text>
        {TOP_PRODUCTS.map((p, i) => (
          <View key={p.name} style={styles.productRow}>
            <View style={styles.productRank}>
              <Text style={styles.rankText}>#{i + 1}</Text>
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{p.name}</Text>
              <Text style={styles.productMeta}>{p.sales} sales</Text>
            </View>
            <Text style={styles.productRevenue}>LKR {p.revenue.toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.text },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: 48, paddingTop: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    width: '47%', backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  statChange: { fontSize: 10, fontWeight: '600' },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: 24,
  },
  barChart: {
    flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden',
    marginBottom: 16,
  },
  barSegment: { height: '100%' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabel: { flex: 1, fontSize: 13, color: Colors.text },
  legendCount: { fontSize: 13, fontWeight: '700', color: Colors.text, marginRight: 4 },
  legendPct: { fontSize: 11, color: Colors.textMuted },
  productRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: 12, marginBottom: Spacing.sm,
  },
  productRank: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  rankText: { fontSize: 13, fontWeight: '800', color: Colors.accent },
  productInfo: { flex: 1 },
  productName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  productMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  productRevenue: { fontSize: 12, fontWeight: '700', color: Colors.green },
});
