import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../../../supabase';

export const fetchUserProfile = async (userId, { setUserProfile, setProfileName, setProfilePhone, setProfileAvatar }) => {
  if (!userId) return;
  try {
    const { data, error } = await supabase
      .from('users_table')
      .select('*')
      .eq('auth_uid', userId)
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

export const handleSaveProfile = async (
  userId,
  { profileName, profilePhone, profileAvatar },
  { setLoading, setEditingProfile, refreshProfile }
) => {
  setLoading(true);
  try {
    const { error } = await supabase
      .from('users_table')
      .update({ full_name: profileName, phone: profilePhone, avatar_url: profileAvatar })
      .eq('auth_uid', userId);
    if (error) throw error;
    Alert.alert('Succès', 'Profil mis à jour !');
    setEditingProfile(false);
    refreshProfile();
  } catch (error) {
    Alert.alert('Erreur', error.message);
  } finally {
    setLoading(false);
  }
};

export const handlePickAvatar = async (userId, { setUploadingAvatar, setProfileAvatar }) => {
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
      const fileName = `avatar_${userId}.${ext}`;
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const { error } = await supabase.storage
        .from('cars-images')
        .upload(fileName, decode(base64), { contentType: `image/${ext}`, upsert: true });
      if (error) throw error;
      setProfileAvatar(
        `https://ewsqhvbbyvzhjamabsir.supabase.co/storage/v1/object/public/cars-images/${fileName}`
      );
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setUploadingAvatar(false);
    }
  }
};
