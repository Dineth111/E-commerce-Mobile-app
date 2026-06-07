import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput,
  ActivityIndicator, Platform, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

interface Promo {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
  title?: string;
  description?: string;
  product_id?: string | null;
  products?: {
    id: string;
    name: string;
    price: number;
    images?: string[];
  } | null;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  images?: string[];
}

export default function PromotionsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Custom Alert Modal State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'confirm'>('info');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  const showCustomAlert = (title: string, message: string, onDismiss?: () => void) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType('info');
    setOnConfirmAction(() => onDismiss || null);
    setAlertVisible(true);
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType('confirm');
    setOnConfirmAction(() => onConfirm);
    setAlertVisible(true);
  };

  // Fetch Promotions
  const { data: promos = [], isLoading, error } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          products (id, name, price, images)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Promo[];
    }
  });

  // Fetch Products for dropdown selection
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['admin-products-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, brand, images')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as Product[];
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
    onError: (err: any) => {
      showCustomAlert('Error', err.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      showCustomAlert('Success', 'Promotion deleted successfully.');
    },
    onError: (err: any) => {
      showCustomAlert('Error', err.message);
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newPromo: any) => {
      const { error } = await supabase
        .from('promotions')
        .insert([newPromo]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      showCustomAlert('Success', 'Promotion created successfully!');
      setShowModal(false);
      setNewCode('');
      setNewValue('');
      setNewTitle('');
      setNewDescription('');
      setSelectedProductId(null);
    },
    onError: (err: any) => {
      showCustomAlert('Error', err.message);
    }
  });

  const toggleActive = (id: string, currentStatus: boolean) => {
    toggleMutation.mutate({ id, is_active: !currentStatus });
  };

  const handleDelete = (id: string, code: string) => {
    showCustomConfirm(
      'Delete Promo',
      `Delete promo code "${code}"?`,
      () => {
        deleteMutation.mutate(id);
      }
    );
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDescription.trim() || !newCode.trim() || !newValue.trim()) {
      showCustomAlert('Error', 'Title, description, code, and discount value are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: newCode.toUpperCase().trim(),
        type: newType,
        value: parseFloat(newValue) || 0,
        max_uses: 100,
        used_count: 0,
        expires_at: '2026-12-31',
        is_active: true,
        title: newTitle.trim(),
        description: newDescription.trim(),
        product_id: selectedProductId,
      };
      createMutation.mutate(payload);
    } catch (err: any) {
      showCustomAlert('Error', err.message);
    } finally {
      setSaving(false);
    }
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

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: Colors.cancelled, textAlign: 'center' }}>Error loading promotions: {(error as Error).message}</Text>
        </View>
      ) : (
        <FlatList
          data={promos}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="pricetag-outline" size={48} color={Colors.textMuted} />
              <Text style={{ color: Colors.textMuted, marginTop: 12 }}>No promotions found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.promoCard, !item.is_active && styles.promoCardInactive]}>
              <View style={styles.promoTop}>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{item.code}</Text>
                </View>
                <View style={styles.promoActions}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, item.is_active && styles.toggleBtnActive]}
                    onPress={() => toggleActive(item.id, item.is_active ?? true)}
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

              {item.title ? (
                <Text style={styles.promoCardTitle}>{item.title}</Text>
              ) : null}
              {item.description ? (
                <Text style={styles.promoCardDesc}>{item.description}</Text>
              ) : null}

              {item.products ? (
                <View style={styles.linkedProductBox}>
                  <Ionicons name="link-outline" size={14} color={Colors.accent} />
                  <Text style={styles.linkedProductText} numberOfLines={1}>
                    Linked: {item.products.name} (LKR {item.products.price})
                  </Text>
                </View>
              ) : null}

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
                  <Text style={styles.detailValue}>{new Date(item.expires_at).toLocaleDateString()}</Text>
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
      )}

      {/* Create Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>New Promo & Deal</Text>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.fieldLabel}>Promo Title</Text>
              <TextInput
                style={styles.modalInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Summer Wrap Dress Sale"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Description / Notification Body</Text>
              <TextInput
                style={[styles.modalInput, styles.textAreaInput]}
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="e.g. Get 20% off Reformation Wrap Dresses today!"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Code</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newCode}
                    onChangeText={setNewCode}
                    placeholder="e.g. SAVE20"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Discount Value</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newValue}
                    onChangeText={setNewValue}
                    placeholder={newType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Discount Type</Text>
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

              <Text style={styles.fieldLabel}>Link to Product (Optional - tap to select)</Text>
              {loadingProducts ? (
                <ActivityIndicator color={Colors.accent} style={{ marginVertical: 10 }} />
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalSelector}
                >
                  <TouchableOpacity
                    style={[
                      styles.productSelectorCard,
                      selectedProductId === null && styles.productSelectorCardActive
                    ]}
                    onPress={() => setSelectedProductId(null)}
                  >
                    <View style={styles.noneImgBox}>
                      <Ionicons name="close-circle-outline" size={24} color={Colors.textMuted} />
                    </View>
                    <Text style={styles.productSelName} numberOfLines={1}>No Link</Text>
                    <Text style={styles.productSelPrice}>Standard Promo</Text>
                  </TouchableOpacity>

                  {products.map(p => {
                    const isSelected = selectedProductId === p.id;
                    const imgUri = p.images && p.images[0] ? p.images[0] : null;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.productSelectorCard,
                          isSelected && styles.productSelectorCardActive
                        ]}
                        onPress={() => setSelectedProductId(p.id)}
                      >
                        {imgUri ? (
                          <Image source={{ uri: imgUri }} style={styles.productSelImg} />
                        ) : (
                          <View style={styles.noneImgBox}>
                            <Ionicons name="image-outline" size={20} color={Colors.textMuted} />
                          </View>
                        )}
                        {isSelected && (
                          <View style={styles.checkmarkBadge}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
                          </View>
                        )}
                        <Text style={styles.productSelName} numberOfLines={1}>{p.name}</Text>
                        <Text style={styles.productSelPrice}>LKR {p.price}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Alert/Confirm Modal Overlay */}
      {alertVisible && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{alertTitle}</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>
            <View style={styles.alertButtons}>
              {alertType === 'confirm' && (
                <TouchableOpacity 
                  style={[styles.alertBtn, styles.alertBtnCancel]} 
                  onPress={() => setAlertVisible(false)}
                >
                  <Text style={styles.alertBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.alertBtn, styles.alertBtnOk]} 
                onPress={() => {
                  setAlertVisible(false);
                  if (onConfirmAction) onConfirmAction();
                }}
              >
                <Text style={styles.alertBtnOkText}>
                  {alertType === 'confirm' ? 'Confirm' : 'OK'}
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
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 20, textAlign: 'center' },
  modalScrollContent: { paddingBottom: 20 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  textAreaInput: { height: 80, textAlignVertical: 'top', paddingTop: 10, marginBottom: 6 },
  horizontalSelector: { paddingVertical: 10, gap: 10 },
  productSelectorCard: {
    width: 100,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.sm,
    alignItems: 'center',
    position: 'relative',
    marginRight: 10,
  },
  productSelectorCardActive: {
    borderColor: Colors.accent,
  },
  productSelImg: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
    marginBottom: 4,
  },
  noneImgBox: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.full,
    zIndex: 10,
  },
  productSelName: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '600',
    width: '100%',
    textAlign: 'center',
  },
  productSelPrice: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
    width: '100%',
    textAlign: 'center',
  },
  promoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  promoCardDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  linkedProductBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface2,
    padding: 8,
    borderRadius: Radius.sm,
    marginBottom: 12,
  },
  linkedProductText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
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

  // Custom Alert Styles
  alertOverlay: {
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
  alertContent: {
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
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  alertBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  alertBtnCancelText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  alertBtnOk: {
    backgroundColor: Colors.accent,
  },
  alertBtnOkText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
