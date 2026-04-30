import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Edit2, Trash2, MapPin, Phone, Mail, Building2, Check, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { api } from '@/data/sources/axiosInstance';
import { useAuth } from '@/hooks/useAuth';

export default function LocatorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [center, setCenter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCenter();
  }, [id]);

  const fetchCenter = async () => {
    try {
      const { data } = await api.get(`/locator/${id}/`);
      setCenter(data);
      setEditForm(data); // clone for edit
    } catch (error) {
      console.error('Failed to fetch locator details', error);
      Alert.alert('Error', 'Could not load center details.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const isOwner = user && center && String(user.id) === String(center.created_by_id);

  const handleDelete = () => {
    Alert.alert(
      "Delete Center",
      "Are you sure you want to delete this aid center? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/locator/${id}/manage/`);
              router.replace('/map'); // force refresh Map
            } catch (error) {
              Alert.alert('Error', 'Failed to delete center.');
            }
          }
        }
      ]
    );
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        center_type: editForm.type // backend expects center_type
      };
      await api.patch(`/locator/${id}/manage/`, payload);
      setCenter(editForm);
      setIsEditing(false);
      Alert.alert('Success', 'Center details updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update center details.');
    } finally {
      setSaving(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'chamber': return '#3B82F6';
      case 'cooperative': return '#10B981';
      case 'itdas': return '#8B5CF6';
      default: return Colors.light.tint;
    }
  };

  if (loading || !center) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  const mainColor = getTypeColor(center.type);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Cover Header */}
      <View style={[styles.cover, { backgroundColor: mainColor + '15', paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          
          {isOwner && !isEditing && (
            <View style={styles.ownerActions}>
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.iconBtn}>
                <Edit2 size={20} color={Colors.light.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={[styles.iconBtn, { backgroundColor: '#FEE2E2' }]}>
                <Trash2 size={20} color={Colors.light.error} />
              </TouchableOpacity>
            </View>
          )}

          {isOwner && isEditing && (
            <View style={styles.ownerActions}>
              <TouchableOpacity onPress={() => { setIsEditing(false); setEditForm(center); }} style={[styles.iconBtn, { backgroundColor: '#F3F4F6' }]}>
                <X size={20} color={Colors.light.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} style={[styles.iconBtn, { backgroundColor: Colors.light.tint }]} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Check size={20} color="#fff" />}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.heroContent}>
          <View style={[styles.typeBadge, { backgroundColor: mainColor }]}>
            <Text style={styles.typeBadgeText}>{isEditing ? editForm.type.toUpperCase() : center.type.toUpperCase()}</Text>
          </View>
          
          {isEditing ? (
            <TextInput
              style={styles.editTitleInput}
              value={editForm.name}
              onChangeText={(t) => setEditForm({...editForm, name: t})}
              placeholder="Center Name"
            />
          ) : (
            <Text style={styles.heroTitle}>{center.name}</Text>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        {/* Wilaya & Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.infoRow}>
            <MapPin size={20} color={Colors.light.textSecondary} />
            <View style={styles.infoTextContainer}>
              {isEditing ? (
                <>
                  <TextInput
                    style={styles.editInput}
                    value={editForm.wilaya}
                    onChangeText={(t) => setEditForm({...editForm, wilaya: t})}
                    placeholder="Wilaya"
                  />
                  <TextInput
                    style={[styles.editInput, { marginTop: 8 }]}
                    value={editForm.address}
                    onChangeText={(t) => setEditForm({...editForm, address: t})}
                    placeholder="Full Address (Optional)"
                    multiline
                  />
                </>
              ) : (
                <>
                  <Text style={styles.infoTitle}>{center.wilaya}</Text>
                  {center.address ? <Text style={styles.infoSubtitle}>{center.address}</Text> : null}
                </>
              )}
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoRow}>
            <Phone size={20} color={Colors.light.textSecondary} />
            <View style={styles.infoTextContainer}>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editForm.phone}
                  onChangeText={(t) => setEditForm({...editForm, phone: t})}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoTitle}>{center.phone || 'No phone provided'}</Text>
              )}
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: 16 }]}>
            <Mail size={20} color={Colors.light.textSecondary} />
            <View style={styles.infoTextContainer}>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editForm.email}
                  onChangeText={(t) => setEditForm({...editForm, email: t})}
                  placeholder="Email Address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.infoTitle}>{center.email || 'No email provided'}</Text>
              )}
            </View>
          </View>
        </View>
        
        {/* Type Selection (Edit mode only) */}
        {isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Center Type</Text>
            <View style={styles.typeSelector}>
              {['chamber', 'cooperative', 'itdas'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeOption, editForm.type === t && { borderColor: mainColor, backgroundColor: mainColor + '10' }]}
                  onPress={() => setEditForm({...editForm, type: t})}
                >
                  <Text style={[styles.typeOptionText, editForm.type === t && { color: mainColor, fontWeight: '700' }]}>
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  cover: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroContent: {
    marginTop: 10,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.light.text,
    letterSpacing: -1,
  },
  editTitleInput: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.light.text,
    letterSpacing: -1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  content: {
    padding: 24,
  },
  section: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  infoSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  editInput: {
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeOption: {
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
});
