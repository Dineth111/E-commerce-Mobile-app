import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

export default function ReviewsModerationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ReviewStatus>('pending');

  const { data: reviews = [], isLoading, error } = useQuery({
    queryKey: ['reviews-moderation', activeTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, products(name, brand, images)')
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (error) {
        // If reviews table does not exist yet or fails, log it and return empty list
        console.error('Error fetching reviews:', error);
        return [];
      }
      return data || [];
    }
  });

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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ reviewId, status }: { reviewId: string; status: ReviewStatus }) => {
      const { error } = await supabase
        .from('reviews')
        .update({ status })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews-moderation'] });
      showCustomAlert('Status Updated', `Review status has been changed to ${variables.status}.`);
    },
    onError: (err: any) => {
      showCustomAlert('Error', err.message || 'Failed to update review status');
    }
  });

  const handleUpdateStatus = (reviewId: string, status: ReviewStatus) => {
    const title = `${status.charAt(0).toUpperCase() + status.slice(1)} Review`;
    const message = `Are you sure you want to ${status} this review?`;

    showCustomConfirm(
      title,
      message,
      () => {
        updateStatusMutation.mutate({ reviewId, status });
      }
    );
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={14}
          color={Colors.amber}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.starRow}>{stars}</View>;
  };

  const getProductImage = (product: any) => {
    if (product && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Moderation</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['pending', 'approved', 'rejected'] as ReviewStatus[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbox-ellipses-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No {activeTab} reviews found.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const product = item.products;
            const imgUri = getProductImage(product);
            return (
              <View style={styles.reviewCard}>
                {/* Product Section */}
                <View style={styles.productSection}>
                  {imgUri ? (
                    <Image source={{ uri: imgUri }} style={styles.productThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.productThumb, styles.emptyThumb]}>
                      <Ionicons name="shirt-outline" size={16} color={Colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.productMeta}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product?.name || 'Unknown Product'}
                    </Text>
                    <Text style={styles.productBrand}>
                      {product?.brand || 'Generic'}
                    </Text>
                  </View>
                </View>

                {/* Reviewer Details */}
                <View style={styles.reviewerSection}>
                  <Text style={styles.reviewerName}>{item.username || 'Anonymous'}</Text>
                  <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>

                {/* Stars and comment */}
                <View style={styles.ratingSection}>
                  {renderStars(item.rating)}
                  <Text style={styles.reviewComment}>{item.comment}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  {activeTab !== 'approved' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleUpdateStatus(item.id, 'approved')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnText}>Approve</Text>
                    </TouchableOpacity>
                  )}
                  {activeTab !== 'rejected' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleUpdateStatus(item.id, 'rejected')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
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
                  activeOpacity={0.8}
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
                activeOpacity={0.8}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.text },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.accent,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  activeTabText: {
    color: Colors.accent,
  },
  list: { padding: Spacing.lg, paddingBottom: 48 },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  productSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  productThumb: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    marginRight: 10,
  },
  emptyThumb: {
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productMeta: { flex: 1 },
  productName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  productBrand: { fontSize: 11, color: Colors.textMuted },
  reviewerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: { fontSize: 12, fontWeight: '700', color: Colors.text },
  reviewDate: { fontSize: 11, color: Colors.textMuted },
  ratingSection: { marginBottom: 12 },
  starRow: { flexDirection: 'row', marginBottom: 4 },
  reviewComment: { fontSize: 13, color: Colors.text, lineHeight: 18 },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: Colors.green,
  },
  rejectBtn: {
    backgroundColor: Colors.cancelled,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
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
