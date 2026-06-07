import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';

const AVATAR_COLORS = ['#C0392B', '#378ADD', '#22C55E', '#F59E0B', '#8B5CF6'];

const MOCK_USERS: Record<string, any> = {
  '1': {
    id: '1', full_name: 'Amali Perera', phone: '+94 71 234 5678',
    email: 'amali@example.com', role: 'customer', joined: 'January 2025', is_banned: false,
    style_quiz: {
      body_type: 'Hourglass',
      preferred_styles: ['Elegant', 'Casual'],
      color_palette: ['#C0392B', '#1a1a1a', '#f5f5f5'],
      budget_range: 'LKR 5,000 - 20,000',
      favorite_brands: ['Zara', 'H&M', 'ODEL'],
    },
    recent_orders: [
      { id: 'ORD-001', total: 8500, status: 'pending', date: 'Jun 6, 2026' },
      { id: 'ORD-004', total: 14500, status: 'delivered', date: 'May 20, 2026' },
    ],
  },
};

const statusColor: Record<string, string> = {
  pending: Colors.pending, confirmed: Colors.confirmed,
  shipped: Colors.shipped, delivered: Colors.delivered, cancelled: Colors.cancelled,
};

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/users');
    }
  };
  const user = MOCK_USERS[id as string] ?? MOCK_USERS['1'];

  function initials(name: string) {
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  const avatarColor = AVATAR_COLORS[parseInt(user.id) % AVATAR_COLORS.length];

  const handleBanToggle = () => {
    Alert.alert(
      user.is_banned ? 'Unban User' : 'Ban User',
      `Are you sure you want to ${user.is_banned ? 'unban' : 'ban'} ${user.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user.is_banned ? 'Unban' : 'Ban',
          style: 'destructive',
          onPress: () => Alert.alert('Done', `User ${user.is_banned ? 'unbanned' : 'banned'} successfully.`),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials(user.full_name)}</Text>
          </View>
          <Text style={styles.name}>{user.full_name}</Text>
          <View style={[
            styles.roleBadge,
            { backgroundColor: user.role === 'admin' ? Colors.accent + '22' : Colors.blue + '22' }
          ]}>
            <Text style={[styles.roleText, { color: user.role === 'admin' ? Colors.accent : Colors.blue }]}>
              {user.role.toUpperCase()}
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.contactText}>{user.phone}</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.contactText}>{user.email}</Text>
          </View>
          <Text style={styles.joinedText}>Joined {user.joined}</Text>
        </View>

        {/* Style Quiz */}
        {user.style_quiz && (
          <>
            <Text style={styles.sectionTitle}>Style Quiz</Text>
            <View style={styles.card}>
              <Text style={styles.quizLabel}>Body Type</Text>
              <Text style={styles.quizValue}>{user.style_quiz.body_type}</Text>

              <Text style={styles.quizLabel}>Budget Range</Text>
              <Text style={styles.quizValue}>{user.style_quiz.budget_range}</Text>

              <Text style={styles.quizLabel}>Preferred Styles</Text>
              <View style={styles.tagsRow}>
                {user.style_quiz.preferred_styles.map((s: string) => (
                  <View key={s} style={styles.tag}>
                    <Text style={styles.tagText}>{s}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.quizLabel}>Favorite Brands</Text>
              <View style={styles.tagsRow}>
                {user.style_quiz.favorite_brands.map((b: string) => (
                  <View key={b} style={styles.tag}>
                    <Text style={styles.tagText}>{b}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.quizLabel}>Color Palette</Text>
              <View style={styles.tagsRow}>
                {user.style_quiz.color_palette.map((c: string) => (
                  <View key={c} style={[styles.colorDot, { backgroundColor: c }]} />
                ))}
              </View>
            </View>
          </>
        )}

        {/* Recent Orders */}
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {user.recent_orders.map((order: any) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderRow}
            onPress={() => router.push(`/order/${order.id}` as any)}
          >
            <View>
              <Text style={styles.orderId}>#{order.id}</Text>
              <Text style={styles.orderDate}>{order.date}</Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderTotal}>LKR {order.total.toLocaleString()}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor[order.status] + '22' }]}>
                <Text style={[styles.badgeText, { color: statusColor[order.status] }]}>
                  {order.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Ban/Unban */}
        <TouchableOpacity
          style={[styles.banBtn, user.is_banned && styles.unbanBtn]}
          onPress={handleBanToggle}
          activeOpacity={0.85}
        >
          <Ionicons name={user.is_banned ? 'checkmark-circle-outline' : 'ban-outline'} size={18} color={user.is_banned ? Colors.green : Colors.cancelled} />
          <Text style={[styles.banBtnText, { color: user.is_banned ? Colors.green : Colors.cancelled }]}>
            {user.is_banned ? 'Unban User' : 'Ban User'}
          </Text>
        </TouchableOpacity>
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
  profileCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 24 },
  name: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: Radius.full, marginBottom: 12 },
  roleText: { fontSize: 11, fontWeight: '700' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  contactText: { fontSize: 13, color: Colors.textMuted },
  joinedText: { fontSize: 12, color: Colors.textDim, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: 20, gap: 6,
  },
  quizLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  quizValue: { fontSize: 14, color: Colors.text, marginBottom: 4 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  tag: {
    backgroundColor: Colors.surface2, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  tagText: { fontSize: 12, color: Colors.text },
  colorDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  orderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: 12, marginBottom: Spacing.sm,
  },
  orderId: { fontSize: 13, fontWeight: '700', color: Colors.text },
  orderDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  orderRight: { alignItems: 'flex-end', gap: 6 },
  orderTotal: { fontSize: 13, fontWeight: '700', color: Colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  badgeText: { fontSize: 10, fontWeight: '700' },
  banBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.lg, height: 52, gap: 8,
    borderWidth: 1.5, borderColor: Colors.cancelled, marginTop: 8,
  },
  unbanBtn: { borderColor: Colors.green },
  banBtnText: { fontWeight: '700', fontSize: 15 },
});
