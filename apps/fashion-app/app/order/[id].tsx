import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { supabase } from '@/services/supabase';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import type { OrderStatus } from '@/types';

interface OrderDetail {
  id: string;
  status: OrderStatus;
  items: Array<{
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
    image_url?: string;
  }>;
  total_amount: number;
  shipping_address: string;
  created_at: string;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchOrder() {
      try {
        const { data, error: fetchErr } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchErr) throw fetchErr;
        setOrder(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();

    // ─── Realtime status subscription ───
    const channel = supabase
      .channel(`order-detail-${id}-${Math.random().toString(36).substring(7)}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const updatedOrder = payload.new as OrderDetail;
          setOrder(updatedOrder);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading tracking data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Error</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error || 'Order not found'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const steps: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
    { status: 'pending', label: 'Order Placed', desc: 'Awaiting shop confirmation', icon: 'receipt-outline' },
    { status: 'confirmed', label: 'Confirmed', desc: 'Preparing your premium pieces', icon: 'checkmark-done-outline' },
    { status: 'shipped', label: 'Shipped', desc: 'Handed over to carrier', icon: 'airplane-outline' },
    { status: 'delivered', label: 'Delivered', desc: 'Successfully arrived at location', icon: 'gift-outline' },
  ];

  // Helper to determine status indices
  const getStatusIndex = (currentStatus: OrderStatus): number => {
    switch (currentStatus) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStatusIndex = getStatusIndex(order.status);
  const shortId = `#${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={22} color={COLORS.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Track Order</Text>
          <Text style={styles.headerSubtitle}>{shortId}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cancelled Banner */}
        {order.status === 'cancelled' && (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle-outline" size={24} color={COLORS.error} />
            <View>
              <Text style={styles.cancelledTitle}>Order Cancelled</Text>
              <Text style={styles.cancelledDesc}>This order has been cancelled and refunded.</Text>
            </View>
          </View>
        )}

        {/* ─── Tracking Timeline ─── */}
        <Animated.View entering={FadeIn} style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Progress</Text>
          
          <View style={styles.timeline}>
            {steps.map((step, index) => {
              const isCompleted = order.status !== 'cancelled' && index < currentStatusIndex;
              const isActive = order.status !== 'cancelled' && index === currentStatusIndex;
              const isPending = order.status === 'cancelled' || index > currentStatusIndex;

              return (
                <View key={step.status} style={styles.timelineRow}>
                  {/* Circle & Line */}
                  <View style={styles.leftLineCol}>
                    <View
                      style={[
                        styles.timelineCircle,
                        isCompleted && styles.circleCompleted,
                        isActive && styles.circleActive,
                        isPending && styles.circlePending,
                      ]}
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      ) : (
                        <Ionicons
                          name={step.icon}
                          size={16}
                          color={isActive ? '#fff' : COLORS.muted}
                        />
                      )}
                    </View>
                    
                    {/* Connecting line */}
                    {index < steps.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          index < currentStatusIndex && !isPending
                            ? styles.lineCompleted
                            : styles.linePending,
                        ]}
                      />
                    )}
                  </View>

                  {/* Step Description */}
                  <View style={styles.rightContentCol}>
                    <Text
                      style={[
                        styles.stepLabel,
                        isActive && styles.stepLabelActive,
                        isCompleted && styles.stepLabelCompleted,
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ─── Order Items ─── */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          {order.items.map((item, idx) => (
            <View key={`${item.product_id}-${idx}`} style={styles.itemRow}>
              <Image
                source={{ uri: item.image_url }}
                style={styles.itemImage}
                contentFit="cover"
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  Qty: {item.quantity} · Size: {item.size || 'N/A'} · Color: {item.color || 'N/A'}
                </Text>
              </View>
              <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalPrice}>${order.total_amount.toFixed(2)}</Text>
          </View>
        </Animated.View>

        {/* ─── Shipping Address ─── */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
          <Text style={styles.sectionTitle}>Shipping Details</Text>
          <View style={styles.detailsRow}>
            <Ionicons name="location-outline" size={20} color={COLORS.muted} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{order.shipping_address}</Text>
            </View>
          </View>

          <View style={[styles.detailsRow, { marginTop: 12 }]}>
            <Ionicons name="time-outline" size={20} color={COLORS.muted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Placed On</Text>
              <Text style={styles.detailValue}>
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} at {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  loadingText: { color: COLORS.muted, marginTop: 12, fontFamily: FONTS.medium },
  errorText: { color: COLORS.error, marginTop: 12, textAlign: 'center', fontFamily: FONTS.medium, marginBottom: 16 },
  backBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.md },
  backBtnText: { color: '#fff', fontFamily: FONTS.bold },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: { fontSize: FONT_SIZES.lg, color: COLORS.foreground, fontFamily: FONTS.bold },
  headerSubtitle: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.regular },
  
  scroll: { padding: SPACING.base, gap: SPACING.base },
  
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.errorBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  cancelledTitle: { color: COLORS.error, fontSize: FONT_SIZES.base, fontFamily: FONTS.bold },
  cancelledDesc: { color: COLORS.foregroundSecondary, fontSize: FONT_SIZES.sm, fontFamily: FONTS.regular, marginTop: 2 },
  
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: FONT_SIZES.base, color: COLORS.foreground, fontFamily: FONTS.bold, marginBottom: SPACING.md },
  
  // Timeline Styles
  timeline: { paddingLeft: 8, paddingVertical: 4 },
  timelineRow: { flexDirection: 'row', gap: 16, minHeight: 70 },
  leftLineCol: { alignItems: 'center' },
  timelineCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 1,
  },
  circleCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.primary,
  },
  circleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  circlePending: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    position: 'absolute',
    top: 32,
    bottom: -10,
  },
  lineCompleted: { backgroundColor: COLORS.primary },
  linePending: { backgroundColor: COLORS.border },
  
  rightContentCol: { flex: 1, paddingTop: 4 },
  stepLabel: { fontSize: FONT_SIZES.base, color: COLORS.muted, fontFamily: FONTS.semiBold },
  stepLabelActive: { color: COLORS.primary, fontFamily: FONTS.bold },
  stepLabelCompleted: { color: COLORS.foreground },
  stepDesc: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.regular, marginTop: 2 },
  
  // Item Styles
  itemRow: { flexDirection: 'row', gap: 12, paddingVertical: 8, alignItems: 'center' },
  itemImage: { width: 48, height: 48, borderRadius: RADIUS.sm, backgroundColor: COLORS.surface2 },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.semiBold },
  itemMeta: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.regular },
  itemPrice: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.bold },
  
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: FONT_SIZES.base, color: COLORS.muted, fontFamily: FONTS.semiBold },
  totalPrice: { fontSize: FONT_SIZES.lg, color: COLORS.foreground, fontFamily: FONTS.bold },
  
  // Address Styles
  detailsRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  detailLabel: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.regular, marginTop: 2, lineHeight: 18 },
});
