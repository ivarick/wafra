import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { api } from '@/data/sources/axiosInstance';

export default function CreateLocatorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const lat = parseFloat(params.lat as string);
  const lon = parseFloat(params.lon as string);

  const [name, setName] = useState('');
  const [centerType, setCenterType] = useState<'chamber' | 'cooperative' | 'itdas'>('chamber');
  const [wilaya, setWilaya] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !wilaya) {
      Alert.alert('Missing fields', 'Name and Wilaya are required.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/locator/create/', {
        name,
        center_type: centerType,
        wilaya,
        address,
        latitude: lat,
        longitude: lon,
        phone,
        email,
      });
      Alert.alert('Success', 'Aid center has been created!', [
        { text: 'OK', onPress: () => router.replace('/map') }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create center.');
    } finally {
      setLoading(false);
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
        <Text style={styles.headerTitle}>New Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.coordinatesText}>Location: {lat.toFixed(4)}, {lon.toFixed(4)}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Center Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g., Wilaya Chamber of Agriculture" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type *</Text>
          <View style={styles.typeRow}>
            {(['chamber', 'cooperative', 'itdas'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeBtn, centerType === type && styles.typeBtnActive]}
                onPress={() => setCenterType(type)}
              >
                <Text style={[styles.typeBtnText, centerType === type && styles.typeBtnTextActive]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Wilaya *</Text>
          <TextInput style={styles.input} value={wilaya} onChangeText={setWilaya} placeholder="e.g., Algiers" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Detailed address" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Contact number" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Contact email" />
        </View>

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Create Locator</Text>
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
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  scrollContent: { padding: 24, paddingBottom: 60, gap: 16 },
  coordinatesText: {
    fontSize: 14, color: Colors.light.textSecondary,
    marginBottom: 8, fontStyle: 'italic', textAlign: 'center',
  },
  inputGroup: { gap: 8 },
  label: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  input: {
    backgroundColor: Colors.light.card,
    borderWidth: 1.5, borderColor: Colors.light.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: Colors.light.text,
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, paddingVertical: 12,
    borderWidth: 1.5, borderColor: Colors.light.border,
    borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  typeBtnActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary },
  typeBtnTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
