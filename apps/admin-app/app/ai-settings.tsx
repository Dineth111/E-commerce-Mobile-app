import { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Switch, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';

const DEFAULT_PROMPT = `You are a premium fashion assistant for our Sri Lanka-based online store. 
Help customers find stylish outfits that match their body type, budget, and personal taste. 
Always suggest items available in our store. Be concise, warm, and knowledgeable about fashion trends.`;

export default function AISettingsScreen() {
  const router = useRouter();
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [features, setFeatures] = useState({
    chat: true,
    visual_search: true,
    recommendations: true,
    size_advisor: true,
  });
  const [saving, setSaving] = useState(false);

  const toggle = (key: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    Alert.alert('Saved', 'AI settings updated successfully.');
  };

  const featureList = [
    { key: 'chat', label: 'AI Chat Assistant', icon: 'chatbubbles-outline', desc: 'Real-time fashion advice chatbot' },
    { key: 'visual_search', label: 'Visual Search', icon: 'camera-outline', desc: 'Find products by photo' },
    { key: 'recommendations', label: 'Recommendations', icon: 'sparkles-outline', desc: 'Personalized product suggestions' },
    { key: 'size_advisor', label: 'Size Advisor', icon: 'body-outline', desc: 'AI-powered size recommendations' },
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>System Prompt</Text>
        <Text style={styles.hint}>This defines how the AI assistant behaves with customers.</Text>
        <TextInput
          style={styles.promptInput}
          value={systemPrompt}
          onChangeText={setSystemPrompt}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          placeholder="Enter AI system prompt..."
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.sectionTitle}>Features</Text>
        {featureList.map(({ key, label, icon, desc }) => (
          <View key={key} style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.blue + '22' }]}>
              <Ionicons name={icon} size={18} color={Colors.blue} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureLabel}>{label}</Text>
              <Text style={styles.featureDesc}>{desc}</Text>
            </View>
            <Switch
              value={features[key]}
              onValueChange={() => toggle(key)}
              trackColor={{ false: Colors.border, true: Colors.accent + '88' }}
              thumbColor={features[key] ? Colors.accent : Colors.textMuted}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save AI Settings</Text>
          )}
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6, marginTop: 8 },
  hint: { fontSize: 12, color: Colors.textMuted, marginBottom: 10 },
  promptInput: {
    backgroundColor: Colors.surface2, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, fontSize: 13,
    padding: 14, minHeight: 160, marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  featureIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  featureInfo: { flex: 1 },
  featureLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  featureDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.lg,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
