import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Radius } from '@/constants/theme';

const MENU_ITEMS = [
  { label: 'AI Settings', icon: 'sparkles-outline', route: '/ai-settings', color: Colors.blue },
  { label: 'Analytics', icon: 'analytics-outline', route: '/analytics', color: Colors.green },
  { label: 'Promotions', icon: 'pricetag-outline', route: '/promotions', color: Colors.amber },
];

export default function MoreScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => supabase.auth.signOut(),
        },
      ]
    );
  };

  return (
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
  );
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
});
