import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Send, Trash2, Edit3, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { api } from '@/data/sources/axiosInstance';
import { useAuth } from '@/hooks/useAuth';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchPost();
    }, [id])
  );

  const fetchPost = async () => {
    try {
      const { data } = await api.get(`/api/gallery/${id}/`);
      setPost(data);
    } catch (error) {
      console.error('Failed to load post', error);
      Alert.alert('Error', 'Failed to load post details.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/gallery/${id}/comments/`, { content: commentText });
      setCommentText('');
      fetchPost(); // Refresh comments
    } catch (error) {
      console.error('Failed to post comment', error);
      Alert.alert('Error', 'Could not post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/gallery/${id}/comments/${commentId}/delete/`);
          fetchPost();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete comment.');
        }
      }}
    ]);
  };

  const handleDeletePost = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this outbreak report?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/gallery/${id}/delete/`);
          router.replace('/gallery');
        } catch (error) {
          Alert.alert('Error', 'Failed to delete post.');
        }
      }}
    ]);
  };

  if (loading || !post) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.postCard}>
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
            {post.is_author && (
              <View style={styles.authorActions}>
                <TouchableOpacity onPress={handleDeletePost} style={styles.iconBtn}>
                  <Trash2 size={18} color={Colors.light.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {post.disease_tag ? (
            <View style={styles.diseaseBadge}>
              <Text style={styles.diseaseText}>⚠️ Suspected: {post.disease_tag}</Text>
            </View>
          ) : null}

          <Text style={styles.postCaption}>{post.caption}</Text>

          {post.images && post.images.length > 0 && (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {post.images.map((imgUrl: string, idx: number) => (
                <Image key={idx} source={{ uri: imgUrl }} style={styles.postImage} />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({post.comments?.length || 0})</Text>
          
          {post.comments?.map((comment: any) => (
            <View key={comment.id} style={styles.commentItem}>
              <View style={[styles.commentAvatar, comment.is_author && { backgroundColor: Colors.light.tint + '20' }]}>
                <Text style={[styles.commentInitials, comment.is_author && { color: Colors.light.tint }]}>
                  {comment.is_author ? 'Me' : 'A'}
                </Text>
              </View>
              <View style={styles.commentBubble}>
                <Text style={styles.commentContent}>{comment.content}</Text>
                <Text style={styles.commentTime}>{new Date(comment.created_at).toLocaleTimeString()}</Text>
              </View>
              {comment.is_author && (
                <TouchableOpacity onPress={() => handleDeleteComment(comment.id)} style={{ padding: 8 }}>
                  <Trash2 size={16} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {post.comments?.length === 0 && (
            <View style={styles.emptyComments}>
              <MessageCircle size={32} color={Colors.light.border} />
              <Text style={styles.emptyCommentsText}>No comments yet. Be the first!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.commentInputContainer, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !commentText.trim() && { opacity: 0.5 }]} 
          onPress={handlePostComment}
          disabled={!commentText.trim() || submitting}
        >
          {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  content: { padding: 16, paddingBottom: 60 },
  
  postCard: {
    backgroundColor: Colors.light.card, borderRadius: 16, padding: 16, marginBottom: 20,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  authorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  authorInitials: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  postMeta: { flex: 1 },
  postTags: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagCrop: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  tagDot: { color: Colors.light.textSecondary, fontSize: 12 },
  tagWilaya: { fontSize: 13, color: Colors.light.tint, fontWeight: '600' },
  postTime: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 2 },
  authorActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 4 },
  
  diseaseBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: '#FEE2E2' },
  diseaseText: { fontSize: 12, fontWeight: '700', color: '#B91C1C' },
  postCaption: { fontSize: 15, color: Colors.light.text, lineHeight: 22, marginBottom: 16 },
  imageScroll: { width: '100%', borderRadius: 12, overflow: 'hidden' },
  postImage: { width: 340, height: 250, resizeMode: 'cover', marginRight: 10, borderRadius: 12 },

  commentsSection: { paddingBottom: 40 },
  commentsTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 16, marginLeft: 4 },
  commentItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 4 },
  commentInitials: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  commentBubble: { flex: 1, backgroundColor: Colors.light.card, padding: 12, borderRadius: 16, borderTopLeftRadius: 4 },
  commentContent: { fontSize: 14, color: Colors.light.text, lineHeight: 20 },
  commentTime: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 6 },
  emptyComments: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  emptyCommentsText: { color: Colors.light.textSecondary, fontSize: 14 },

  commentInputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1, borderTopColor: Colors.light.border,
  },
  commentInput: {
    flex: 1, minHeight: 44, maxHeight: 100,
    backgroundColor: '#F3F4F6', borderRadius: 22,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    fontSize: 15, color: Colors.light.text,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 12,
  }
});
