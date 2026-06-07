import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

const STATUS_COLORS: Record<string, string> = {
  Delivered: Colors.delivered,
  Shipped: Colors.shipped,
  Confirmed: Colors.confirmed,
  Pending: Colors.pending,
  Cancelled: Colors.cancelled,
};

export default function AnalyticsScreen() {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics-real'],
    queryFn: async () => {
      const [ordersRes, profilesRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('profiles').select('*').eq('role', 'customer')
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const orders = ordersRes.data || [];
      const profiles = profilesRes.data || [];

      // Calculations
      const nonCancelledOrders = orders.filter((o: any) => o.status !== 'cancelled');
      const totalRevenue = nonCancelledOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
      const totalOrdersCount = orders.length;
      const avgOrderValue = nonCancelledOrders.length > 0 ? Math.round(totalRevenue / nonCancelledOrders.length) : 0;
      const totalUsersCount = profiles.length;

      // Group status counts
      const statusCounts: Record<string, number> = {
        delivered: 0,
        shipped: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0
      };
      orders.forEach((o: any) => {
        const s = (o.status || 'pending').toLowerCase();
        if (statusCounts[s] !== undefined) {
          statusCounts[s]++;
        }
      });

      // Calculate Top Products
      const productStats: Record<string, { name: string; sales: number; revenue: number }> = {};
      orders.forEach((o: any) => {
        if (o.status !== 'cancelled' && Array.isArray(o.items)) {
          o.items.forEach((item: any) => {
            const prodId = item.id || item.product_id || item.name || 'unknown';
            const name = item.name || item.product_name || 'Unknown Product';
            const price = item.price || 0;
            const qty = item.quantity || item.qty || 1;
            
            if (!productStats[prodId]) {
              productStats[prodId] = { name, sales: 0, revenue: 0 };
            }
            productStats[prodId].sales += qty;
            productStats[prodId].revenue += price * qty;
          });
        }
      });

      const topProducts = Object.values(productStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);

      return {
        totalRevenue,
        totalOrdersCount,
        avgOrderValue,
        totalUsersCount,
        statusCounts,
        topProducts
      };
    }
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  if (error || !analytics) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.cancelled} />
        <Text style={{ color: Colors.textMuted, marginTop: 12 }}>Failed to load analytics data</Text>
      </SafeAreaView>
    );
  }

  const STATS = [
    { label: 'Total Revenue', value: `LKR ${analytics.totalRevenue.toLocaleString()}`, change: '+12%', icon: 'cash-outline', color: Colors.green },
    { label: 'Total Orders', value: analytics.totalOrdersCount.toString(), change: '+8%', icon: 'cart-outline', color: Colors.blue },
    { label: 'Avg Order Value', value: `LKR ${analytics.avgOrderValue.toLocaleString()}`, change: '+5%', icon: 'trending-up-outline', color: Colors.amber },
    { label: 'Total Users', value: analytics.totalUsersCount.toString(), change: '+22%', icon: 'people-outline', color: Colors.accent },
  ];

  const STATUS_DATA = [
    { status: 'Delivered', count: analytics.statusCounts.delivered, color: Colors.delivered },
    { status: 'Shipped', count: analytics.statusCounts.shipped, color: Colors.shipped },
    { status: 'Confirmed', count: analytics.statusCounts.confirmed, color: Colors.confirmed },
    { status: 'Pending', count: analytics.statusCounts.pending, color: Colors.pending },
    { status: 'Cancelled', count: analytics.statusCounts.cancelled, color: Colors.cancelled },
  ];

  const chartTotal = STATUS_DATA.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
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
            {STATUS_DATA.map(d => {
              const pct = (d.count / chartTotal) * 100;
              if (pct === 0) return null;
              return (
                <View
                  key={d.status}
                  style={[styles.barSegment, {
                    width: `${pct.toFixed(1)}%` as any,
                    backgroundColor: d.color,
                  }]}
                />
              );
            })}
          </View>
          {STATUS_DATA.map(d => {
            const pct = ((d.count / chartTotal) * 100).toFixed(0);
            return (
              <View key={d.status} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                <Text style={styles.legendLabel}>{d.status}</Text>
                <Text style={styles.legendCount}>{d.count}</Text>
                <Text style={styles.legendPct}>({pct}%)</Text>
              </View>
            );
          })}
        </View>

        {/* Top Products */}
        <Text style={styles.sectionTitle}>Top Products</Text>
        {analytics.topProducts.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', padding: 24 }]}>
            <Ionicons name="shirt-outline" size={36} color={Colors.textMuted} />
            <Text style={{ color: Colors.textMuted, marginTop: 8 }}>No sales data available</Text>
          </View>
        ) : (
          analytics.topProducts.map((p, i) => (
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
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: 48, paddingTop: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    width: '47%', backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 2 },
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
