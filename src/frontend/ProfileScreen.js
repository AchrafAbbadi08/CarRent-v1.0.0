// src/frontend/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Alert, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export default function ProfileScreen({ userSession, isAdmin, userReservations, onBack }) {
  const [userProfile, setUserProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAvatar, setProfileAvatar] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users_table')
        .select('*')
        .eq('auth_uid', userSession.user.id)
        .single();

      if (error) throw error;

      setUserProfile(data);
      setProfileName(data.full_name || '');
      setProfilePhone(data.phone || '');
      setProfileAvatar(data.avatar_url || null);
    } catch (error) {
      console.log('Profile fetch error:', error.message);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users_table')
        .update({
          full_name: profileName,
          phone: profilePhone,
          avatar_url: profileAvatar,
        })
        .eq('auth_uid', userSession.user.id);

      if (error) throw error;

      Alert.alert('Succès', 'Profil mis à jour !');
      setEditingProfile(false);
      fetchUserProfile();
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingAvatar(true);
      try {
        const { decode } = require('base64-arraybuffer');
        const asset = result.assets[0];
        const ext = asset.uri.split('.').pop() || 'jpg';
        const fileName = `avatar_${userSession.user.id}.${ext}`;

        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { error } = await supabase.storage
          .from('cars-images')
          .upload(fileName, decode(base64), {
            contentType: `image/${ext}`,
            upsert: true,
          });

        if (error) throw error;

        const avatarUrl = `https://ewsqhvbbyvzhjamabsir.supabase.co/storage/v1/object/public/cars-images/${fileName}`;
        setProfileAvatar(avatarUrl);
      } catch (err) {
        Alert.alert('Erreur', err.message);
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Retour</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ padding: 24 }}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar}>
            {uploadingAvatar ? (
              <ActivityIndicator size="large" color="#2b6cb0" />
            ) : profileAvatar ? (
              <Image source={{ uri: profileAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={{ fontSize: 40 }}>👤</Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Text style={{ color: '#fff', fontSize: 12 }}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{profileName || 'Mon Profil'}</Text>
          <Text style={styles.profileEmail}>{userSession?.user?.email}</Text>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>⚙️ Administrateur</Text>
            </View>
          )}
        </View>

        {/* Infos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations personnelles</Text>

          <Text style={styles.label}>Nom complet</Text>
          <TextInput
            style={[styles.input, !editingProfile && styles.inputDisabled]}
            value={profileName}
            onChangeText={setProfileName}
            placeholder="Votre nom"
            placeholderTextColor="#a0aec0"
            editable={editingProfile}
          />

          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={[styles.input, !editingProfile && styles.inputDisabled]}
            value={profilePhone}
            onChangeText={setProfilePhone}
            placeholder="+212 6XX XXX XXX"
            placeholderTextColor="#a0aec0"
            keyboardType="phone-pad"
            editable={editingProfile}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={userSession?.user?.email}
            editable={false}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userReservations.length}</Text>
            <Text style={styles.statLabel}>Réservations</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {userReservations.filter(r => r.status === 'confirmed').length}
            </Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {userReservations.reduce((sum, r) => sum + (r.total_price || 0), 0)} DH
            </Text>
            <Text style={styles.statLabel}>Total dépensé</Text>
          </View>
        </View>

        {/* Actions */}
        {editingProfile ? (
          <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveProfile} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>💾 Sauvegarder</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnPrimary} onPress={() => setEditingProfile(true)}>
            <Text style={styles.btnText}>✏️ Modifier le profil</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btnDanger} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.btnText}>🚪 Se déconnecter</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  backButton: { padding: 14, backgroundColor: '#fff' },
  backButtonText: { color: '#2b6cb0', fontWeight: 'bold' },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#2b6cb0' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#edf2f7', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2b6cb0', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  profileName: { fontSize: 22, fontWeight: '800', color: '#1a202c', marginTop: 12 },
  profileEmail: { fontSize: 13, color: '#718096', marginTop: 4 },
  adminBadge: { backgroundColor: '#feebc8', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginTop: 8 },
  adminBadgeText: { color: '#c05621', fontWeight: '700', fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2d3748', marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: '#718096', textTransform: 'uppercase', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f7fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#2d3748' },
  inputDisabled: { backgroundColor: '#edf2f7', color: '#a0aec0' },
  statsRow: { flexDirection: 'row', marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', marginHorizontal: 4, elevation: 2 },
  statNumber: { fontSize: 18, fontWeight: '800', color: '#2b6cb0' },
  statLabel: { fontSize: 11, color: '#718096', marginTop: 4, textAlign: 'center' },
  btnPrimary: { backgroundColor: '#2b6cb0', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  btnDanger: { backgroundColor: '#e53e3e', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});