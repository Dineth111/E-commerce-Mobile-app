import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';

interface Promo {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
}

const MOCK_PROMOS: Promo[] = [
  { id: '1', code: 'SAVE10', type: 'percentage', value: 10, max_uses: 100, used_count: 23, expires_at: '2026-12-31', is_active: true },
  { id: '2', code: 'FLAT500', type: 'fixed', value: 500, max_uses: 50, used_count: 50, expires_at: '2026-07-01', is_active: false },
  { id: '3', code: 'SUMMER20', type: 'percentage', value: 20, max_uses: 200, used_count: 87, expires_at: '2026-08-31', is_active: true },
];

export default function PromotionsScreen() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promo[]>(MOCK_PROMOS);
  const [showModal, setShowModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
  const [saving, setSaving] = useState(false);

  const toggleActive = (id: string) => {
    setPromos(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
  };

  const handleDelete = (id: string, code: string) => {
    Alert.alert('Delete Promo', `Delete promo code "${code}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => setPromos(prev => prev.filter(p => p.id !== id)),
      },
    ]);
  };

  const handleCreate = async () => {
    if (!newCode.trim() || !newValue.trim()) {
      Alert.alert('Error', 'Code and value are required.');
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const promo: Promo = {
      id: Date.now().toString(),
      code: newCode.toUpperCase(),
      type: newType,
      value: parseFloat(newValue),
      max_uses: 100,
      used_count: 0,
      expires_at: '2026-12-31',
      is_active: true,
    };
    setPromos(prev => [promo, ...prev]);
    setSaving(false);
    setShowModal(false);
    setNewCode(''); setNewValue('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotions</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={promos}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.promoCard, !item.is_active && styles.promoCardInactive]}>
            <View style={styles.promoTop}>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{item.code}</Text>
              </View>
              <View style={styles.promoActions}>
                <TouchableOpacity
                  style={[styles.toggleBtn, item.is_active && styles.toggleBtnActive]}
                  onPress={() => toggleActive(item.id)}
                >
                  <Text style={[styles.toggleText, item.is_active && styles.toggleTextActive]}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.code)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={Colors.cancelled} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.promoDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Discount</Text>
                <Text style={styles.detailValue}>
                  {item.type === 'percentage' ? `${item.value}% off` : `LKR ${item.value} off`}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Used</Text>
                <Text style={styles.detailValue}>{item.used_count}/{item.max_uses}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Expires</Text>
                <Text style={styles.detailValue}>{item.expires_at}</Text>
              </View>
            </View>

            {/* Usage bar */}
            <View style={styles.usageBar}>
              <View style={[
                styles.usageFill,
                { width: `${Math.min((item.used_count / item.max_uses) * 100, 100)}%` as any }
              ]} />
            </View>
          </View>
        )}
      />

      {/* Create Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>New Promo Code</Text>

            <Text style={styles.fieldLabel}>Code</Text>
            <TextInput
              style={styles.modalInput}
              value={newCode}
              onChangeText={setNewCode}
              placeholder="e.g. SAVE20"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {(['percentage', 'fixed'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typePill, newType === t && styles.typePillActive]}
                  onPress={() => setNewType(t)}
                >
                  <Text style={[styles.typePillText, newType === t && styles.typePillTextActive]}>
                    {t === 'percentage' ? '% Off' : 'Fixed LKR'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Value</Text>
            <TextInput
              style={styles.modalInput}
              value={newValue}
              onChangeText={setNewValue}
              placeholder={newType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, saving && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create</Text>}
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
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.text },
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  promoCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  promoCardInactive: { opacity: 0.55 },
  promoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  codeBox: {
    backgroundColor: Colors.accent + '22', borderRadius: Radius.sm,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  codeText: { fontSize: 16, fontWeight: '800', color: Colors.accent, letterSpacing: 1 },
  promoActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  toggleBtnActive: { backgroundColor: Colors.green + '22', borderColor: Colors.green },
  toggleText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  toggleTextActive: { color: Colors.green },
  deleteBtn: { padding: 4 },
  promoDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailItem: {},
  detailLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  detailValue: { fontSize: 13, color: Colors.text, fontWeight: '700', marginTop: 2 },
  usageBar: {
    height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden',
  },
  usageFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 20, textAlign: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 6, marginTop: 14 },
  modalInput: {
    backgroundColor: Colors.surface2, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, fontSize: 14,
    paddingHorizontal: 14, height: 48,
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typePill: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.md,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  typePillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  typePillText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  typePillTextActive: { color: '#fff' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelModalBtn: {
    flex: 1, height: 50, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
  },
  cancelModalText: { color: Colors.textMuted, fontWeight: '600' },
  createBtn: {
    flex: 1, height: 50, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.accent,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
