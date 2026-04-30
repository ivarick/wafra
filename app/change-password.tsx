import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { api } from '@/data/sources/axiosInstance';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      };
      await api.post('/auth/profile/change-password/', payload);
      
      Alert.alert('Success', 'Your password has been changed securely.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to change password. Ensure your old password is correct.');
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.securityNotice}>
          <View style={styles.shieldIcon}>
            <ShieldCheck size={28} color={Colors.light.tint} />
          </View>
          <Text style={styles.securityTitle}>Secure Your Account</Text>
          <Text style={styles.securityText}>
            Ensure your account is using a strong, unique password. It must be at least 8 characters long.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Enter current password"
              secureTextEntry
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              secureTextEntry
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>
        </View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.light.background,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  scrollContent: { padding: 24, paddingBottom: 100 },
  
  securityNotice: {
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  shieldIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#EDF2D8',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  securityTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text, marginBottom: 8 },
  securityText: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 20 },

  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.light.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderWidth: 1, borderColor: Colors.light.border,
    borderRadius: 16, paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: Colors.light.text, paddingVertical: 16 },
  footer: {
    width: '100%',
    paddingTop: 32,
  },
  saveBtn: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.light.tint, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
