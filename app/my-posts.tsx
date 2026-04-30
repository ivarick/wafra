import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, MessageCircle, Search, Trash2, Edit3 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { api } from '@/data/sources/axiosInstance';
import { useAuth } from '@/hooks/useAuth';

export default function MyPostsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMyPosts();
    }, [])
  );

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/gallery/');
      // Filter locally since backend doesn't have an author filter endpoint
      const myPosts = data.filter((p: any) => p.is_author === true);
      setPosts(myPosts);
    } catch (error) {
      console.error('Failed to load my posts', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = (id: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this outbreak report?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/gallery/${id}/delete/`);
          fetchMyPosts();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete post.');
        }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 40 }} />
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={40} color={Colors.light.border} />
            <Text style={styles.emptyText}>You haven't reported any outbreaks yet.</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/gallery/create')}>
              <Text style={styles.createBtnText}>Report an Outbreak</Text>
            </TouchableOpacity>
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
                <View style={[styles.authorAvatar, { backgroundColor: Colors.light.tint + '20' }]}>
                  <Text style={[styles.authorInitials, { color: Colors.light.tint }]}>Me</Text>
                </View>
                <View style={styles.postMeta}>
                  <View style={styles.postTags}>
                    <Text style={styles.tagCrop}>{post.crop.toUpperCase()}</Text>
                    <Text style={styles.tagDot}>•</Text>
                    <Text style={styles.tagWilaya}>{post.wilaya}</Text>
                  </View>
                  <Text style={styles.postTime}>{new Date(post.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.authorActions}>
                  <TouchableOpacity onPress={() => handleDeletePost(post.id)} style={styles.iconBtn}>
                    <Trash2 size={18} color={Colors.light.error} />
                  </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: Colors.light.card, zIndex: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  
  content: { padding: 16, paddingBottom: 60 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.light.textSecondary, fontWeight: '500' },
  createBtn: { marginTop: 16, backgroundColor: Colors.light.tint, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  createBtnText: { color: '#fff', fontWeight: '700' },

  postCard: { backgroundColor: Colors.light.card, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  authorAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  authorInitials: { fontSize: 12, fontWeight: '700' },
  postMeta: { flex: 1 },
  postTags: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagCrop: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  tagDot: { color: Colors.light.textSecondary, fontSize: 12 },
  tagWilaya: { fontSize: 13, color: Colors.light.tint, fontWeight: '600' },
  postTime: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 2 },
  authorActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6, backgroundColor: '#F3F4F6', borderRadius: 8 },
  
  diseaseBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: '#FEE2E2' },
  diseaseText: { fontSize: 12, fontWeight: '700', color: '#B91C1C' },
  postCaption: { fontSize: 15, color: Colors.light.text, lineHeight: 22, marginBottom: 12 },
  postImage: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#F3F4F6' },
  postFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary },
});
