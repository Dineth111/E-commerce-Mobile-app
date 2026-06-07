import { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY!;

const tempSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});

export default function NewUserScreen() {
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/users');
    }
  };
  const queryClient = useQueryClient();

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'admin'>('customer');
  const [password, setPassword] = useState(generatePassword());
  const [saving, setSaving] = useState(false);

  // Custom Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'confirm'>('info');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);
  const [onCancelAction, setOnCancelAction] = useState<(() => void) | null>(null);

  const showCustomAlert = (title: string, message: string, onDismiss?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType('info');
    setOnConfirmAction(() => onDismiss || null);
    setOnCancelAction(null);
    setModalVisible(true);
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType('confirm');
    setOnConfirmAction(() => onConfirm);
    setOnCancelAction(() => onCancel || null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) {
      showCustomAlert('Error', 'Name and email are required');
      return;
    }
    setSaving(true);
    try {
      // 1. Sign up the user (triggers auth creation + handle_new_user trigger)
      const { data: signUpData, error: signUpError } = await tempSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: role,
          },
        },
      });

      if (signUpError) throw signUpError;
      const newUserId = signUpData.user?.id;
      if (!newUserId) throw new Error('User creation returned no user ID');

      // 2. Perform profile update to ensure role, email, and phone are synced in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          email: email,
          phone: phone,
          role: role,
        })
        .eq('id', newUserId);

      if (profileError) {
        console.warn('Profile update error:', profileError.message);
      }

      queryClient.invalidateQueries({ queryKey: ['users'] });

      const subject = 'Welcome to Vogue Fashion! ✦ Your Account Details';
      const body = `Hi ${fullName},\n\n` +
        `Your user account has been successfully created.\n\n` +
        `Here are your login credentials:\n` +
        `• Email: ${email}\n` +
        `• Temporary Password: ${password}\n\n` +
        `Please download the Fashion App and log in using these details.\n\n` +
        `Best regards,\n` +
        `Vogue Fashion Team`;
      
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      showCustomConfirm(
        'Success 📧',
        'User profile created successfully! Would you like to draft their welcome credentials email?',
        async () => {
          try {
            await Linking.openURL(mailtoUrl);
          } catch (linkErr) {
            showCustomAlert('Mail Error', 'Could not open mail client. Please copy password: ' + password, () => {
              handleBack();
            });
            return;
          }
          handleBack();
        },
        () => {
          handleBack();
        }
      );
    } catch (e: any) {
      showCustomAlert('Error creating user', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New User</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.fieldLabel}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={fullName} onChangeText={setFullName}
          placeholder="e.g. John Doe"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.fieldLabel}>Email Address *</Text>
        <TextInput
          style={styles.input}
          value={email} onChangeText={setEmail}
          placeholder="e.g. john@example.com"
          placeholderTextColor={Colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.fieldLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone} onChangeText={setPhone}
          placeholder="e.g. +94 71 234 5678"
          placeholderTextColor={Colors.textMuted}
          keyboardType="phone-pad"
        />

        <Text style={styles.fieldLabel}>Temporary Password *</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Temporary Password"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={styles.regenerateBtn} 
            onPress={() => setPassword(generatePassword())}
          >
            <Ionicons name="refresh" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>Role</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity 
            style={[styles.roleBtn, role === 'customer' && styles.roleBtnActive]}
            onPress={() => setRole('customer')}
          >
            <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
            onPress={() => setRole('admin')}
          >
            <Text style={[styles.roleText, role === 'admin' && styles.roleTextActive]}>Admin</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Create User'}</Text>
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
                  onPress={() => {
                    setModalVisible(false);
                    if (onCancelAction) onCancelAction();
                  }}
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
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: Colors.surface2, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, fontSize: 14,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  passwordRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  regenerateBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  roleBtn: {
    flex: 1, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center'
  },
  roleBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  roleText: { color: Colors.textMuted, fontWeight: '600', fontSize: 14 },
  roleTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.lg,
    height: 54, alignItems: 'center', justifyContent: 'center',
    marginTop: 32,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

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
