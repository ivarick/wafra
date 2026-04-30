import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ImagePlus, X, Tag } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { api } from '@/data/sources/axiosInstance';

const WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar', 'Blida', 
  'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 
  'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', 
  'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 
  'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 
  'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal', 
  'Béni Abbès', 'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', 'El M\'Ghair', 'El Meniaa'
];
const CROPS = [
  { label: 'Wheat', value: 'wheat' },
  { label: 'Tomato', value: 'tomato' },
  { label: 'Olive', value: 'olive' },
  { label: 'Date Palm', value: 'date_palm' },
  { label: 'Potato', value: 'potato' },
  { label: 'Citrus', value: 'citrus' }
];

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [crop, setCrop] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [diseaseTag, setDiseaseTag] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      setImages([...images, ...newUris].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!crop || !wilaya || images.length === 0) {
      Alert.alert('Missing Fields', 'Please select a crop, wilaya, and at least one image.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('crop', crop);
      formData.append('wilaya', wilaya);
      if (caption) formData.append('caption', caption);
      if (diseaseTag) formData.append('disease_tag', diseaseTag);
      
      images.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('images', { uri, name: filename, type } as any);
      });

      await api.post('/api/gallery/create/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Outbreak reported successfully.', [
        { text: 'OK', onPress: () => router.replace('/gallery') }
      ]);
    } catch (error: any) {
      console.error('Failed to create post', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Outbreak</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos (Max 4)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {images.map((uri, idx) => (
              <View key={idx} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 4 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImage}>
                <ImagePlus size={32} color={Colors.light.tint} />
                <Text style={styles.addImageText}>Add</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the issue, symptoms, or behavior..."
            placeholderTextColor={Colors.light.textSecondary}
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crop Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CROPS.map(c => (
              <TouchableOpacity
                key={c.value}
                style={[styles.chip, crop === c.value && styles.chipActive]}
                onPress={() => setCrop(c.value)}
              >
                <Text style={[styles.chipText, crop === c.value && styles.chipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Region (Wilaya)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {WILAYAS.map(w => (
              <TouchableOpacity
                key={w}
                style={[styles.chip, wilaya === w && styles.chipActive]}
                onPress={() => setWilaya(w)}
              >
                <Text style={[styles.chipText, wilaya === w && styles.chipTextActive]}>{w}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suspected Disease (Optional)</Text>
          <View style={styles.inputWrapper}>
            <Tag size={20} color={Colors.light.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Late Blight, Powdery Mildew"
              placeholderTextColor={Colors.light.textSecondary}
              value={diseaseTag}
              onChangeText={setDiseaseTag}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
          onPress={handleSubmit} 
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Report</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: Colors.light.card, zIndex: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  
  content: { padding: 20, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.light.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  imageScroll: { flexDirection: 'row' },
  imageContainer: { marginRight: 12, position: 'relative' },
  previewImage: { width: 100, height: 100, borderRadius: 16, backgroundColor: '#F3F4F6' },
  removeImageBtn: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.light.error, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  
  addImageBtn: { width: 100, height: 100, borderRadius: 16, backgroundColor: '#EDF2D8', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.light.tint, borderStyle: 'dashed' },
  addImageText: { fontSize: 12, fontWeight: '700', color: Colors.light.tint, marginTop: 4 },

  textArea: { backgroundColor: Colors.light.card, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 16, padding: 16, fontSize: 15, color: Colors.light.text, minHeight: 120, textAlignVertical: 'top' },
  
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  chipText: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary },
  chipTextActive: { color: '#fff' },

  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.card, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 16, paddingHorizontal: 16 },
  input: { flex: 1, paddingVertical: 16, fontSize: 15, color: Colors.light.text },

  submitBtn: { backgroundColor: Colors.light.tint, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: Colors.light.tint, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
