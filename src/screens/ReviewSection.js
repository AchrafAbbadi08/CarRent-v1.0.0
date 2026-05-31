// src/screens/ReviewSection.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { supabase } from '../../supabase';

const StarRating = ({ rating, onRate, editable = false }) => {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => editable && onRate(star)}
          disabled={!editable}
        >
          <Text style={{ fontSize: 28, color: star <= rating ? '#f6ad55' : '#e2e8f0', marginRight: 4 }}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function ReviewSection({ carId, userId, reviews, onReviewAdded }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const hasReviewed = reviews.some(r => r.user_id === userId);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Note requise', 'Veuillez sélectionner une note.');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Commentaire requis', 'Veuillez écrire un avis.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('reviews').insert([{
        car_id: carId,
        user_id: userId,
        rating,
        comment: comment.trim(),
      }]);
      if (error) throw error;
      setRating(0);
      setComment('');
      Alert.alert('Merci !', 'Votre avis a été publié.');
      onReviewAdded();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* Header avec moyenne */}
      <View style={styles.header}>
        <Text style={styles.title}>⭐ Avis clients</Text>
        {averageRating && (
          <View style={styles.avgBadge}>
            <Text style={styles.avgNumber}>{averageRating}</Text>
            <Text style={styles.avgSuffix}>/ 5 • {reviews.length} avis</Text>
          </View>
        )}
      </View>

      {/* Formulaire ajout avis */}
      {!hasReviewed ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Donnez votre avis</Text>
          <StarRating rating={rating} onRate={setRating} editable={true} />
          <TextInput
            style={styles.commentInput}
            placeholder="Partagez votre expérience..."
            placeholderTextColor="#a0aec0"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>Publier mon avis →</Text>
            }
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.alreadyReviewed}>
          <Text style={styles.alreadyReviewedText}>✅ Vous avez déjà donné votre avis.</Text>
        </View>
      )}

      {/* Liste des avis */}
      {reviews.length === 0 ? (
        <Text style={styles.noReviews}>Aucun avis pour le moment. Soyez le premier !</Text>
      ) : (
        reviews.map((rev) => (
          <View key={rev.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewAvatar}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                  {(rev.users_table?.full_name || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewAuthor}>
                  {rev.users_table?.full_name || 'Utilisateur'}
                </Text>
                <Text style={styles.reviewDate}>
                  {new Date(rev.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <StarRating rating={rev.rating} editable={false} />
            </View>
            <Text style={styles.reviewComment}>{rev.comment}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: '#1a202c' },
  avgBadge: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: '#fffbeb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#f6ad55' },
  avgNumber: { fontSize: 20, fontWeight: '900', color: '#d69e2e' },
  avgSuffix: { fontSize: 11, color: '#718096', marginLeft: 4 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  formTitle: { fontSize: 14, fontWeight: '700', color: '#2d3748', marginBottom: 12 },
  commentInput: { backgroundColor: '#f7fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#2d3748', marginTop: 12, minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#2b6cb0', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  alreadyReviewed: { backgroundColor: '#f0fff4', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#9ae6b4' },
  alreadyReviewedText: { color: '#38a169', fontWeight: '600', fontSize: 13 },
  noReviews: { color: '#a0aec0', fontSize: 13, textAlign: 'center', marginVertical: 20 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2b6cb0', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  reviewAuthor: { fontSize: 14, fontWeight: '700', color: '#2d3748' },
  reviewDate: { fontSize: 11, color: '#a0aec0', marginTop: 2 },
  reviewComment: { fontSize: 14, color: '#4a5568', lineHeight: 20 },
});