import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Filter, Camera, MessageCircle, MapPin, Search, Edit2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { api } from '@/data/sources/axiosInstance';
import { useAuth } from '@/hooks/useAuth';

const WILAYAS = [
  'All Regions', 'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar', 
  'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger', 'Djelfa', 
  'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 
  'Mostaganem', 'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj', 
  'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 
  'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 
  'Ouled Djellal', 'Béni Abbès', 'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', 'El M\'Ghair', 'El Meniaa'
];
// The backend enum expects lower case normally, but we can pass whatever we have. Let's make sure it matches backend enums if possible.
// Backend enum: ['wheat','tomato','olive','date_palm','potato','onion','pepper','watermelon','citrus','barley']
const CROPS = [
  { label: 'All Crops', value: '' },
  { label: 'Wheat', value: 'wheat' },
  { label: 'Tomato', value: 'tomato' },
  { label: 'Olive', value: 'olive' },
  { label: 'Date Palm', value: 'date_palm' },
  { label: 'Potato', value: 'potato' },
  { label: 'Citrus', value: 'citrus' }
];

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('All Regions');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [selectedCrop, selectedWilaya])
  );

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = '/api/gallery/?';
      if (selectedCrop) query += `crop=${selectedCrop}&`;
      if (selectedWilaya !== 'All Regions') query += `wilaya=${selectedWilaya}&`;
      
      const { data } = await api.get(query);
      setPosts(data);
    } catch (error) {
      console.error('Failed to load gallery posts', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Community Gallery</Text>
          <Text style={styles.headerSubtitle}>Disease Map & Outbreaks</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => router.push('/my-posts')}>
          <Edit2 size={20} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {WILAYAS.map(w => (
            <TouchableOpacity 
              key={w} 
              style={[styles.filterChip, selectedWilaya === w && styles.filterChipActive]}
              onPress={() => setSelectedWilaya(w)}
            >
              <MapPin size={12} color={selectedWilaya === w ? '#fff' : Colors.light.textSecondary} />
              <Text style={[styles.filterText, selectedWilaya === w && styles.filterTextActive]}>{w}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {CROPS.map(c => (
            <TouchableOpacity 
              key={c.value} 
              style={[styles.filterChip, selectedCrop === c.value && styles.filterChipActive]}
              onPress={() => setSelectedCrop(c.value)}
            >
              <Text style={[styles.filterText, selectedCrop === c.value && styles.filterTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 40 }} />
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={40} color={Colors.light.border} />
            <Text style={styles.emptyText}>No outbreaks reported for these filters.</Text>
          </View>
        ) : (
          posts.map(post => (
            <TouchableOpacity 
              key={post.id} 
              style={styles.postCard} 
              activeOpacity={0.9}
              onPress={() => router.push(`/gallery/${post.id}`)}
            >
              <View style={styles.postHeader}>
                <View style={[styles.authorAvatar, post.is_author && { backgroundColor: Colors.light.tint + '20' }]}>
                  <Text style={[styles.authorInitials, post.is_author && { color: Colors.light.tint }]}>
                    {post.is_author ? 'Me' : 'Anon'}
                  </Text>
                </View>
                <View style={styles.postMeta}>
                  <View style={styles.postTags}>
                    <Text style={styles.tagCrop}>{post.crop.toUpperCase()}</Text>
                    <Text style={styles.tagDot}>•</Text>
                    <Text style={styles.tagWilaya}>{post.wilaya}</Text>
                  </View>
                  <Text style={styles.postTime}>{new Date(post.created_at).toLocaleDateString()}</Text>
                </View>
              </View>

              {post.disease_tag ? (
                <View style={styles.diseaseBadge}>
                  <Text style={styles.diseaseText}>⚠️ Suspected: {post.disease_tag}</Text>
                </View>
              ) : null}

              <Text style={styles.postCaption}>{post.caption}</Text>

              {post.images && post.images.length > 0 && (
                <Image source={{ uri: post.images[0] }} style={styles.postImage} />
              )}

              <View style={styles.postFooter}>
                <View style={styles.actionBtn}>
                  <MessageCircle size={20} color={Colors.light.textSecondary} />
                  <Text style={styles.actionText}>{post.comments_count} Comments</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 20 }]} activeOpacity={0.8} onPress={() => router.push('/gallery/create')}>
        <Camera size={24} color="#fff" />
        <Text style={styles.fabText}>Report Outbreak</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.light.card,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDF2D8',
  },
  filtersContainer: {
    backgroundColor: Colors.light.card,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filterScroll: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authorInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  postMeta: {
    flex: 1,
  },
  postTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagCrop: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  tagDot: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  tagWilaya: {
    fontSize: 13,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  postTime: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  diseaseBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  diseaseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  postCaption: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.tintDark,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: Colors.light.tintDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
});
