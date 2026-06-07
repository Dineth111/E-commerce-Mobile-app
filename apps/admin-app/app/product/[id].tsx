import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLOR_OPTIONS = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#f5f5f5' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Beige', hex: '#d4a574' },
];

export default function ProductEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [stock, setStock] = useState('0');
  const [saving, setSaving] = useState(false);

  // Fetch product data if not new
  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setPrice(product.price?.toString() || '');
      setCategory(product.category || '');
      setBrand(product.brand || '');
      setSelectedSizes(product.sizes || []);
      setSelectedColors(Array.isArray(product.colors) ? product.colors.map((c: any) => c.name || c) : []);
      setImages(product.images || []);
      setStock(product.stock_count?.toString() || '0');
    }
  }, [product]);

  const toggleSize = (s: string) => {
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleColor = (c: string) => {
    setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 5));
    }
  };

  const uploadImages = async (imageUris: string[]) => {
    const uploadedUrls: string[] = [];
    for (const uri of imageUris) {
      // Already a remote URL — keep as-is
      if (uri.startsWith('http')) {
        uploadedUrls.push(uri);
        continue;
      }
      try {
        const response = await fetch(uri);
        const blob = await response.blob();

        // Detect mime type from blob, fallback to jpeg
        const mimeType = blob.type || 'image/jpeg';
        const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, blob, {
            contentType: mimeType,
            upsert: false,
          });

        if (error) {
          console.error('Storage upload error:', error.message);
          // Don't crash — skip this image
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      } catch (err: any) {
        console.error('Error uploading image:', err?.message || err);
        // Skip failed images and continue
      }
    }
    return uploadedUrls;
  };

  const handleSave = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Error', 'Product name and price are required');
      return;
    }
    setSaving(true);
    try {
      const finalImageUrls = await uploadImages(images);
      const mappedColors = COLOR_OPTIONS.filter(c => selectedColors.includes(c.name));
      
      const payload: any = {
        name,
        description,
        price: parseFloat(price) || 0,
        category,
        brand,
        sizes: selectedSizes,
        colors: mappedColors,
        images: finalImageUrls,
        stock_count: parseInt(stock, 10) || 0,
      };

      if (isNew) {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').update(payload).eq('id', id);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Success', `Product ${isNew ? 'created' : 'updated'} successfully`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error saving product', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isNew ? 'New Product' : 'Edit Product'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image slots */}
        <Text style={styles.fieldLabel}>Images</Text>
        <View style={styles.imagesRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <TouchableOpacity key={i} style={styles.imageSlot} onPress={pickImage}>
              {images[i] ? (
                <Ionicons name="image" size={24} color={Colors.accent} />
              ) : (
                <Ionicons name="add" size={24} color={Colors.textMuted} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Name */}
        <Text style={styles.fieldLabel}>Product Name *</Text>
        <TextInput
          style={styles.input}
          value={name} onChangeText={setName}
          placeholder="e.g. Silk Wrap Dress"
          placeholderTextColor={Colors.textMuted}
        />

        {/* Description */}
        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description} onChangeText={setDescription}
          placeholder="Describe the product..."
          placeholderTextColor={Colors.textMuted}
          multiline numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Price */}
        <Text style={styles.fieldLabel}>Price (LKR)</Text>
        <TextInput
          style={styles.input}
          value={price} onChangeText={setPrice}
          placeholder="e.g. 14500"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
        />

        {/* Category & Brand row */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Category</Text>
            <TextInput
              style={styles.input}
              value={category} onChangeText={setCategory}
              placeholder="e.g. Dresses"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Brand</Text>
            <TextInput
              style={styles.input}
              value={brand} onChangeText={setBrand}
              placeholder="e.g. Zara"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        {/* Sizes */}
        <Text style={styles.fieldLabel}>Sizes</Text>
        <View style={styles.pillsRow}>
          {SIZES.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.sizePill, selectedSizes.includes(s) && styles.sizePillActive]}
              onPress={() => toggleSize(s)}
            >
              <Text style={[styles.sizePillText, selectedSizes.includes(s) && styles.sizePillTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Colors */}
        <Text style={styles.fieldLabel}>Colors</Text>
        <View style={styles.pillsRow}>
          {COLOR_OPTIONS.map(c => (
            <TouchableOpacity
              key={c.name}
              style={[
                styles.colorSwatch,
                { backgroundColor: c.hex },
                selectedColors.includes(c.name) && styles.colorSwatchSelected,
              ]}
              onPress={() => toggleColor(c.name)}
            >
              {selectedColors.includes(c.name) && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Stock per selected size */}
        {selectedSizes.length > 0 && (
          <>
            <Text style={styles.fieldLabel}>Stock per Size</Text>
            <View style={styles.stockGrid}>
              {selectedSizes.map(s => (
                <View key={s} style={styles.stockItem}>
                  <Text style={styles.stockLabel}>{s}</Text>
                  <TextInput
                    style={styles.stockInput}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Product'}</Text>
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
  textArea: { minHeight: 96, paddingTop: 12 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  imagesRow: { flexDirection: 'row', gap: 8 },
  imageSlot: {
    width: 60, height: 60, borderRadius: Radius.md,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizePill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.full, backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border,
  },
  sizePillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  sizePillText: { color: Colors.textMuted, fontWeight: '600', fontSize: 13 },
  sizePillTextActive: { color: '#fff' },
  colorSwatch: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  colorSwatchSelected: { borderWidth: 3, borderColor: Colors.accent },
  stockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stockItem: { alignItems: 'center', gap: 4 },
  stockLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  stockInput: {
    width: 56, height: 40, borderRadius: Radius.sm,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, textAlign: 'center', fontSize: 14,
  },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.lg,
    height: 54, alignItems: 'center', justifyContent: 'center',
    marginTop: 32,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
