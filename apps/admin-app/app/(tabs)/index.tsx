import { useState } from 'react';
import { ScrollView, View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/useNotificationStore';

const statusColor: Record<string, string> = {
  pending: Colors.pending,
  confirmed: Colors.confirmed,
  shipped: Colors.shipped,
  delivered: Colors.delivered,
  cancelled: Colors.cancelled,
};

export default function DashboardScreen() {
  const router = useRouter();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const unreadCount = useNotificationStore((state) => state.notifications.filter((n) => !n.read).length);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [
        { count: pendingCount },
        { count: userCount },
        { count: todayCount, data: todayOrders },
        { data: recentOrders }
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('orders').select('total_amount', { count: 'exact' }).gte('created_at', startOfDay.toISOString()),
        supabase.from('orders').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(3)
      ]);

      const revenue = (todayOrders || []).reduce((sum, order) => sum + (order.total_amount || 0), 0);

      return {
        pendingCount: pendingCount || 0,
        userCount: userCount || 0,
        todayCount: todayCount || 0,
        revenue,
        recentOrders: recentOrders || []
      };
    }
  });

  const performSignOut = async () => {
    setShowSignOutModal(false);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleSignOut = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: performSignOut }
      ]);
    } else {
      setShowSignOutModal(true);
    }
  };

  const dashboardStats = [
    { label: "Today's Orders", value: stats?.todayCount?.toString() || '0', icon: 'cart', color: Colors.blue },
    { label: 'Today Revenue', value: `LKR ${stats?.revenue?.toLocaleString() || '0'}`, icon: 'cash', color: Colors.green },
    { label: 'Pending', value: stats?.pendingCount?.toString() || '0', icon: 'time', color: Colors.amber },
    { label: 'Total Customers', value: stats?.userCount?.toString() || '0', icon: 'people', color: Colors.red },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={styles.headerBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={24} color={Colors.text} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignOut} style={styles.headerBtn} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {dashboardStats.map((stat) => (
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
            {(stats?.recentOrders || []).map((order: any) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/order/${order.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={styles.orderTop}>
                  <Text style={styles.orderId}>#{order.id?.substring(0, 8).toUpperCase()}</Text>
                  <Text style={styles.orderTime}>{new Date(order.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.orderBottom}>
                  <Text style={styles.orderCustomer}>{order.profiles?.full_name || 'Guest Customer'}</Text>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderTotal}>LKR {(order.total_amount || 0).toLocaleString()}</Text>
                    <View style={[styles.badge, { backgroundColor: (statusColor[order.status] || Colors.textMuted) + '22' }]}>
                      <Text style={[styles.badgeText, { color: statusColor[order.status] || Colors.textMuted }]}>
                        {(order.status || 'pending').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {stats?.recentOrders?.length === 0 && (
              <Text style={{ color: Colors.textMuted, textAlign: 'center', marginTop: 20 }}>No recent orders.</Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Custom Sign Out Confirmation Modal */}
      <Modal transparent animationType="fade" visible={showSignOutModal} onRequestClose={() => setShowSignOutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={32} color={Colors.cancelled} />
            </View>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalSubtitle}>Are you sure you want to sign out of the admin panel?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowSignOutModal(false)} activeOpacity={0.8}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={performSignOut} activeOpacity={0.8}>
                <Text style={styles.modalConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
  header: { paddingTop: Spacing.lg, marginBottom: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  date: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.accent,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.bg,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
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
  // Sign out modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 28, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  modalIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.cancelled + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: { flex: 1, paddingVertical: 14, borderRadius: Radius.lg, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: Colors.text },
  modalConfirm: { flex: 1, paddingVertical: 14, borderRadius: Radius.lg, backgroundColor: Colors.cancelled, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
