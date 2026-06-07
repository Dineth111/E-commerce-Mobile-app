import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, clearAll, unreadCount } =
    useNotificationStore();

  const handleNotificationPress = (notif: any) => {
    markAsRead(notif.id);
    if (notif.type === 'order') {
      if (notif.data?.orderId) {
        router.push(`/order/${notif.data.orderId}`);
      } else {
        router.push('/(tabs)/profile');
      }
    } else if (notif.type === 'product' && notif.data?.productId) {
      router.push(`/product/${notif.data.productId}`);
    }
  };

  const unread = unreadCount();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unread > 0 && (
            <Text style={styles.subtitle}>{unread} unread</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unread > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.actionBtn}>
              <Ionicons name="checkmark-done" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="notifications-off-outline" size={48} color={COLORS.muted} />
          </View>
          <Text style={styles.emptyTitle}>You're all caught up!</Text>
          <Text style={styles.emptySubtitle}>
            We'll notify you when your orders update or new arrivals drop.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {notifications.map((notif, index) => (
            <Animated.View
              key={notif.id}
              layout={Layout.springify()}
              entering={FadeInDown.delay(index * 40).springify()}
            >
              <TouchableOpacity
                style={[styles.notifCard, !notif.read && styles.unreadCard]}
                onPress={() => handleNotificationPress(notif)}
                activeOpacity={0.75}
              >
                {/* Icon */}
                <View
                  style={[
                    styles.iconBox,
                    notif.type === 'order'
                      ? styles.orderIconBg
                      : notif.type === 'product'
                      ? styles.productIconBg
                      : styles.systemIconBg,
                  ]}
                >
                  <Ionicons
                    name={
                      notif.type === 'order'
                        ? 'cube-outline'
                        : notif.type === 'product'
                        ? 'pricetag-outline'
                        : 'information-circle-outline'
                    }
                    size={22}
                    color="#fff"
                  />
                </View>

                {/* Content */}
                <View style={styles.content}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.notifTitle, !notif.read && styles.boldText]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    {!notif.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifBody} numberOfLines={2}>
                    {notif.body}
                  </Text>
                  <Text style={styles.time}>{timeAgo(notif.createdAt)}</Text>
                </View>

                {/* Chevron */}
                <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
              </TouchableOpacity>
            </Animated.View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZES.md,
    color: COLORS.foreground,
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scroll: {
    padding: SPACING.base,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 80,
    paddingHorizontal: SPACING['3xl'],
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.foreground,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.base,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    marginBottom: 8,
    ...SHADOWS.sm,
  },
  unreadCard: {
    backgroundColor: `${COLORS.primary}08`,
    borderColor: `${COLORS.primary}30`,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  orderIconBg: { backgroundColor: COLORS.warning },
  productIconBg: { backgroundColor: COLORS.primary },
  systemIconBg: { backgroundColor: COLORS.info },
  content: { flex: 1, gap: 3 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifTitle: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.foreground,
    fontFamily: FONTS.semiBold,
  },
  boldText: { fontFamily: FONTS.bold },
  notifBody: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  time: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedLight,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    flexShrink: 0,
  },
});
