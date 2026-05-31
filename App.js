// App.js
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, 
  Platform, TouchableWithoutFeedback, Keyboard, StatusBar, ActivityIndicator, 
  Alert, FlatList, Image, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { supabase } from './supabase'; 
import FreeCarsMapScreen from './src/screens/FreeCarsMapScreen';
//import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import { reviewService } from './src/screens/api';
import { StripeProvider } from '@stripe/stripe-react-native';
import PaymentScreen from './src/screens/PaymentScreen';


// 📍 UN UNIQUE IMPORT POUR CHAQUE MODULE NATIF (CORRIGÉ)
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
// 📍 NOTIFICATION IMPORTS
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

const CATEGORIES = ['All', 'Economy', 'Compact', 'Premium', 'Luxury SUV'];
const CITIES = ['Rabat', 'Casablanca', 'Marrakech', 'Tangier', 'Agadir'];

// 📍 FOREGROUND NOTIFICATION ROOT CONFIGURATION
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  // --- NATIVE IMAGE PICKER STATES ---
  const [pickedImageUri, setPickedImageUri] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

const submitReview = async (carId, rating, comment) => {
  if (!userSession) return Alert.alert("Erreur", "Vous devez être connecté.");
  
  try {
    const { error } = await reviewService.addReview(
      carId, 
      userSession.user.id, 
      rating, 
      comment
    );

    if (error) throw error;
    Alert.alert("Merci !", "Votre avis a été publié.");
  } catch (err) {
    Alert.alert("Erreur", err.message);
  }
};








  // --- AUTH & ACCOUNT PRIVILEGES STATES ---
  //const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userSession, setUserSession] = useState(null);
  //const [email, setEmail] = useState('');
 //const [password, setPassword] = useState('');
  //const [fullName, setFullName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
 //Profil
 
 const [userProfile, setUserProfile] = useState(null);
const [editingProfile, setEditingProfile] = useState(false);
const [profileName, setProfileName] = useState('');
const [profilePhone, setProfilePhone] = useState('');
const [profileAvatar, setProfileAvatar] = useState(null);
const [uploadingAvatar, setUploadingAvatar] = useState(false);


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


  // --- DATABASE DATA HOOKS ---
  const [dbCars, setDbCars] = useState([]);
  const [userReservations, setUserReservations] = useState([]);
  const [fetchingCars, setFetchingCars] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Home'); 
  const [selectedCar, setSelectedCar] = useState(null);
const [carReviews, setCarReviews] = useState([]);
  // --- SEARCH, CALENDAR & FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('Rabat');
  
   const [showFilterMenu, setShowFilterMenu] = useState(false);
     const [filterMinPrice, setFilterMinPrice] = useState('');
       const [filterMaxPrice, setFilterMaxPrice] = useState('');
 
 
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);

  // --- ADMIN PANEL TEXT INPUT STATES ---
  const [newCarName, setNewCarName] = useState('');
  const [newCarType, setNewCarType] = useState('Economy');
  const [newCarPrice, setNewCarPrice] = useState('');
  const [newCarFuel, setNewCarFuel] = useState('Diesel');
  const [newCarTransmission, setNewCarTransmission] = useState('Manual');
  const [newCarImageName, setNewCarImageName] = useState(''); 

  // --- 📍 PUSH NOTIFICATION TOKEN RETRIEVAL FUNCTION ---
  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return null;
      
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: 'YOUR-EXPO-PROJECT-ID' // À configurer dans app.json pour la production
        })).data;
      } catch (e) {
        console.log("Token dynamic capture bypassed inside development sandbox:", e.message);
      }
    } else {
      console.log('Les notifications requièrent un appareil physique.');
    }
    return token;
  };

  // --- 📍 INTEGRATED ROLE DETECTOR FROM USERS_TABLE ---
  const checkCustomUserRole = async (session) => {
    if (!session?.user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users_table')
        .select('role')
        .eq('auth_uid', session.user.id)
        .single();

      if (error) throw error;

      if (data && data.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.log("Database user fetch bypassed, matching string fallback:", error.message);
      
      if (session.user.email === 'achrafabbadi08@domain.com' || session.user.email === 'admin@carrent.ma') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
  };

  // Auth State Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
      checkCustomUserRole(session);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
      checkCustomUserRole(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAvailableCars = async () => {
    setFetchingCars(true);
    try {
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .order('price_per_day', { ascending: true });
        
      if (carsError) throw carsError;

      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select('car_id')
        .eq('status', 'confirmed')
        .not('end_date', 'lte', startDate)
        .not('start_date', 'gte', endDate);

      if (resError) throw resError;

      const bookedCarIds = resData.map(r => r.car_id);
      const availableCars = (carsData || []).map(car => ({
        ...car,
        isAvailable: !bookedCarIds.includes(car.id)
      }));

      setDbCars(availableCars);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setFetchingCars(false);
    }
  };

  const fetchUserBookings = async () => {
    setFetchingHistory(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`id, pickup_city, start_date, end_date, total_price, status, cars ( name, image_url )`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserReservations(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    if (userSession) {
      fetchAvailableCars();
      fetchUserBookings();
         fetchUserProfile();
      registerForPushNotificationsAsync().then(token => {
        if (token) console.log("Token synchronized successfully:", token);
      });
    }
  }, [userSession, startDate, endDate]);

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
  const handleAuthSubmit = async () => {
    if (!email || !password || (!isLogin && !fullName)) {
      Alert.alert('Champs requis', 'Veuillez remplir tout.');
      return;
    }
    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Erreur', error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: fullName, role: email.includes('admin') ? 'admin' : 'client' } }
      });
      if (error) Alert.alert('Erreur', error.message);
      else Alert.alert('Succès', 'Vérifiez votre boîte email.');
    }
    setLoading(false);
  };

  const handleCancelBooking = async (reservationId) => {
    Alert.alert(
      'Annuler la réservation ?',
      'Êtes-vous sûr de vouloir annuler cette location ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, Annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('reservations')
                .update({ status: 'cancelled' })
                .eq('id', reservationId);

              if (error) throw error;

              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "⚠️ Réservation Annulée",
                  body: "Votre location a été annulée. La voiture est disponible à nouveau.",
                },
                trigger: null,
              });

              Alert.alert('Annulée', 'La réservation a été annulée avec succès.');
              fetchUserBookings();
              fetchAvailableCars();
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          }
        }
      ]
    );
  };

  const executeBooking = async () => {
    setLoading(true);
    const dayCount = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
    const totalPrice = selectedCar.price_per_day * dayCount;

    try {
      const { error } = await supabase
        .from('reservations')
        .insert([{
          user_id: userSession.user.id,
          car_id: selectedCar.id,
          pickup_city: selectedCity,
          start_date: startDate,
          end_date: endDate,
          rental_days: dayCount,
          total_price: totalPrice,
          status: 'confirmed'
        }]);

      if (error) throw error;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚗 Réservation Confirmée !",
          body: `Votre véhicule ${selectedCar.name} est bloqué pour vous à ${selectedCity}.`,
          data: { screen: 'History' },
        },
        trigger: null, 
      });

      await fetchUserBookings();
      Alert.alert('Réservée !', 'Votre véhicule est bloqué.', [{ text: 'OK', onPress: () => setCurrentScreen('Home') }]);
      
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };


  // 📸 NATIVE GALLERY CONTROLLER AND STORAGE PIPELINE (PROPRE)
  const handlePickAndUploadImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission requise", "Vous devez autoriser l'accès aux photos.");
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
        const fileExtension = selectedAsset.uri.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}.${fileExtension}`;
        
        // Décodeur Base64 pour le stockage Supabase
        const { decode } = require('base64-arraybuffer');

        // Lecture en chaîne Base64 via l'espace de nom officiel
        const base64Data = await FileSystem.readAsStringAsync(selectedAsset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Conversion binaire pour Supabase Storage
        const binaryArrayBuffer = decode(base64Data);

        // Envoi du fichier binaire vers ton bucket 'cars-images'
        const { data, error } = await supabase.storage
          .from('cars-images')
          .upload(fileName, binaryArrayBuffer, {
            contentType: `image/${fileExtension}`,
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        setNewCarImageName(fileName);
        Alert.alert("Succès Storage", "Image téléversée avec succès !");
        
      } catch (err) {
        Alert.alert("Erreur Stockage", err.message);
        setPickedImageUri(null);
      } finally {
        setUploadingImage(false);
      }
    }
  };
  const handleCreateCar = async () => {
    if (!newCarName || !newCarPrice || !newCarImageName) {
      Alert.alert('Erreur Admin', "Veuillez sélectionner une image et remplir tous les champs de la fiche.");
      return;
    }
    setLoading(true);
    const generatedStorageUrl = `https://ewsqhvbbyvzhjamabsir.supabase.co/storage/v1/object/public/cars-images/${newCarImageName}`;

    try {
      const { error } = await supabase
        .from('cars')
        .insert([{
          name: newCarName,
          type: newCarType,
          price_per_day: parseInt(newCarPrice),
          fuel: newCarFuel,
          transmission: newCarTransmission,
          image_url: generatedStorageUrl
        }]);

      if (error) throw error;
      Alert.alert('Succès Admin', `${newCarName} ajouté à l'inventaire public.`);
      
      // Reset layout states cleanly
      setNewCarName(''); 
      setNewCarPrice(''); 
      setNewCarImageName('');
      setPickedImageUri(null);
      
      fetchAvailableCars();
    } catch (error) {
      Alert.alert('Erreur d\'insertion', error.message);
    } finally {
      setLoading(false);
    }
  };

const handleDeleteCar = async (carId, carName) => {
  Alert.alert(
    'Supprimer ce véhicule ?',
    `Êtes-vous sûr de vouloir supprimer "${carName}" de l'inventaire ?`,
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('cars')
              .delete()
              .eq('id', carId);

            if (error) throw error;

            Alert.alert('Supprimé', `${carName} a été retiré de l'inventaire.`);
            fetchAvailableCars();
          } catch (error) {
            Alert.alert('Erreur', error.message);
          }
        }
      }
    ]
  );
};

const filteredCars = dbCars.filter(car => {
  const matchesSearch = car.name.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesCategory = selectedCategory === 'All' || car.type === selectedCategory;
  const matchesCity = true; // la ville est déjà gérée par selectedCity
  const matchesMin = filterMinPrice === '' || car.price_per_day >= parseInt(filterMinPrice);
  const matchesMax = filterMaxPrice === '' || car.price_per_day <= parseInt(filterMaxPrice);
  return matchesSearch && matchesCategory && matchesMin && matchesMax;
});

  const viewCarDetails = (car) => {
    setSelectedCar(car);
    setCurrentScreen('Details');
  };

  // ==========================================
  // RENDER STACK DESIGN
  // ==========================================
if (!userSession) {
  return <AuthScreen />;
}

  if (currentScreen === 'Home') {
    return (
      <SafeAreaView style={styles.dashboardContainer}>
        <StatusBar barStyle="dark-content" />
{/* NAVBAR REDESIGNÉE */}
<View style={styles.navBar}>
  <Text style={styles.navLogo}>🚗 CarRent<Text style={{ color: '#e53e3e' }}>.ma</Text></Text>
  <View style={styles.navActions}>
  <TouchableOpacity onPress={() => setCurrentScreen('Profile')} style={styles.navBtn}>
  <Text style={styles.navBtnText}>👤</Text>
</TouchableOpacity>
    {isAdmin && (
      <TouchableOpacity onPress={() => setCurrentScreen('Admin')} style={styles.navBtnAdmin}>
        <Text style={styles.navBtnAdminText}>⚙️ Admin</Text>
      </TouchableOpacity>
    )}
	
    <TouchableOpacity onPress={() => setCurrentScreen('Map')} style={styles.navBtn}>
      <Text style={styles.navBtnText}>🗺️</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => setCurrentScreen('History')} style={styles.navBtn}>
      <Text style={styles.navBtnText}>📋</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => supabase.auth.signOut()} style={styles.navBtnLogout}>
      <Text style={styles.navBtnLogoutText}>✕</Text>
    </TouchableOpacity>
  </View>
</View>




{/* MENU FILTRES DÉROULANT */}
{showFilterMenu && (
  <View style={styles.filterDropdown}>

    {/* Dates */}
    <Text style={styles.filterLabel}>📅 Période de location</Text>
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
      <TextInput
        style={[styles.filterInput, { flex: 1 }]}
        placeholder="Début (AAAA-MM-JJ)"
        placeholderTextColor="#a0aec0"
        value={startDate}
        onChangeText={setStartDate}
      />
      <TextInput
        style={[styles.filterInput, { flex: 1 }]}
        placeholder="Fin (AAAA-MM-JJ)"
        placeholderTextColor="#a0aec0"
        value={endDate}
        onChangeText={setEndDate}
      />
    </View>

    {/* Ville */}
    <Text style={styles.filterLabel}>📍 Ville</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
      {CITIES.map((city) => (
        <TouchableOpacity
          key={city}
          style={[styles.filterChip, selectedCity === city && styles.filterChipActive]}
          onPress={() => setSelectedCity(city)}
        >
          <Text style={[styles.filterChipText, selectedCity === city && { color: '#fff' }]}>{city}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>

    {/* Catégorie */}
    <Text style={styles.filterLabel}>🚗 Catégorie</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
          onPress={() => setSelectedCategory(cat)}
        >
          <Text style={[styles.filterChipText, selectedCategory === cat && { color: '#fff' }]}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>

    {/* Prix */}
    <Text style={styles.filterLabel}>💰 Prix (DH/jour)</Text>
    <View style={{ flexDirection: 'row', marginBottom: 16 }}>
      <TextInput
        style={[styles.filterInput, { flex: 1, marginRight: 8 }]}
        placeholder="Min"
        placeholderTextColor="#a0aec0"
        keyboardType="numeric"
        value={filterMinPrice}
        onChangeText={setFilterMinPrice}
      />
      <TextInput
        style={[styles.filterInput, { flex: 1 }]}
        placeholder="Max"
        placeholderTextColor="#a0aec0"
        keyboardType="numeric"
        value={filterMaxPrice}
        onChangeText={setFilterMaxPrice}
      />
    </View>

    {/* Bouton Reset */}
    <TouchableOpacity
      style={styles.filterResetBtn}
      onPress={() => {
        setSearchQuery('');
        setSelectedCategory('All');
        setSelectedCity('Rabat');
        setFilterMinPrice('');
        setFilterMaxPrice('');
        setShowFilterMenu(false);
      }}
    >
      <Text style={styles.filterResetBtnText}>🔄 Réinitialiser les filtres</Text>
    </TouchableOpacity>

  </View>
)}


        <View style={styles.searchSection}>
          <TextInput style={styles.searchInput} placeholder="Filtrer par modèle (ex: Dacia)..." placeholderTextColor="#a0aec0" value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {fetchingCars ? (
          <ActivityIndicator size="large" color="#2b6cb0" style={{ marginTop: 40 }} />
        ) : (
          <FlatList 
            data={filteredCars}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
            renderItem={({ item }) => (
  <View style={styles.carCard}>
    <Image source={{ uri: item.image_url }} style={styles.carImage} />
    
    {/* Badge disponibilité en overlay sur l'image */}
    <View style={[styles.availabilityOverlay, { backgroundColor: item.isAvailable ? '#48bb78' : '#e53e3e' }]}>
      <Text style={styles.availabilityOverlayText}>
        {item.isAvailable ? '✓ Disponible' : '✗ Réservé'}
      </Text>
    </View>

    <TouchableOpacity
      style={styles.cardTouchable}
      onPress={() => item.isAvailable 
        ? viewCarDetails(item) 
        : Alert.alert('Indisponible', 'Ce véhicule est loué aux dates sélectionnées.')}
    >
      <View style={styles.carCardInfo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.carCardName}>{item.name}</Text>
          <Text style={styles.carCardType}>{item.type} • {item.fuel} • {item.transmission}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.carCardPrice}>{item.price_per_day} <Text style={styles.carCardPriceSuffix}>DH/j</Text></Text>
        </View>
      </View>
    </TouchableOpacity>

    {/* Bouton suppression admin séparé du TouchableOpacity parent */}
    {isAdmin && (
      <TouchableOpacity 
        style={styles.deleteBtn}
        onPress={() => handleDeleteCar(item.id, item.name)}
      >
        <Text style={styles.deleteBtnText}>🗑️ Supprimer</Text>
      </TouchableOpacity>
    )}
  </View>
)}
          />
        )}
      </SafeAreaView>
    );
  }

  if (currentScreen === 'Details' && selectedCar) {
    const calculatedDays = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
    return (
      <SafeAreaView style={styles.dashboardContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('Home')}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <ScrollView>
          <Image source={{ uri: selectedCar.image_url }} style={styles.detailsHeroImage} />
          <View style={{ padding: 20 }}>
            <Text style={styles.detailsTitle}>{selectedCar.name}</Text>
            <Text style={styles.detailsSub}>Récupération à: {selectedCity}</Text>
            <Text style={[styles.detailsSub, { color: '#2b6cb0', marginTop: 4 }]}>Période: Du {startDate} au {endDate} ({calculatedDays} Jours)</Text>
            
            <View style={styles.quoteWrapper}>
              <Text style={styles.quoteTitle}>Récapitulatif financier</Text>
              <View style={styles.quoteLine}><Text style={styles.quoteLabel}>Base journalière</Text><Text style={styles.quoteValue}>{selectedCar.price_per_day} DH</Text></View>
              <View style={styles.quoteLine}><Text style={styles.quoteLabel}>Sous-Total</Text><Text style={styles.finalGrandPrice}>{selectedCar.price_per_day * calculatedDays} DH</Text></View>
            </View>

            <TouchableOpacity style={styles.bookActionBtn} onPress={executeBooking} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookActionBtnText}>Confirmer ma location</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  if (currentScreen === 'Payment' && selectedCar) {
  const calculatedDays = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
  const totalPrice = selectedCar.price_per_day * calculatedDays;

  return (
    <StripeProvider publishableKey="pk_test_XXXXXXXXXXXXXXXXXXXXXXXX">
      <PaymentScreen
        userSession={userSession}
        selectedCar={selectedCar}
        selectedCity={selectedCity}
        startDate={startDate}
        endDate={endDate}
        totalPrice={totalPrice}
        dayCount={calculatedDays}
        onSuccess={() => {
          Alert.alert('🎉 Réservation confirmée !', 'Votre paiement a été accepté.', [
            { text: 'OK', onPress: () => { fetchAvailableCars(); fetchUserBookings(); setCurrentScreen('Home'); } }
          ]);
        }}
        onBack={() => setCurrentScreen('Details')}
      />
    </StripeProvider>
  );
}
  
  if (currentScreen === 'History') {
    return (
      <SafeAreaView style={styles.dashboardContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('Home')}>
          <Text style={styles.backButtonText}>← Retour Catalogue</Text>
        </TouchableOpacity>
        <FlatList
          data={userReservations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <Image source={{ uri: item.cars?.image_url }} style={styles.historyCarThumb} />
              <View style={styles.historyCardContent}>
                <Text style={styles.historyCarName}>{item.cars?.name}</Text>
                <Text style={styles.historyDetails}>Du {item.start_date} au {item.end_date}</Text>
                <Text style={styles.historyPrice}>{item.total_price} DH • <Text style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 'bold', color: item.status === 'confirmed' ? '#48bb78' : '#e53e3e' }}>{item.status}</Text></Text>
                
                {item.status === 'confirmed' && (
                  <TouchableOpacity style={styles.cancelActionLink} onPress={() => handleCancelBooking(item.id)}>
                    <Text style={styles.cancelActionLinkText}>Annuler Location</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  if (currentScreen === 'Admin') {
    return (
      <SafeAreaView style={styles.dashboardContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('Home')}>
          <Text style={styles.backButtonText}>← Quitter Panel Admin</Text>
        </TouchableOpacity>
        <ScrollView style={{ padding: 20 }}>
          <Text style={styles.sectionTitle}>Ajouter un nouveau véhicule</Text>
          <Text style={styles.sectionSubtitle}>Remplissez les informations de l'inventaire public :</Text>

          <TextInput style={styles.input} placeholder="Nom du modèle (ex: Dacia Logan)" placeholderTextColor="#a0aec0" value={newCarName} onChangeText={setNewCarName} />
          <TextInput style={styles.input} placeholder="Prix par Jour (DH)" placeholderTextColor="#a0aec0" keyboardType="numeric" value={newCarPrice} onChangeText={setNewCarPrice} />
          
          {/* 📍 CUSTOM DYNAMIC PICKER INTERACTION NODE */}
          <Text style={styles.calendarMiniLabel}>Photo du véhicule</Text>
          {pickedImageUri ? (
            <View style={styles.pickerPreviewContainer}>
              <Image source={{ uri: pickedImageUri }} style={styles.pickerPreviewImage} />
              <TouchableOpacity 
                style={styles.pickerResetBadge}
                onPress={() => { setPickedImageUri(null); setNewCarImageName(''); }}
              >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Changer 🔄</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.pickerTriggerSurface} 
              onPress={handlePickAndUploadImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator color="#2b6cb0" />
              ) : (
                <Text style={{ color: '#4a5568', fontWeight: '600' }}>📸 Sélectionner depuis la galerie</Text>
              )}
            </TouchableOpacity>
          )}
          
          <Text style={styles.calendarMiniLabel}>Catégorie de véhicule</Text>
          <ScrollView horizontal style={{ marginVertical: 10 }}>
            {CATEGORIES.slice(1).map((c) => (
              <TouchableOpacity key={c} style={[styles.cityChip, newCarType === c && styles.activeCityChip]} onPress={() => setNewCarType(c)}><Text style={newCarType === c && { color: '#fff' }}>{c}</Text></TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.calendarMiniLabel}>Carburant</Text>
          <View style={{ flexDirection: 'row', marginVertical: 8 }}>
            {['Diesel', 'Essence', 'Hybrid'].map(f => (
              <TouchableOpacity key={f} style={[styles.cityChip, newCarFuel === f && styles.activeCityChip]} onPress={() => setNewCarFuel(f)}><Text style={newCarFuel === f && { color: '#fff' }}>{f}</Text></TouchableOpacity>
            ))}
          </View>

          <Text style={styles.calendarMiniLabel}>Boîte de Vitesse</Text>
          <View style={{ flexDirection: 'row', marginVertical: 8 }}>
            {['Manual', 'Automatic'].map(t => (
              <TouchableOpacity key={t} style={[styles.cityChip, newCarTransmission === t && styles.activeCityChip]} onPress={() => setNewCarTransmission(t)}><Text style={newCarTransmission === t && { color: '#fff' }}>{t}</Text></TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.bookActionBtn, { backgroundColor: '#c05621', marginTop: 20 }]} onPress={handleCreateCar} disabled={loading || uploadingImage}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookActionBtnText}>Insérer dans la Base Cars</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ========================================================
  // 🗺️ CONDITION D'AFFICHAGE DE L'ÉCRAN CARTOGRAPHIQUE EXTERNE
  // ========================================================
  if (currentScreen === 'Map') {
    return (
      <FreeCarsMapScreen 
        dbCars={dbCars} 
        onSelectCar={(car) => {
          setSelectedCar(car);
          setCurrentScreen('Details'); // Redirige vers la fiche descriptive
        }} 
        onBack={() => setCurrentScreen('Home')} 
      />
    );

  }
  
  
  if (currentScreen === 'Profile') {
  return (
    <SafeAreaView style={styles.dashboardContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('Home')}>
        <Text style={styles.backButtonText}>← Retour</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ padding: 24 }}>

        {/* Avatar */}
        <View style={styles.profileAvatarSection}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar}>
            {uploadingAvatar ? (
              <ActivityIndicator size="large" color="#2b6cb0" />
            ) : profileAvatar ? (
              <Image source={{ uri: profileAvatar }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Text style={{ fontSize: 40 }}>👤</Text>
              </View>
            )}
            <View style={styles.profileAvatarBadge}>
              <Text style={{ color: '#fff', fontSize: 12 }}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{profileName || 'Mon Profil'}</Text>
          <Text style={styles.profileEmail}>{userSession?.user?.email}</Text>
          {isAdmin && (
            <View style={styles.profileAdminBadge}>
              <Text style={styles.profileAdminBadgeText}>⚙️ Administrateur</Text>
            </View>
          )}
        </View>

        {/* Infos */}
        <View style={styles.profileCard}>
          <Text style={styles.profileCardTitle}>Informations personnelles</Text>

          <Text style={styles.filterLabel}>Nom complet</Text>
          <TextInput
            style={styles.filterInput}
            value={profileName}
            onChangeText={setProfileName}
            placeholder="Votre nom"
            placeholderTextColor="#a0aec0"
            editable={editingProfile}
          />

          <Text style={[styles.filterLabel, { marginTop: 14 }]}>Téléphone</Text>
          <TextInput
            style={styles.filterInput}
            value={profilePhone}
            onChangeText={setProfilePhone}
            placeholder="+212 6XX XXX XXX"
            placeholderTextColor="#a0aec0"
            keyboardType="phone-pad"
            editable={editingProfile}
          />

          <Text style={[styles.filterLabel, { marginTop: 14 }]}>Email</Text>
          <TextInput
            style={[styles.filterInput, { color: '#a0aec0' }]}
            value={userSession?.user?.email}
            editable={false}
          />
        </View>

        {/* Stats rapides */}
        <View style={styles.profileStatsRow}>
          <View style={styles.profileStatBox}>
            <Text style={styles.profileStatNumber}>{userReservations.length}</Text>
            <Text style={styles.profileStatLabel}>Réservations</Text>
          </View>
          <View style={styles.profileStatBox}>
            <Text style={styles.profileStatNumber}>
              {userReservations.filter(r => r.status === 'confirmed').length}
            </Text>
            <Text style={styles.profileStatLabel}>En cours</Text>
          </View>
          <View style={styles.profileStatBox}>
            <Text style={styles.profileStatNumber}>
              {userReservations.reduce((sum, r) => sum + (r.total_price || 0), 0)} DH
            </Text>
            <Text style={styles.profileStatLabel}>Total dépensé</Text>
          </View>
        </View>

        {/* Boutons action */}
        {editingProfile ? (
          <TouchableOpacity style={styles.bookActionBtn} onPress={handleSaveProfile} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookActionBtnText}>💾 Sauvegarder</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.bookActionBtn, { backgroundColor: '#2b6cb0' }]} onPress={() => setEditingProfile(true)}>
            <Text style={styles.bookActionBtnText}>✏️ Modifier le profil</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.bookActionBtn, { backgroundColor: '#e53e3e', marginTop: 10 }]} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.bookActionBtnText}>🚪 Se déconnecter</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

  return null;
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  innerContainer: { flex: 1, justifyContent: 'center' },
  formWrapper: { paddingHorizontal: 24 },
  headerContainer: { marginBottom: 35, alignItems: 'center' },
  brandTitle: { fontSize: 40, fontWeight: 'bold', color: '#2b6cb0' },
  brandSubtitle: { fontSize: 14, color: '#718096', marginTop: 6, textAlign: 'center' },
  inputContainer: { marginBottom: 20 },
  input: { backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, fontSize: 15, color: '#2d3748', marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  actionButton: { backgroundColor: '#2b6cb0', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  toggleModeContainer: { marginTop: 20, alignItems: 'center' },
  toggleText: { fontSize: 13, color: '#718096' },
  toggleHighlight: { color: '#2b6cb0', fontWeight: 'bold' },

  dashboardContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  navBar: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 18,
  paddingVertical: 14,
  backgroundColor: '#fff',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 4,
},
navLogo: {
  fontSize: 22,
  fontWeight: '800',
  color: '#2b6cb0',
  letterSpacing: -0.5,
},
navActions: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
navBtnAdmin: {
  backgroundColor: '#feebc8',
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 20,
},
navBtnAdminText: {
  color: '#c05621',
  fontWeight: '700',
  fontSize: 12,
},
navBtn: {
  backgroundColor: '#f7fafc',
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: '#e2e8f0',
},
navBtnText: {
  fontSize: 16,
},
navBtnLogout: {
  backgroundColor: '#fed7d7',
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
},
navBtnLogoutText: {
  color: '#c53030',
  fontWeight: '800',
  fontSize: 14,
},
 //navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#edf2f7' },
  navLogo: { fontSize: 20, fontWeight: 'bold', color: '#2b6cb0' },
  historyLinkButton: { marginRight: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#ebf8ff' },
  historyLinkButtonText: { color: '#2b6cb0', fontWeight: '600', fontSize: 12 },
  logoutButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#fed7d7' },
  logoutButtonText: { color: '#c53030', fontWeight: 'bold' },

  calendarConfigBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderColor: '#edf2f7' },
  calendarInputGroup: { flex: 1, marginHorizontal: 4 },
  calendarMiniLabel: { fontSize: 11, color: '#718096', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  calendarDateInput: { backgroundColor: '#f7fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, marginTop: 4, fontSize: 13, color: '#2d3748', textAlign: 'center' },

  cityChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#fff', marginRight: 6, borderWidth: 1, borderColor: '#e2e8f0', alignSelf: 'center' },
  activeCityChip: { backgroundColor: '#2b6cb0', borderColor: '#2b6cb0' },
  cityChipText: { color: '#4a5568', fontSize: 13, fontWeight: '500' },
  activeCityChipText: { color: '#fff' },
  searchSection: { paddingHorizontal: 16, marginVertical: 10 },
  searchInput: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 14 },
  // --- CARDS ---
carCard: {
  backgroundColor: '#fff',
  borderRadius: 16,
  marginBottom: 20,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  elevation: 3,
},
carImage: {
  width: '100%',
  height: 170,
  resizeMode: 'cover',
},
availabilityOverlay: {
  position: 'absolute',
  top: 12,
  left: 12,
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 20,
},
availabilityOverlayText: {
  color: '#fff',
  fontSize: 11,
  fontWeight: 'bold',
},
cardTouchable: {
  paddingHorizontal: 16,
  paddingTop: 14,
  paddingBottom: 10,
},
carCardInfo: {
  flexDirection: 'row',
  alignItems: 'center',
},
carCardName: {
  fontSize: 17,
  fontWeight: '700',
  color: '#1a202c',
},
carCardType: {
  fontSize: 12,
  color: '#a0aec0',
  marginTop: 3,
},
carCardPrice: {
  fontSize: 20,
  fontWeight: '800',
  color: '#2b6cb0',
},
carCardPriceSuffix: {
  fontSize: 13,
  fontWeight: '500',
  color: '#718096',
},
deleteBtn: {
  marginHorizontal: 16,
  marginBottom: 14,
  paddingVertical: 9,
  borderRadius: 10,
  backgroundColor: '#fff5f5',
  borderWidth: 1,
  borderColor: '#fed7d7',
  alignItems: 'center',
},
deleteBtnText: {
  color: '#c53030',
  fontWeight: '600',
  fontSize: 13,
},
  //carCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#edf2f7' },
  carImage: { width: '100%', height: 150 },
  carCardInfo: { flexDirection: 'row', padding: 14, alignItems: 'center' },
  carCardName: { fontSize: 17, fontWeight: 'bold', color: '#1a202c' },
  carCardType: { fontSize: 12, color: '#718096', marginTop: 2 },
  carCardPrice: { fontSize: 17, fontWeight: 'bold', color: '#2b6cb0' },
  availabilityBadge: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },

  backButton: { padding: 14, backgroundColor: '#fff' },
  backButtonText: { color: '#2b6cb0', fontWeight: 'bold' },
  detailsHeroImage: { width: '100%', height: 200 },
  detailsTitle: { fontSize: 24, fontWeight: 'bold' },
  detailsSub: { fontSize: 14, color: '#718096' },
  quoteWrapper: { marginTop: 15, padding: 14, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#edf2f7' },
  quoteTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  quoteLine: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  quoteLabel: { color: '#718096' },
  quoteValue: { fontWeight: '500' },
  finalGrandPrice: { fontSize: 20, fontWeight: 'bold', color: '#2b6cb0' },
  bookActionBtn: { backgroundColor: '#48bb78', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  bookActionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  historyCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#edf2f7' },
  historyCarThumb: { width: 70, height: 55, borderRadius: 6 },
  historyCardContent: { flex: 1, marginLeft: 12 },
  historyCarName: { fontSize: 15, fontWeight: 'bold' },
  historyDetails: { fontSize: 12, color: '#718096' },
  historyPrice: { fontSize: 14, fontWeight: 'bold', color: '#2b6cb0' },
  cancelActionLink: { marginTop: 6, alignSelf: 'flex-start' },
  cancelActionLinkText: { color: '#e53e3e', fontSize: 12, fontWeight: 'bold', textDecorationLine: 'underline' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3748', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#718096', marginBottom: 15 },

  // 📍 DESIGN DE LA SURFACE ET DES COMPOSANTS DE L'IMAGE PICKER
  pickerTriggerSurface: {
    backgroundColor: '#edf2f7',
    borderWidth: 2,
    borderColor: '#cbd5e0',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12
  },
  pickerPreviewContainer: {
    position: 'relative',
    marginVertical: 12,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  pickerPreviewImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover'
  },
  pickerResetBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15
  },
 
  profileAvatarSection: {
  alignItems: 'center',
  marginBottom: 24,
},
profileAvatar: {
  width: 100,
  height: 100,
  borderRadius: 50,
  borderWidth: 3,
  borderColor: '#2b6cb0',
},
profileAvatarPlaceholder: {
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: '#edf2f7',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 2,
  borderColor: '#e2e8f0',
},
profileAvatarBadge: {
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: '#2b6cb0',
  width: 28,
  height: 28,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 2,
  borderColor: '#fff',
},
profileName: {
  fontSize: 22,
  fontWeight: '800',
  color: '#1a202c',
  marginTop: 12,
},
profileEmail: {
  fontSize: 13,
  color: '#718096',
  marginTop: 4,
},
profileAdminBadge: {
  backgroundColor: '#feebc8',
  paddingHorizontal: 14,
  paddingVertical: 5,
  borderRadius: 20,
  marginTop: 8,
},
profileAdminBadgeText: {
  color: '#c05621',
  fontWeight: '700',
  fontSize: 12,
},
profileCard: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 18,
  marginBottom: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
},
profileCardTitle: {
  fontSize: 15,
  fontWeight: '700',
  color: '#2d3748',
  marginBottom: 16,
},
profileStatsRow: {
  flexDirection: 'row',
  marginBottom: 20,
},
profileStatBox: {
  flex: 1,
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 14,
  alignItems: 'center',
  marginHorizontal: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},
profileStatNumber: {
  fontSize: 18,
  fontWeight: '800',
  color: '#2b6cb0',
},
profileStatLabel: {
  fontSize: 11,
  color: '#718096',
  marginTop: 4,
  textAlign: 'center',
}
  
  
});