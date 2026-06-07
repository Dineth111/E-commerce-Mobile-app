import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase, getUserRole } from '@/lib/supabase';
import { Colors, Spacing, Radius } from '@/constants/theme';

const BG_IMAGE = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert('Login Failed', error.message);
        return;
      }
      if (data.session) {
        const role = await getUserRole(data.session.user.id);
        if (role !== 'admin') {
          await supabase.auth.signOut();
          Alert.alert('Access Denied', 'This account does not have admin privileges.');
          return;
        }
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={{ uri: BG_IMAGE }} style={styles.bgImage} resizeMode="cover">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
              
              {/* Premium Glass Card */}
              <View style={styles.glassCard}>
                <View style={styles.iconCircle}>
                  <Ionicons name="shield-checkmark" size={32} color={Colors.accent} />
                </View>

                <Text style={styles.title}>Admin Access</Text>
                <Text style={styles.subtitle}>Manage your fashion empire</Text>

                <View style={styles.form}>
                  <View style={styles.inputRow}>
                    <Ionicons name="mail-outline" size={20} color="#ccc" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <Ionicons name="lock-closed-outline" size={20} color="#ccc" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Password"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#ccc"
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#1a1a1a" />
                    ) : (
                      <Text style={styles.signInText}>Sign In</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.footer}>Secure Access Only</Text>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  safeArea: { flex: 1 },
  container: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  glassCard: {
    width: '100%', maxWidth: 400,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 10 },
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.lg,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.5, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#aaa', marginBottom: 32 },
  form: { width: '100%', gap: Spacing.md },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.md, height: 54,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  eyeBtn: { padding: 4 },
  signInBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg, height: 54,
    alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.sm,
    shadowColor: Colors.accent, shadowOpacity: 0.5,
    shadowRadius: 15, shadowOffset: { width: 0, height: 4 },
  },
  signInBtnDisabled: { opacity: 0.7 },
  signInText: { color: '#000', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  footer: { marginTop: 32, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
});
