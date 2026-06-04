import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../../../supabase';

export const handlePickAndUploadImage = async ({ setPickedImageUri, setUploadingImage, setNewCarImageName }) => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    Alert.alert('Permission requise', "Vous devez autoriser l'accès aux photos.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [16, 9],
    quality: 0.7,
  });

  if (!result.canceled && result.assets[0]) {
    const selectedAsset = result.assets[0];
    setPickedImageUri(selectedAsset.uri);
    setUploadingImage(true);
    try {
      const { decode } = require('base64-arraybuffer');
      const fileExtension = selectedAsset.uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${fileExtension}`;
      const base64Data = await FileSystem.readAsStringAsync(selectedAsset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const { error } = await supabase.storage
        .from('cars-images')
        .upload(fileName, decode(base64Data), {
          contentType: `image/${fileExtension}`,
          cacheControl: '3600',
          upsert: false,
        });
      if (error) throw error;
      setNewCarImageName(fileName);
      Alert.alert('Succès', 'Image téléversée avec succès !');
    } catch (err) {
      Alert.alert('Erreur Stockage', err.message);
      setPickedImageUri(null);
    } finally {
      setUploadingImage(false);
    }
  }
};
