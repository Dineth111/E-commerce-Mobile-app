import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useNotificationStore } from '@/stores/useNotificationStore';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markAsRead, clearAll, markAllAsRead } = useNotificationStore();

  const handlePress = (item: any) => {
    markAsRead(item.id);
    if (item.type === 'order' && item.data?.orderId) {
      router.push(`/order/${item.data.orderId}` as any);
    } else if (item.type === 'review') {
      router.push('/reviews-moderation');
    }
  };

  const getIcon = (type: string, read: boolean) => {
    switch (type) {
      case 'order':
        return (
          <View style={[styles.iconContainer, { backgroundColor: Colors.blue + '22' }]}>
            <Ionicons
              name={read ? 'cube-outline' : 'cube'}
              size={20}
              color={Colors.blue}
            />
          </View>
        );
      case 'review':
        return (
          <View style={[styles.iconContainer, { backgroundColor: Colors.amber + '22' }]}>
            <Ionicons
              name={read ? 'star-outline' : 'star'}
              size={20}
              color={Colors.amber}
            />
          </View>
        );
      default:
        return (
          <View style={[styles.iconContainer, { backgroundColor: Colors.accent + '22' }]}>
            <Ionicons name="notifications" size={20} color={Colors.accent} />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Mark All As Read Bar */}
      {notifications.some((n) => !n.read) && (
        <TouchableOpacity style={styles.markReadBar} onPress={markAllAsRead}>
          <Ionicons name="checkmark-done" size={16} color={Colors.accent} />
          <Text style={styles.markReadText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.textDim} />
            <Text style={styles.emptyText}>No notifications yet.</Text>
            <Text style={styles.emptySubtext}>You will see updates about new orders and reviews here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notificationCard, !item.read && styles.unreadCard]}
            onPress={() => handlePress(item)}
            activeOpacity={0.8}
          >
            {getIcon(item.type, item.read)}
            <View style={styles.content}>
              <View style={styles.cardHeader}>
                <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  clearText: { color: Colors.cancelled, fontWeight: '600', fontSize: 14 },
  markReadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  markReadText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  list: { padding: Spacing.lg, paddingBottom: 48 },
  emptyContainer: { alignItems: 'center', marginTop: 128, paddingHorizontal: 32 },
  emptyText: { color: Colors.textMuted, fontSize: 16, fontWeight: '700', marginTop: 16 },
  emptySubtext: { color: Colors.textDim, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  unreadCard: {
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  unreadText: { color: Colors.text, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  body: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  date: { fontSize: 11, color: Colors.textDim, marginTop: 2 },
});
