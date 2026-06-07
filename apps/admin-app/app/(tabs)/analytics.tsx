import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

const CATEGORY_COLORS = [
  Colors.blue,
  Colors.amber,
  Colors.purple,
  Colors.accent,
  Colors.green,
];

export default function AnalyticsScreen() {
  const [timeFrame, setTimeFrame] = useState<'7d' | '30d'>('7d');
  const [selectedBar, setSelectedBar] = useState<{ date: string; amount: number; formattedDate: string } | null>(null);

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics-real-v2'],
    queryFn: async () => {
      const [ordersRes, profilesRes, productsRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('profiles').select('*').eq('role', 'customer'),
        supabase.from('products').select('id, category')
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (productsRes.error) throw productsRes.error;

      const orders = ordersRes.data || [];
      const profiles = profilesRes.data || [];
      const products = productsRes.data || [];

      // Create product to category mapping
      const categoryMap: Record<string, string> = {};
      products.forEach((p: any) => {
        categoryMap[p.id] = p.category || 'Other';
      });

      // Calculations
      const nonCancelledOrders = orders.filter((o: any) => o.status !== 'cancelled');
      const totalRevenue = nonCancelledOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
      const totalOrdersCount = orders.length;
      const cancelledOrdersCount = orders.filter((o: any) => o.status === 'cancelled').length;
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

      // Calculate Top Products & Categories
      const productStats: Record<string, { name: string; sales: number; revenue: number }> = {};
      const categoryStats: Record<string, { count: number; revenue: number }> = {};
      let totalCategoryItems = 0;

      orders.forEach((o: any) => {
        if (o.status !== 'cancelled' && Array.isArray(o.items)) {
          o.items.forEach((item: any) => {
            const prodId = item.id || item.product_id || item.name || 'unknown';
            const name = item.name || item.product_name || 'Unknown Product';
            const price = item.price || 0;
            const qty = item.quantity || item.qty || 1;
            
            // Product Stats
            if (!productStats[prodId]) {
              productStats[prodId] = { name, sales: 0, revenue: 0 };
            }
            productStats[prodId].sales += qty;
            productStats[prodId].revenue += price * qty;

            // Category Stats
            const category = categoryMap[item.product_id] || 'Other';
            if (!categoryStats[category]) {
              categoryStats[category] = { count: 0, revenue: 0 };
            }
            categoryStats[category].count += qty;
            categoryStats[category].revenue += price * qty;
            totalCategoryItems += qty;
          });
        }
      });

      const topProducts = Object.values(productStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);

      const categoriesBreakdown = Object.entries(categoryStats).map(([name, stats]) => ({
        name,
        count: stats.count,
        revenue: stats.revenue,
        percentage: totalCategoryItems > 0 ? Math.round((stats.count / totalCategoryItems) * 100) : 0
      })).sort((a, b) => b.revenue - a.revenue);

      // Generate daily trend data arrays
      const generateDailyData = (numDays: number) => {
        const data = [];
        for (let i = numDays - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          data.push({
            date: dateKey,
            amount: 0,
            formattedDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          });
        }
        return data;
      };

      const daily7d = generateDailyData(7);
      const daily30d = generateDailyData(30);

      orders.forEach((o: any) => {
        if (o.status !== 'cancelled') {
          const orderDate = new Date(o.created_at);
          const dateKey = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const amount = o.total_amount || 0;

          const day7 = daily7d.find(d => d.date === dateKey);
          if (day7) day7.amount += amount;

          const day30 = daily30d.find(d => d.date === dateKey);
          if (day30) day30.amount += amount;
        }
      });

      return {
        totalRevenue,
        totalOrdersCount,
        cancelledOrdersCount,
        avgOrderValue,
        totalUsersCount,
        statusCounts,
        topProducts,
        categoriesBreakdown,
        daily7d,
        daily30d
      };
    }
  });

  const chartData = useMemo(() => {
    if (!analytics) return [];
    return timeFrame === '7d' ? analytics.daily7d : analytics.daily30d;
  }, [analytics, timeFrame]);

  const maxChartValue = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.amount), 0);
    return max === 0 ? 1 : max;
  }, [chartData]);

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

  const cancellationRate = analytics.totalOrdersCount > 0 
    ? Math.round((analytics.cancelledOrdersCount / analytics.totalOrdersCount) * 100) 
    : 0;

  const STATS = [
    { label: 'Total Revenue', value: `LKR ${analytics.totalRevenue.toLocaleString()}`, subText: 'All completed sales', icon: 'cash-outline', color: Colors.green },
    { label: 'Total Orders', value: analytics.totalOrdersCount.toString(), subText: `${analytics.cancelledOrdersCount} cancelled orders`, icon: 'cart-outline', color: Colors.blue },
    { label: 'Avg Order Value', value: `LKR ${analytics.avgOrderValue.toLocaleString()}`, subText: 'Revenue per transaction', icon: 'trending-up-outline', color: Colors.amber },
    { label: 'Cancellation Rate', value: `${cancellationRate}%`, subText: 'Percentage of order dropouts', icon: 'close-circle-outline', color: Colors.cancelled },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        
        {/* Time Frame Selector */}
        <View style={styles.timeFrameTabs}>
          <TouchableOpacity 
            style={[styles.tabButton, timeFrame === '7d' && styles.tabButtonActive]}
            onPress={() => { setTimeFrame('7d'); setSelectedBar(null); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, timeFrame === '7d' && styles.tabTextActive]}>7 Days</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, timeFrame === '30d' && styles.tabButtonActive]}
            onPress={() => { setTimeFrame('30d'); setSelectedBar(null); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, timeFrame === '30d' && styles.tabTextActive]}>30 Days</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Interactive Sales Trend Chart */}
        <Text style={styles.sectionTitle}>Sales Trend</Text>
        <View style={styles.chartCard}>
          {selectedBar ? (
            <View style={styles.chartTooltip}>
              <Text style={styles.tooltipDate}>{selectedBar.formattedDate}</Text>
              <Text style={styles.tooltipAmount}>LKR {selectedBar.amount.toLocaleString()}</Text>
            </View>
          ) : (
            <View style={styles.chartTooltipPlaceholder}>
              <Text style={styles.tooltipPlaceholderText}>Tap any bar to inspect daily sales</Text>
            </View>
          )}

          <View style={styles.chartContainer}>
            <View style={styles.barsContainer}>
              {chartData.map((d, index) => {
                const heightPercentage = (d.amount / maxChartValue) * 100;
                const isSelected = selectedBar?.date === d.date;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.barColumn}
                    onPress={() => setSelectedBar(d)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.barTrack}>
                      <View 
                        style={[
                          styles.barFill, 
                          { 
                            height: `${Math.max(heightPercentage, 5)}%`,
                            backgroundColor: isSelected ? Colors.accent : Colors.blue + '99',
                          }
                        ]} 
                      />
                    </View>
                    {timeFrame === '7d' && (
                      <Text style={[styles.barLabel, isSelected && styles.barLabelActive]}>
                        {d.date.split(' ')[1]}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          
          <View style={styles.chartFooter}>
            <Text style={styles.chartFooterText}>
              Showing daily revenue trends for the selected period
            </Text>
          </View>
        </View>

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
              <Text style={styles.statSubText}>{stat.subText}</Text>
            </View>
          ))}
        </View>

        {/* Category breakdown */}
        <Text style={styles.sectionTitle}>Sales by Category</Text>
        <View style={styles.card}>
          {analytics.categoriesBreakdown.length === 0 ? (
            <Text style={{ color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 }}>
              No categories data available
            </Text>
          ) : (
            analytics.categoriesBreakdown.map((cat, index) => {
              const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              return (
                <View key={cat.name} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryPercent}>{cat.percentage}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${cat.percentage}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={styles.categoryRevenue}>LKR {cat.revenue.toLocaleString()}</Text>
                </View>
              );
            })
          )}
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
                <Text style={styles.productMeta}>{p.sales} items sold</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: Spacing.lg, 
    paddingTop: Spacing.lg, 
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  timeFrameTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  tabButtonActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: 48, paddingTop: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12, marginTop: 8 },
  
  // Interactive Chart Card
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: 20,
  },
  chartTooltip: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 52,
    justifyContent: 'center',
  },
  tooltipDate: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  tooltipAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.accent,
  },
  chartTooltipPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 52,
  },
  tooltipPlaceholderText: {
    fontSize: 13,
    color: Colors.textDim,
    fontStyle: 'italic',
  },
  chartContainer: {
    height: 160,
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 4,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    justifyContent: 'space-between',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '60%',
    height: '90%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: Radius.sm,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textDim,
    marginTop: 6,
    fontWeight: '500',
  },
  barLabelActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  chartFooter: {
    marginTop: 12,
    alignItems: 'center',
  },
  chartFooterText: {
    fontSize: 11,
    color: Colors.textDim,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    width: '47%', backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  statSubText: { fontSize: 9, color: Colors.textDim },
  
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: 20,
  },

  // Category sales styles
  categoryRow: {
    marginBottom: 14,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  categoryPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.bg,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: Radius.full,
  },
  categoryRevenue: {
    fontSize: 11,
    color: Colors.green,
    fontWeight: '600',
    textAlign: 'right',
  },

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
