import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useStyleProfileStore } from '@/stores/useStyleProfileStore';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useCartStore } from '@/stores/useCartStore';
import { ProductCard } from '@/components/product/ProductCard';
import { supabase } from '@/services/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderRow {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: { id: string; name?: string; image?: string }[] | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:   '#F59E0B',
  confirmed: '#3B82F6',
  shipped:   '#9B59B6',
  delivered: '#22C55E',
  cancelled: '#EF4444',
};

const FALLBACK_ORDER_IMAGE =
  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&q=80';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { profile, resetProfile } = useStyleProfileStore();
  const { items: wishlist } = useWishlistStore();
  const { totalItems } = useCartStore();
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'orders' | 'profile'>('profile');

  // Custom Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'confirm'>('info');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  const showCustomAlert = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType('info');
    setOnConfirmAction(null);
    setModalVisible(true);
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType('confirm');
    setOnConfirmAction(() => onConfirm);
    setModalVisible(true);
  };

  // ── Fetch real orders from Supabase ──────────────────────────────────────
  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
  } = useQuery<OrderRow[]>({
    queryKey: ['orders', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as OrderRow[]) ?? [];
    },
  });

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const PROFILE_TABS = [
    { id: 'profile',  label: 'Style Profile', icon: 'sparkles-outline' },
    { id: 'wardrobe', label: 'Wardrobe',       icon: 'heart-outline'   },
    { id: 'orders',   label: 'Orders',         icon: 'bag-outline'     },
  ] as const;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLogout = () => {
    showCustomConfirm(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      async () => {
        await logout();
      }
    );
  };

  const handleRetakeQuiz = () => {
    showCustomConfirm(
      'Retake Style Quiz',
      'This will reset your style profile. Continue to retake the quiz?',
      () => {
        resetProfile();
        router.push('/quiz');
      }
    );
  };

  const handleNotificationsPress = () => {
    showCustomAlert(
      'Notifications',
      'Push notifications are enabled. You can manage notification preferences in your device settings.'
    );
  };

  const handlePrivacyPress = () => {
    showCustomAlert(
      'Privacy Policy',
      'Your data is secured with end-to-end encryption. We respect your privacy and do not share your shopping preferences with third parties.'
    );
  };

  const handleHelpPress = () => {
    showCustomAlert(
      'Help & Support',
      'Contact support at support@voguefashion.com or call our hotline: +94 11 234 5678.'
    );
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Returns the first image URL found inside an order's items array, or a fallback. */
  const getOrderThumbnail = (order: OrderRow): string => {
    if (Array.isArray(order.items) && order.items.length > 0) {
      const firstImage = order.items[0]?.image;
      if (firstImage) return firstImage;
    }
    return FALLBACK_ORDER_IMAGE;
  };

  /** Counts the number of items in an order. */
  const getItemCount = (order: OrderRow): number =>
    Array.isArray(order.items) ? order.items.length : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ─── Profile Header ─── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: user?.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatItem label="Wishlist"   value={wishlist.length} />
            <View style={styles.statDivider} />
            <StatItem label="Cart Items" value={totalItems()} />
            <View style={styles.statDivider} />
            {/* Real order count — shows 0 while loading */}
            <StatItem label="Orders" value={ordersLoading ? 0 : orders.length} />
          </View>
        </Animated.View>

        {/* ─── Tabs ─── */}
        <View style={styles.tabs}>
          {PROFILE_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.id ? COLORS.primary : COLORS.muted}
              />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Tab Content ─── */}

        {/* ── Style Profile tab ── */}
        {activeTab === 'profile' && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
            {/* Style Profile Summary */}
            <View style={styles.profileCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Your Style DNA ✦</Text>
                <TouchableOpacity onPress={handleRetakeQuiz}>
                  <Text style={styles.editBtn}>Retake Quiz</Text>
                </TouchableOpacity>
              </View>

              <ProfileRow icon="body-outline"         label="Body Type"       value={profile.bodyType || 'Not set'} />
              <ProfileRow icon="color-palette-outline" label="Color Palette"  value={profile.colorPalette || 'Not set'} />
              <ProfileRow icon="wallet-outline"        label="Budget"         value={profile.budgetRange || 'Not set'} />
              <ProfileRow
                icon="heart-outline"
                label="Preferred Styles"
                value={profile.preferredStyles.length > 0 ? profile.preferredStyles.join(', ') : 'Not set'}
              />
              <ProfileRow
                icon="pricetag-outline"
                label="Favourite Brands"
                value={profile.favoriteBrands.length > 0 ? profile.favoriteBrands.slice(0, 3).join(', ') : 'Not set'}
              />
            </View>

            {/* Settings */}
            <View style={styles.settingsCard}>
              <Text style={styles.cardTitle}>Settings</Text>
              <SettingsRow icon="notifications-outline" label="Notifications" onPress={handleNotificationsPress} />
              <SettingsRow icon="shield-outline"        label="Privacy" onPress={handlePrivacyPress} />
              <SettingsRow icon="help-circle-outline"   label="Help & Support" onPress={handleHelpPress} />
              <TouchableOpacity style={[styles.settingsRow, styles.logoutRow]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                <Text style={[styles.settingsLabel, { color: COLORS.error }]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ── Wardrobe tab ── */}
        {activeTab === 'wardrobe' && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.wardrobeSection}>
            {wishlist.length === 0 ? (
              <View style={styles.emptyWardrobe}>
                <Text style={{ fontSize: 48 }}>🫶</Text>
                <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
                <Text style={styles.emptySubtitle}>Heart items to save them here</Text>
                <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/search')}>
                  <Text style={styles.shopBtnText}>Explore Fashion</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.grid}>
                {wishlist.map((p) => (
                  <ProductCard key={p.id} product={p} width={168} />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* ── Orders tab ── */}
        {activeTab === 'orders' && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>

            {/* Loading state */}
            {ordersLoading && (
              <View style={styles.ordersLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.ordersLoadingText}>Fetching your orders…</Text>
              </View>
            )}

            {/* Error state */}
            {!ordersLoading && ordersError && (
              <View style={styles.emptyOrders}>
                <Text style={{ fontSize: 40 }}>😕</Text>
                <Text style={styles.emptyTitle}>Couldn't load orders</Text>
                <Text style={styles.emptySubtitle}>Please try again later</Text>
              </View>
            )}

            {/* Empty state */}
            {!ordersLoading && !ordersError && orders.length === 0 && (
              <View style={styles.emptyOrders}>
                <Text style={{ fontSize: 48 }}>🛍️</Text>
                <Text style={styles.emptyTitle}>No orders yet</Text>
                <Text style={styles.emptySubtitle}>Your orders will appear here</Text>
                <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)')}>
                  <Text style={styles.shopBtnText}>Start Shopping</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Real orders list */}
            {!ordersLoading && !ordersError && orders.map((order) => {
              const statusColor = STATUS_COLORS[order.status] ?? COLORS.muted;
              const itemCount   = getItemCount(order);
              const shortId     = `#${order.id.slice(0, 8).toUpperCase()}`;
              const thumbnail   = getOrderThumbnail(order);

              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => router.push(`/order/${order.id}`)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: thumbnail }}
                    style={styles.orderImage}
                    contentFit="cover"
                  />
                  <View style={styles.orderInfo}>
                    <View style={styles.orderTop}>
                      <Text style={styles.orderId}>{shortId}</Text>
                      <View style={[styles.orderStatus, { backgroundColor: `${statusColor}20` }]}>
                        <Text style={[styles.orderStatusText, { color: statusColor }]}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.orderMeta}>
                      {itemCount} item{itemCount !== 1 ? 's' : ''} · ${order.total_amount.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

          </Animated.View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Custom Premium Modal Overlay */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(200)} style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <View style={styles.modalButtons}>
              {modalType === 'confirm' && (
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnCancel]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnOk]} 
                onPress={() => {
                  setModalVisible(false);
                  if (onConfirmAction) onConfirmAction();
                }}
              >
                <Text style={styles.modalBtnOkText}>
                  {modalType === 'confirm' ? 'Confirm' : 'OK'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProfileRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.profileRow}>
      <Ionicons name={icon as any} size={18} color={COLORS.muted} />
      <View style={styles.profileRowText}>
        <Text style={styles.profileRowLabel}>{label}</Text>
        <Text style={styles.profileRowValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function SettingsRow({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={20} color={COLORS.muted} />
      <Text style={styles.settingsLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.muted} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 32 },

  // ── Header ──
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: 6,
  },
  avatarWrapper: { position: 'relative', marginBottom: 4 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  userName:  { fontSize: FONT_SIZES.xl, color: COLORS.foreground, fontFamily: FONTS.bold },
  userEmail: { fontSize: FONT_SIZES.sm, color: COLORS.muted,      fontFamily: FONTS.regular },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginTop: SPACING.md,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem:    { flex: 1, alignItems: 'center' },
  statValue:   { fontSize: FONT_SIZES.xl, color: COLORS.foreground, fontFamily: FONTS.bold },
  statLabel:   { fontSize: FONT_SIZES.xs, color: COLORS.muted,      fontFamily: FONTS.medium },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },

  // ── Tabs ──
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.base,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive:      { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  tabLabel:       { fontSize: FONT_SIZES.xs, color: COLORS.muted,    fontFamily: FONTS.semiBold },
  tabLabelActive: { color: COLORS.primary },

  // ── Section / Cards ──
  section: { paddingHorizontal: SPACING.base, gap: 12 },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: FONT_SIZES.md, color: COLORS.foreground, fontFamily: FONTS.bold },
  editBtn:   { fontSize: FONT_SIZES.sm, color: COLORS.primary,    fontFamily: FONTS.semiBold },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileRowText:  { flex: 1 },
  profileRowLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileRowValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.foreground,
    fontFamily: FONTS.semiBold,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    gap: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoutRow:     { borderBottomWidth: 0 },
  settingsLabel: { fontSize: FONT_SIZES.base, color: COLORS.foreground, fontFamily: FONTS.medium },

  // ── Wardrobe ──
  wardrobeSection: { paddingHorizontal: SPACING.base },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  emptyWardrobe: { alignItems: 'center', paddingTop: SPACING['4xl'], gap: 10 },
  emptyTitle:    { fontSize: FONT_SIZES.lg, color: COLORS.foreground, fontFamily: FONTS.bold },
  emptySubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.muted,      fontFamily: FONTS.regular },
  shopBtn:       {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  shopBtnText: { fontSize: FONT_SIZES.base, color: '#fff', fontFamily: FONTS.bold },

  // ── Orders ──
  ordersLoading: {
    alignItems: 'center',
    paddingTop: SPACING['4xl'],
    gap: 12,
  },
  ordersLoadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    fontFamily: FONTS.medium,
  },
  emptyOrders: {
    alignItems: 'center',
    paddingTop: SPACING['4xl'],
    gap: 10,
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderImage: { width: 80, height: 90 },
  orderInfo: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    gap: 4,
    justifyContent: 'center',
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId:         { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.semiBold },
  orderStatus:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  orderStatusText: { fontSize: FONT_SIZES.xs, fontFamily: FONTS.semiBold },
  orderDate:       { fontSize: FONT_SIZES.xs, color: COLORS.muted,      fontFamily: FONTS.regular },
  orderMeta:       { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.medium },

  // ── Custom Modal ──
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.foreground,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  modalBtnCancelText: {
    color: COLORS.foreground,
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
  },
  modalBtnOk: {
    backgroundColor: COLORS.primary,
  },
  modalBtnOkText: {
    color: '#fff',
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.sm,
  },
});
