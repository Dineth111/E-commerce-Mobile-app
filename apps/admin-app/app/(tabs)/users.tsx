import { useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const AVATAR_COLORS = ['#C0392B', '#378ADD', '#22C55E', '#F59E0B', '#8B5CF6'];

function initials(name: string) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function UsersScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    }
  });

  const filtered = users.filter((u: any) =>
    (u.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <Text style={styles.count}>{filtered.length} total</Text>
      </View>

      {/* Premium Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            selectionColor={Colors.accent}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={{ color: Colors.textMuted, marginTop: 12 }}>No users found.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => router.push(`/user/${item.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                <Text style={styles.avatarText}>{initials(item.full_name)}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.full_name || 'Anonymous User'}</Text>
                <Text style={styles.userMeta}>{item.email || 'No email'}</Text>
              </View>
              <View style={[
                styles.roleBadge,
                { backgroundColor: item.role === 'admin' ? Colors.accent + '22' : Colors.blue + '22' }
              ]}>
                <Text style={[
                  styles.roleText,
                  { color: item.role === 'admin' ? Colors.accent : Colors.blue }
                ]}>
                  {(item.role || 'customer').toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add User FAB */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/user/new' as any)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  count: { fontSize: 13, color: Colors.textMuted },
  searchContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, height: 48,
    shadowColor: Colors.text, shadowOpacity: 0.05,
    shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15, height: '100%' },
  clearBtn: { padding: 4, marginLeft: 4 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  userRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  userMeta: { fontSize: 12, color: Colors.textMuted },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  roleText: { fontSize: 10, fontWeight: '700' },
  fab: {
    position: 'absolute', right: 24, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOpacity: 0.3,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
