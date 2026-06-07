import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase, getUserRole } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

const queryClient = new QueryClient();

function AuthGuard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const isMock = await AsyncStorage.getItem('mock_admin');
        if (isMock === 'true') {
          setChecking(false);
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session) {
          setChecking(false);
          router.replace('/login');
          return;
        }
        const role = await getUserRole(data.session.user.id);
        if (role !== 'admin') {
          setDenied(true);
          setChecking(false);
          return;
        }
        setChecking(false);
      } catch (e) {
        console.error('Auth check failed:', e);
        setChecking(false);
        router.replace('/login');
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  /*
  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (denied) {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedIcon}>🚫</Text>
        <Text style={styles.deniedTitle}>Access Denied</Text>
        <Text style={styles.deniedText}>This account does not have admin privileges.</Text>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => supabase.auth.signOut()}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }
  */

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="user/[id]" />
      <Stack.Screen name="ai-settings" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="promotions" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <AuthGuard />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  deniedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  deniedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.cancelled,
    marginBottom: 8,
  },
  deniedText: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  logoutBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
