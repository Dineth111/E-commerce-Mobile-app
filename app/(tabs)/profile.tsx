import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useStyleProfileStore } from '@/stores/useStyleProfileStore';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useCartStore } from '@/stores/useCartStore';
import { ProductCard } from '@/components/product/ProductCard';
import { MOCK_PRODUCTS } from '@/constants/mockData';

const ORDERS = [
  {
    id: 'ORD-001',
    items: 2,
    total: 247,
    status: 'delivered',
    date: '2025-05-15',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&q=80',
  },
  {
    id: 'ORD-002',
    items: 1,
    total: 98,
    status: 'shipped',
    date: '2025-05-28',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&q=80',
  },
];

const STATUS_COLORS: Record<string, string> = {
  delivered: COLORS.success,
  shipped: COLORS.info,
  pending: COLORS.warning,
  confirmed: COLORS.primary,
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { profile, resetProfile } = useStyleProfileStore();
  const { items: wishlist } = useWishlistStore();
  const { totalItems } = useCartStore();
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'orders' | 'profile'>('profile');

  const PROFILE_TABS = [
    { id: 'profile', label: 'Style Profile', icon: 'sparkles-outline' },
    { id: 'wardrobe', label: 'Wardrobe', icon: 'heart-outline' },
    { id: 'orders', label: 'Orders', icon: 'bag-outline' },
  ] as const;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); router.replace('/onboarding'); } },
    ]);
  };

  const handleRetakeQuiz = () => {
    Alert.alert('Retake Style Quiz', 'This will reset your style profile. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Retake', onPress: () => { resetProfile(); router.push('/quiz'); } },
    ]);
  };

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
            <StatItem label="Wishlist" value={wishlist.length} />
            <View style={styles.statDivider} />
            <StatItem label="Cart Items" value={totalItems()} />
            <View style={styles.statDivider} />
            <StatItem label="Orders" value={ORDERS.length} />
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

              <ProfileRow icon="body-outline" label="Body Type" value={profile.bodyType || 'Not set'} />
              <ProfileRow icon="color-palette-outline" label="Color Palette" value={profile.colorPalette || 'Not set'} />
              <ProfileRow icon="wallet-outline" label="Budget" value={profile.budgetRange || 'Not set'} />
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
              <SettingsRow icon="notifications-outline" label="Notifications" />
              <SettingsRow icon="shield-outline" label="Privacy" />
              <SettingsRow icon="help-circle-outline" label="Help & Support" />
              <TouchableOpacity style={[styles.settingsRow, styles.logoutRow]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                <Text style={[styles.settingsLabel, { color: COLORS.error }]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

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

        {activeTab === 'orders' && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
            {ORDERS.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <Image source={{ uri: order.image }} style={styles.orderImage} contentFit="cover" />
                <View style={styles.orderInfo}>
                  <View style={styles.orderTop}>
                    <Text style={styles.orderId}>{order.id}</Text>
                    <View style={[styles.orderStatus, { backgroundColor: `${STATUS_COLORS[order.status]}20` }]}>
                      <Text style={[styles.orderStatusText, { color: STATUS_COLORS[order.status] }]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orderDate}>{new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  <Text style={styles.orderMeta}>{order.items} item{order.items > 1 ? 's' : ''} · ${order.total}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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

function SettingsRow({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.settingsRow}>
      <Ionicons name={icon as any} size={20} color={COLORS.muted} />
      <Text style={styles.settingsLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.muted} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 32 },
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
  userName: { fontSize: FONT_SIZES.xl, color: COLORS.foreground, fontFamily: FONTS.bold },
  userEmail: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.regular },
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
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FONT_SIZES.xl, color: COLORS.foreground, fontFamily: FONTS.bold },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.medium },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
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
  tabActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  tabLabel: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.semiBold },
  tabLabelActive: { color: COLORS.primary },
  section: { paddingHorizontal: SPACING.base, gap: 12 },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: FONT_SIZES.md, color: COLORS.foreground, fontFamily: FONTS.bold },
  editBtn: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontFamily: FONTS.semiBold },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileRowText: { flex: 1 },
  profileRowLabel: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  profileRowValue: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.semiBold, marginTop: 2, textTransform: 'capitalize' },
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
  logoutRow: { borderBottomWidth: 0 },
  settingsLabel: { fontSize: FONT_SIZES.base, color: COLORS.foreground, fontFamily: FONTS.medium },
  wardrobeSection: { paddingHorizontal: SPACING.base },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  emptyWardrobe: { alignItems: 'center', paddingTop: SPACING['4xl'], gap: 10 },
  emptyTitle: { fontSize: FONT_SIZES.lg, color: COLORS.foreground, fontFamily: FONTS.bold },
  emptySubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontFamily: FONTS.regular },
  shopBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8 },
  shopBtnText: { fontSize: FONT_SIZES.base, color: '#fff', fontFamily: FONTS.bold },
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
  orderInfo: { flex: 1, paddingVertical: 12, paddingRight: 12, gap: 4, justifyContent: 'center' },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.semiBold },
  orderStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  orderStatusText: { fontSize: FONT_SIZES.xs, fontFamily: FONTS.semiBold },
  orderDate: { fontSize: FONT_SIZES.xs, color: COLORS.muted, fontFamily: FONTS.regular },
  orderMeta: { fontSize: FONT_SIZES.sm, color: COLORS.foreground, fontFamily: FONTS.medium },
});
