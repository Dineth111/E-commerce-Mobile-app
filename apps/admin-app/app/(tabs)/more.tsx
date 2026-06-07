import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Radius } from '@/constants/theme';

const MENU_ITEMS = [
  { label: 'AI Settings', icon: 'sparkles-outline', route: '/ai-settings', color: Colors.blue },
  { label: 'Promotions', icon: 'pricetag-outline', route: '/promotions', color: Colors.amber },
  { label: 'Reviews Moderation', icon: 'star-outline', route: '/reviews-moderation', color: Colors.purple },
];

export default function MoreScreen() {
  const router = useRouter();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const performSignOut = async () => {
    setShowSignOutModal(false);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleLogout = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: performSignOut }
      ]);
    } else {
      setShowSignOutModal(true);
    }
  };

  return (
    <>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
      </View>

      <View style={styles.section}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.color + '22' }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.8}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.cancelled + '22' }]}>
            <Ionicons name="log-out-outline" size={20} color={Colors.cancelled} />
          </View>
          <Text style={[styles.menuLabel, { color: Colors.cancelled }]}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.cancelled} />
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Fashion Admin · v1.0.0</Text>
    </SafeAreaView>

    {/* Custom Sign Out Modal */}
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
  </>);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xl,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  section: { marginHorizontal: Spacing.lg },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  version: { textAlign: 'center', color: Colors.textDim, fontSize: 12, marginTop: 'auto', paddingBottom: 32 },
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
