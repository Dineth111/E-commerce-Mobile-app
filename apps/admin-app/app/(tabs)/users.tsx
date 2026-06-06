import { useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';

const AVATAR_COLORS = ['#C0392B', '#378ADD', '#22C55E', '#F59E0B', '#8B5CF6'];

const MOCK_USERS = [
  { id: '1', full_name: 'Amali Perera', role: 'customer', orders: 7, joined: 'Jan 2025' },
  { id: '2', full_name: 'Kasun Silva', role: 'admin', orders: 0, joined: 'Mar 2024' },
  { id: '3', full_name: 'Nisha Fernando', role: 'customer', orders: 12, joined: 'Feb 2025' },
  { id: '4', full_name: 'Ruwan Jayawardena', role: 'customer', orders: 3, joined: 'Apr 2025' },
  { id: '5', full_name: 'Dilini Rathnayake', role: 'customer', orders: 21, joined: 'Dec 2024' },
];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function UsersScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = MOCK_USERS.filter(u =>
    u.full_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <Text style={styles.count}>{MOCK_USERS.length} total</Text>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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
              <Text style={styles.userName}>{item.full_name}</Text>
              <Text style={styles.userMeta}>{item.orders} orders · Joined {item.joined}</Text>
            </View>
            <View style={[
              styles.roleBadge,
              { backgroundColor: item.role === 'admin' ? Colors.accent + '22' : Colors.blue + '22' }
            ]}>
              <Text style={[
                styles.roleText,
                { color: item.role === 'admin' ? Colors.accent : Colors.blue }
              ]}>
                {item.role.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.surface2, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
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
});
