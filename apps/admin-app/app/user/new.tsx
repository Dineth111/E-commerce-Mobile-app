import { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

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

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    setSaving(true);
    try {
      // In a real app, you would use an Edge Function or Supabase Admin API 
      // to create an auth.user. For this demo, we mock it by inserting into profiles.
      const payload = {
        full_name: fullName,
        email: email,
        phone: phone,
        role: role,
      };

      const { error } = await supabase.from('profiles').insert([payload]);
      if (error) throw error;

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

      Alert.alert(
        'Success 📧',
        'User profile created successfully! We will now open your email composer to draft their welcome credentials.',
        [
          {
            text: 'Draft Email',
            onPress: async () => {
              try {
                await Linking.openURL(mailtoUrl);
              } catch (linkErr) {
                Alert.alert('Mail Error', 'Could not open mail client. Please copy password: ' + password);
              }
              handleBack();
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert('Error creating user', e.message);
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
});
