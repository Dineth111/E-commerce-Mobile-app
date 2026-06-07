import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const AVATAR_COLORS = ['#C0392B', '#378ADD', '#22C55E', '#F59E0B', '#8B5CF6'];

const statusColor: Record<string, string> = {
  pending: Colors.pending, confirmed: Colors.confirmed,
  shipped: Colors.shipped, delivered: Colors.delivered, cancelled: Colors.cancelled,
};

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Custom Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'confirm'>('info');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  const showCustomAlert = (title: string, message: string, onDismiss?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType('info');
    setOnConfirmAction(() => onDismiss || null);
    setModalVisible(true);
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType('confirm');
    setOnConfirmAction(() => onConfirm);
    setModalVisible(true);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/users');
    }
  };

  // Fetch profile dynamically
  const { data: userProfile, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch orders dynamically
  const { data: userOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['user-orders', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleBanToggle = () => {
    if (!userProfile) return;
    const action = userProfile.is_banned ? 'unban' : 'ban';
    
    const performToggle = async () => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_banned: !userProfile.is_banned })
          .eq('id', id);
        if (error) throw error;
        
        queryClient.invalidateQueries({ queryKey: ['user', id] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        showCustomAlert('Success', `User ${userProfile.is_banned ? 'unbanned' : 'banned'} successfully.`);
      } catch (err: any) {
        showCustomAlert('Error', err.message);
      }
    };

    showCustomConfirm(
      userProfile.is_banned ? 'Unban User' : 'Ban User',
      `Are you sure you want to ${action} ${userProfile.full_name || 'this user'}?`,
      performToggle
    );
  };

  if (isLoadingProfile || isLoadingOrders) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (profileError || !userProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.cancelled} />
          <Text style={{ color: Colors.text, marginTop: 12, textAlign: 'center', fontSize: 16 }}>
            {profileError ? (profileError as Error).message : 'User profile not found.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Consistent avatar color lookup based on character code sum
  const charSum = (userProfile.full_name || 'User').split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
  const avatarColor = AVATAR_COLORS[charSum % AVATAR_COLORS.length];

  const getJoinedDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Parse style quiz JSON safely
  let styleQuiz: any = null;
  try {
    styleQuiz = typeof userProfile.style_quiz === 'string'
      ? JSON.parse(userProfile.style_quiz)
      : userProfile.style_quiz;
  } catch (e) {
    console.error('Error parsing style_quiz:', e);
  }

  const hasStyleQuiz = styleQuiz && Object.keys(styleQuiz).length > 0;

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
            <Text style={styles.avatarText}>{initials(userProfile.full_name)}</Text>
          </View>
          <Text style={styles.name}>{userProfile.full_name || 'Anonymous User'}</Text>
          <View style={[
            styles.roleBadge,
            { backgroundColor: userProfile.role === 'admin' ? Colors.accent + '22' : Colors.blue + '22' }
          ]}>
            <Text style={[styles.roleText, { color: userProfile.role === 'admin' ? Colors.accent : Colors.blue }]}>
              {(userProfile.role || 'customer').toUpperCase()}
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.contactText}>{userProfile.phone || 'No phone'}</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.contactText}>{userProfile.email || 'No email'}</Text>
          </View>
          <Text style={styles.joinedText}>Joined {getJoinedDate(userProfile.created_at)}</Text>
        </View>

        {/* Style Quiz */}
        <Text style={styles.sectionTitle}>Style Quiz</Text>
        {hasStyleQuiz ? (
          <View style={styles.card}>
            {styleQuiz.body_type && (
              <>
                <Text style={styles.quizLabel}>Body Type</Text>
                <Text style={styles.quizValue}>{styleQuiz.body_type}</Text>
              </>
            )}

            {styleQuiz.budget_range && (
              <>
                <Text style={styles.quizLabel}>Budget Range</Text>
                <Text style={styles.quizValue}>{styleQuiz.budget_range}</Text>
              </>
            )}

            {Array.isArray(styleQuiz.preferred_styles) && styleQuiz.preferred_styles.length > 0 && (
              <>
                <Text style={styles.quizLabel}>Preferred Styles</Text>
                <View style={styles.tagsRow}>
                  {styleQuiz.preferred_styles.map((s: string) => (
                    <View key={s} style={styles.tag}>
                      <Text style={styles.tagText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {Array.isArray(styleQuiz.favorite_brands) && styleQuiz.favorite_brands.length > 0 && (
              <>
                <Text style={styles.quizLabel}>Favorite Brands</Text>
                <View style={styles.tagsRow}>
                  {styleQuiz.favorite_brands.map((b: string) => (
                    <View key={b} style={styles.tag}>
                      <Text style={styles.tagText}>{b}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {Array.isArray(styleQuiz.color_palette) && styleQuiz.color_palette.length > 0 && (
              <>
                <Text style={styles.quizLabel}>Color Palette</Text>
                <View style={styles.tagsRow}>
                  {styleQuiz.color_palette.map((c: string) => (
                    <View key={c} style={[styles.colorDot, { backgroundColor: c }]} />
                  ))}
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={{ color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 }}>
              No style quiz responses submitted yet.
            </Text>
          </View>
        )}

        {/* Recent Orders */}
        <Text style={styles.sectionTitle}>Recent Orders ({userOrders.length})</Text>
        {userOrders.length > 0 ? (
          userOrders.map((order: any) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderRow}
              onPress={() => router.push(`/order/${order.id}` as any)}
            >
              <View>
                <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderTotal}>LKR {order.total_amount?.toLocaleString() ?? '0'}</Text>
                <View style={[styles.badge, { backgroundColor: (statusColor[order.status] || Colors.textMuted) + '22' }]}>
                  <Text style={[styles.badgeText, { color: statusColor[order.status] || Colors.textMuted }]}>
                    {(order.status || 'pending').toUpperCase()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.card}>
            <Text style={{ color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 }}>
              No orders found for this user.
            </Text>
          </View>
        )}

        {/* Ban/Unban */}
        <TouchableOpacity
          style={[styles.banBtn, userProfile.is_banned && styles.unbanBtn]}
          onPress={handleBanToggle}
          activeOpacity={0.85}
        >
          <Ionicons name={userProfile.is_banned ? 'checkmark-circle-outline' : 'ban-outline'} size={18} color={userProfile.is_banned ? Colors.green : Colors.cancelled} />
          <Text style={[styles.banBtnText, { color: userProfile.is_banned ? Colors.green : Colors.cancelled }]}>
            {userProfile.is_banned ? 'Unban User' : 'Ban User'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Premium Modal Overlay */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
          </View>
        </View>
      )}
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
  quizLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  quizValue: { fontSize: 14, color: Colors.text, marginBottom: 4 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4, marginTop: 4 },
  tag: {
    backgroundColor: Colors.surface2, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  tagText: { fontSize: 12, color: Colors.text },
  colorDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginRight: 4 },
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

  // Custom Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.textMuted,
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
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modalBtnCancelText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  modalBtnOk: {
    backgroundColor: Colors.accent,
  },
  modalBtnOkText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
