import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

const MOCK_ORDER = {
  id: 'ORD-001',
  customer: 'Amali Perera',
  phone: '+94 71 234 5678',
  address: { street: '12 Galle Road', city: 'Colombo 03', province: 'Western Province', postal_code: '00300' },
  items: [
    { product_name: 'Silk Wrap Dress', size: 'M', qty: 1, price: 14500 },
    { product_name: 'Floral Midi Skirt', size: 'S', qty: 1, price: 7200 },
  ],
  total: 21700,
  status: 'pending' as OrderStatus,
  promo_code: 'SAVE10',
  created_at: '2026-06-06T10:30:00Z',
};

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];
const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  pending: 'confirmed',
  confirmed: 'shipped',
  shipped: 'delivered',
  delivered: null,
  cancelled: null,
};

const statusColor: Record<string, string> = {
  pending: Colors.pending,
  confirmed: Colors.confirmed,
  shipped: Colors.shipped,
  delivered: Colors.delivered,
  cancelled: Colors.cancelled,
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const order = MOCK_ORDER; // In real app, fetch by id

  const statusIdx = STATUS_STEPS.indexOf(order.status as any);
  const nextStatus = STATUS_NEXT[order.status];

  const handleUpdateStatus = () => {
    if (!nextStatus) return;
    Alert.alert('Update Status', `Move order to "${nextStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: () => Alert.alert('✅', `Order status updated to ${nextStatus}`) },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'This will cancel the order. Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: () => Alert.alert('Order cancelled') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Order ID & Date */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.orderId}>#{order.id}</Text>
            <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColor[order.status] + '22' }]}>
            <Text style={[styles.badgeText, { color: statusColor[order.status] }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Status Stepper */}
        {order.status !== 'cancelled' && (
          <View style={styles.stepper}>
            {STATUS_STEPS.map((step, i) => (
              <View key={step} style={styles.stepWrapper}>
                <View style={styles.stepRow}>
                  {i > 0 && (
                    <View style={[styles.stepLine, i <= statusIdx && { backgroundColor: Colors.accent }]} />
                  )}
                  <View style={[
                    styles.stepDot,
                    i <= statusIdx && { backgroundColor: Colors.accent, borderColor: Colors.accent }
                  ]}>
                    {i < statusIdx && <Ionicons name="checkmark" size={12} color="#fff" />}
                    {i === statusIdx && <View style={styles.stepActiveDot} />}
                  </View>
                  {i < STATUS_STEPS.length - 1 && (
                    <View style={[styles.stepLine, i < statusIdx && { backgroundColor: Colors.accent }]} />
                  )}
                </View>
                <Text style={[styles.stepLabel, i <= statusIdx && { color: Colors.text }]}>
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Items */}
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <View style={styles.itemIcon}>
              <Ionicons name="shirt-outline" size={22} color={Colors.textMuted} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemMeta}>Size: {item.size} · Qty: {item.qty}</Text>
            </View>
            <Text style={styles.itemPrice}>LKR {item.price.toLocaleString()}</Text>
          </View>
        ))}

        {/* Customer Info */}
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.card}>
          <Text style={styles.cardLine}><Text style={styles.cardLabel}>Name: </Text>{order.customer}</Text>
          <Text style={styles.cardLine}><Text style={styles.cardLabel}>Phone: </Text>{order.phone}</Text>
          <Text style={styles.cardLine}>
            <Text style={styles.cardLabel}>Address: </Text>
            {order.address.street}, {order.address.city}, {order.address.province}
          </Text>
        </View>

        {/* Summary */}
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>LKR {order.total.toLocaleString()}</Text>
          </View>
          {order.promo_code && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Promo ({order.promo_code})</Text>
              <Text style={[styles.summaryValue, { color: Colors.green }]}>-LKR 2,170</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>LKR {order.total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {nextStatus && (
            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateStatus} activeOpacity={0.85}>
              <Ionicons name="arrow-forward-circle-outline" size={18} color="#fff" />
              <Text style={styles.updateBtnText}>Move to {nextStatus}</Text>
            </TouchableOpacity>
          )}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
              <Text style={styles.cancelBtnText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  orderId: { fontSize: 20, fontWeight: '800', color: Colors.text },
  orderDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  badgeText: { fontSize: 11, fontWeight: '700' },
  stepper: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 24,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
  },
  stepWrapper: { alignItems: 'center', flex: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  stepActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  stepLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 4, fontWeight: '600', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10, marginTop: 4 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: 12, marginBottom: Spacing.sm,
  },
  itemIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  itemMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: Colors.text },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: 20, gap: 8,
  },
  cardLine: { fontSize: 13, color: Colors.text },
  cardLabel: { color: Colors.textMuted, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: Colors.textMuted },
  summaryValue: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  summaryTotal: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 15, fontWeight: '800', color: Colors.text },
  actions: { gap: 12 },
  updateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.accent, borderRadius: Radius.lg, height: 52, gap: 8,
  },
  updateBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: {
    borderRadius: Radius.lg, height: 52, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.cancelled,
  },
  cancelBtnText: { color: Colors.cancelled, fontWeight: '700', fontSize: 15 },
});
