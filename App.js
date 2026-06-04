// App.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Platform, StatusBar, ActivityIndicator,
  Alert, FlatList, Image, ScrollView
} from 'react-native';

// ─── BACKEND ──────────────────────────────────────────────────────────────────
import { checkCustomUserRole }              from './src/backend/api/authApi';
import { registerForPushNotificationsAsync } from './src/backend/api/notificationApi';
import { fetchAvailableCars, handleCreateCar, handleDeleteCar } from './src/backend/api/carApi';
import { fetchUserBookings, executeBooking, handleCancelBooking } from './src/backend/api/reservationApi';
import { handlePickAndUploadImage }         from './src/backend/api/imageApi';

// ─── FRONTEND ─────────────────────────────────────────────────────────────────
import styles      from './src/frontend/styles/AppStyles';
import FilterBar   from './src/frontend/components/FilterBar';
import Navbar      from './src/frontend/components/Navbar';
import CarCard     from './src/frontend/components/CarCard';
import FreeCarsMapScreen from './src/frontend/FreeCarsMapScreen';
import AuthScreen  from './src/frontend/AuthScreen';
import PaymentScreen from './src/frontend/PaymentScreen';
import ReviewSection from './src/frontend/ReviewSection';
import ProfileScreen from './src/frontend/ProfileScreen';

import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from './supabase';
import { StripeProvider } from '@stripe/stripe-react-native';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Economy', 'Compact', 'Premium', 'Luxury SUV'];
const CITIES     = ['Rabat', 'Casablanca', 'Marrakech', 'Tangier', 'Agadir'];

const openDirections = (latitude, longitude, carName) => {
  const url = Platform.select({
    ios:     `maps:0,0?q=${carName}@${latitude},${longitude}`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`)
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
	const [editingCar, setEditingCar] = useState(null);
  // --- IMAGE PICKER ---
  const [pickedImageUri, setPickedImageUri]   = useState(null);
  const [uploadingImage, setUploadingImage]   = useState(false);

  // --- AUTH ---
  const [loading, setLoading]         = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [isAdmin, setIsAdmin]         = useState(false);

  // --- PROFILE --- (managed inside ProfileScreen)

  // --- DATA ---
  const [dbCars, setDbCars]                     = useState([]);
  const [userReservations, setUserReservations] = useState([]);
  const [fetchingCars, setFetchingCars]         = useState(false);
  const [fetchingHistory, setFetchingHistory]   = useState(false);
  const [currentScreen, setCurrentScreen]       = useState('Home');
  const [selectedCar, setSelectedCar]           = useState(null);
  const [carReviews, setCarReviews]             = useState([]);

  // --- FILTERS ---
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity]       = useState('Rabat');
  const [showFilterMenu, setShowFilterMenu]   = useState(false);
  const [filterMinPrice, setFilterMinPrice]   = useState('');
  const [filterMaxPrice, setFilterMaxPrice]   = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate]     = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);

  // --- ADMIN ---
  const [newCarName, setNewCarName]               = useState('');
  const [newCarType, setNewCarType]               = useState('Economy');
  const [newCarPrice, setNewCarPrice]             = useState('');
  const [newCarFuel, setNewCarFuel]               = useState('Diesel');
  const [newCarTransmission, setNewCarTransmission] = useState('Manual');
  const [newCarImageName, setNewCarImageName]     = useState('');
  const [newCarPhone, setNewCarPhone]             = useState('');
  const [newCarLatitude, setNewCarLatitude]       = useState('');
  const [newCarLongitude, setNewCarLongitude]     = useState('');
  const [newCarStartDate, setNewCarStartDate]     = useState(new Date().toISOString().split('T')[0]);
  const [newCarEndDate, setNewCarEndDate]         = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  const refreshCars     = () => fetchAvailableCars(startDate, endDate, setDbCars, setFetchingCars);
  const refreshBookings = () => fetchUserBookings(setUserReservations, setFetchingHistory);

  const fetchCarReviews = async (carId) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('car_id', carId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCarReviews(data || []);
    } catch (err) {
      console.log('Reviews error:', err.message);
    }
  };

  const viewCarDetails = (car) => {
    setSelectedCar(car);
    setCarReviews([]);
    fetchCarReviews(car.id);
    setCurrentScreen('Details');
  };

  const filteredCars = dbCars.filter((car) => {
    const matchesSearch    = car.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory  = selectedCategory === 'All' || car.type === selectedCategory;
    const matchesMin       = filterMinPrice === '' || car.price_per_day >= parseInt(filterMinPrice);
    const matchesMax       = filterMaxPrice === '' || car.price_per_day <= parseInt(filterMaxPrice);
    return matchesSearch && matchesCategory && matchesMin && matchesMax;
  });

  // ─── AUTH LISTENER ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
      checkCustomUserRole(session, setIsAdmin);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
      checkCustomUserRole(session, setIsAdmin);
    });
    return () => subscription.unsubscribe();
  }, []);
// Add this inside the Admin block

// Add this inside the Admin block
useEffect(() => {
  if (editingCar) {
    setNewCarName(editingCar.name);
    setNewCarPrice(String(editingCar.price_per_day));
    setNewCarType(editingCar.type);
    setNewCarFuel(editingCar.fuel);
    setNewCarTransmission(editingCar.transmission);
    setNewCarImageName(editingCar.image_url.split('/').pop()); // Extract filename
  }
}, [editingCar]);
  useEffect(() => {
    if (userSession) {
      refreshCars();
      refreshBookings();
      registerForPushNotificationsAsync().then((token) => {
        if (token) console.log('Push token:', token);
      });
    }
  }, [userSession, startDate, endDate]);

  // ─── SCREENS ──────────────────────────────────────────────────────────────
  if (!userSession) return <AuthScreen />;

  if (currentScreen === 'Home') {
    return (
      <SafeAreaView style={styles.dashboardContainer}>
        <StatusBar barStyle="dark-content" />
        <Navbar
          isAdmin={isAdmin}
          onProfile={() => setCurrentScreen('Profile')}
          onAdmin={() => setCurrentScreen('Admin')}
          onMap={() => setCurrentScreen('Map')}
          onHistory={() => setCurrentScreen('History')}
          onLogout={() => supabase.auth.signOut()}
        />
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showFilterMenu={showFilterMenu}
          setShowFilterMenu={setShowFilterMenu}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          filterMinPrice={filterMinPrice}
          setFilterMinPrice={setFilterMinPrice}
          filterMaxPrice={filterMaxPrice}
          setFilterMaxPrice={setFilterMaxPrice}
          CITIES={CITIES}
          CATEGORIES={CATEGORIES}
        />
        {fetchingCars ? (
          <ActivityIndicator size="large" color="#2b6cb0" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredCars}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
            renderItem={({ item }) => (
             // In FlatList
// In App.js, inside your FlatList or mapping function:
<CarCard
  item={item}
  isAdmin={isAdmin}
  viewCarDetails={viewCarDetails}
  handleDeleteCar={(id, name) => handleDeleteCar(id, name, refreshCars)}
  // ADD THIS LINE:
  onEdit={(car) => {
    setEditingCar(car);      // Assuming you have this state
    setCurrentScreen('Admin'); // Transition to your admin form
  }}
/>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  if (currentScreen === 'Details' && selectedCar) {
    const calculatedDays = Math.max(
      1,
      Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    );
    return (
      <SafeAreaView style={styles.dashboardContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('Home')}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <ScrollView>
          <Image source={{ uri: selectedCar.image_url }} style={styles.detailsHeroImage} />
          <View style={{ padding: 20 }}>
            <Text style={styles.detailsTitle}>{selectedCar.name}</Text>
            <Text style={styles.detailsSub}>Récupération à : {selectedCity}</Text>
            <Text style={[styles.detailsSub, { color: '#2b6cb0', marginTop: 4 }]}>
              Période : Du {startDate} au {endDate} ({calculatedDays} Jours)
            </Text>
            <Text style={styles.dateText}>
              Publiée le : {new Date(selectedCar.created_at).toLocaleDateString('fr-FR')}
            </Text>
            <View style={styles.quoteWrapper}>
              <Text style={styles.quoteTitle}>Récapitulatif financier</Text>
              <View style={styles.quoteLine}>
                <Text style={styles.quoteLabel}>Base journalière</Text>
                <Text style={styles.quoteValue}>{selectedCar.price_per_day} DH</Text>
              </View>
              <View style={styles.quoteLine}>
                <Text style={styles.quoteLabel}>Sous-Total</Text>
                <Text style={styles.finalGrandPrice}>{selectedCar.price_per_day * calculatedDays} DH</Text>
              </View>
            </View>

            {isAdmin ? (
              <View style={[styles.bookActionBtn, { backgroundColor: '#a0aec0' }]}>
                <Text style={styles.bookActionBtnText}>🚫 Les admins ne peuvent pas réserver</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.bookActionBtn}
                  onPress={() =>
                    executeBooking(
                      { userId: userSession.user.id, selectedCar, selectedCity, startDate, endDate, isAdmin },
                      { setLoading, setCurrentScreen, refreshBookings }
                    )
                  }
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.bookActionBtnText}>Confirmer ma location</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.bookActionBtn, { backgroundColor: '#2b6cb0', marginTop: 10 }]}
                  onPress={() => setCurrentScreen('Payment')}
                >
                  <Text style={styles.bookActionBtnText}>💳 Passer au paiement</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[styles.bookActionBtn, { backgroundColor: '#3182ce', marginTop: 10 }]}
              onPress={() => openDirections(selectedCar.latitude, selectedCar.longitude, selectedCar.name)}
            >
              <Text style={styles.bookActionBtnText}>📍 Itinéraire vers la voiture</Text>
            </TouchableOpacity>
          </View>

          <ReviewSection
            carId={selectedCar.id}
            userId={userSession.user.id}
            reviews={carReviews}
            onReviewAdded={() => fetchCarReviews(selectedCar.id)}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === 'Payment' && selectedCar) {
    const calculatedDays = Math.max(
      1,
      Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    );
    const totalPrice = selectedCar.price_per_day * calculatedDays;
    return (
      <StripeProvider publishableKey="sb_secret__zPnb-ghH3TD6dTDRK-tKw_vPQH3fr2">
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
              {
                text: 'OK',
                onPress: () => { refreshCars(); refreshBookings(); setCurrentScreen('Home'); },
              },
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
        <View style={styles.historyHeader}>
          <TouchableOpacity onPress={() => setCurrentScreen('Home')}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.historyTitle}>Mes Réservations</Text>
          <Text style={styles.historyCount}>
            {userReservations.length} réservation{userReservations.length > 1 ? 's' : ''}
          </Text>
        </View>

        {fetchingHistory ? (
          <ActivityIndicator size="large" color="#2b6cb0" style={{ marginTop: 40 }} />
        ) : userReservations.length === 0 ? (
          <View style={styles.historyEmpty}>
            <Text style={{ fontSize: 48 }}>🚗</Text>
            <Text style={styles.historyEmptyTitle}>Aucune réservation</Text>
            <Text style={styles.historyEmptyText}>Vous n'avez pas encore loué de véhicule.</Text>
            <TouchableOpacity style={styles.historyEmptyBtn} onPress={() => setCurrentScreen('Home')}>
              <Text style={styles.historyEmptyBtnText}>Voir le catalogue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={userReservations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
            renderItem={({ item }) => {
              const statusConfig = {
                confirmed: { color: '#38a169', bg: '#f0fff4', label: '✓ Confirmée' },
                cancelled: { color: '#e53e3e', bg: '#fff5f5', label: '✗ Annulée' },
                pending:   { color: '#d69e2e', bg: '#fffff0', label: '⏳ En attente' },
              };
              const status = statusConfig[item.status] || statusConfig.pending;
              return (
                <View style={styles.historyCardNew}>
                  <View style={{ position: 'relative' }}>
                    <Image source={{ uri: item.cars?.image_url }} style={styles.historyCardImage} />
                    <View style={[styles.historyStatusBadge, { backgroundColor: status.bg, borderColor: status.color }]}>
                      <Text style={[styles.historyStatusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <View style={styles.historyCardContent2}>
                    <Text style={styles.historyCarName2}>{item.cars?.name}</Text>
                    <View style={styles.historyInfoRow}>
                      <Text style={styles.historyInfoIcon}>📍</Text>
                      <Text style={styles.historyInfoText}>{item.pickup_city}</Text>
                    </View>
                    <View style={styles.historyInfoRow}>
                      <Text style={styles.historyInfoIcon}>📅</Text>
                      <Text style={styles.historyInfoText}>{item.start_date}  →  {item.end_date}</Text>
                    </View>
                    <View style={styles.historyInfoRow}>
                      <Text style={styles.historyInfoIcon}>🗓️</Text>
                      <Text style={styles.historyInfoText}>{item.rental_days} jour{item.rental_days > 1 ? 's' : ''}</Text>
                    </View>
                    <View style={styles.historyCardFooter}>
                      <Text style={styles.historyPriceNew}>{item.total_price} DH</Text>
                      {item.status === 'confirmed' && (
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => handleCancelBooking(item.id, refreshBookings, refreshCars)}
                        >
                          <Text style={styles.cancelBtnText}>Annuler</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
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

          <TextInput style={styles.input} placeholder="Nom du modèle (ex: Dacia Logan)"
            placeholderTextColor="#a0aec0" value={newCarName} onChangeText={setNewCarName} />
          <TextInput style={styles.input} placeholder="Prix par Jour (DH)"
            placeholderTextColor="#a0aec0" keyboardType="numeric" value={newCarPrice} onChangeText={setNewCarPrice} />

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
              onPress={() => handlePickAndUploadImage({ setPickedImageUri, setUploadingImage, setNewCarImageName })}
              disabled={uploadingImage}
            >
              {uploadingImage
                ? <ActivityIndicator color="#2b6cb0" />
                : <Text style={{ color: '#4a5568', fontWeight: '600' }}>📸 Sélectionner depuis la galerie</Text>
              }
            </TouchableOpacity>
          )}

          <Text style={styles.calendarMiniLabel}>Catégorie de véhicule</Text>
          <ScrollView horizontal style={{ marginVertical: 10 }}>
            {CATEGORIES.slice(1).map((c) => (
              <TouchableOpacity key={c}
                style={[styles.cityChip, newCarType === c && styles.activeCityChip]}
                onPress={() => setNewCarType(c)}>
                <Text style={newCarType === c ? { color: '#fff' } : {}}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.calendarMiniLabel}>Carburant</Text>
          <View style={{ flexDirection: 'row', marginVertical: 8 }}>
            {['Diesel', 'Essence', 'Hybrid'].map((f) => (
              <TouchableOpacity key={f}
                style={[styles.cityChip, newCarFuel === f && styles.activeCityChip]}
                onPress={() => setNewCarFuel(f)}>
                <Text style={newCarFuel === f ? { color: '#fff' } : {}}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.calendarMiniLabel}>Boîte de Vitesse</Text>
          <View style={{ flexDirection: 'row', marginVertical: 8 }}>
            {['Manual', 'Automatic'].map((t) => (
              <TouchableOpacity key={t}
                style={[styles.cityChip, newCarTransmission === t && styles.activeCityChip]}
                onPress={() => setNewCarTransmission(t)}>
                <Text style={newCarTransmission === t ? { color: '#fff' } : {}}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.calendarMiniLabel}>Téléphone du propriétaire</Text>
          <TextInput style={styles.input} placeholder="+212 6XX XXX XXX"
            placeholderTextColor="#a0aec0" keyboardType="phone-pad"
            value={newCarPhone} onChangeText={setNewCarPhone} />

          <Text style={styles.calendarMiniLabel}>Localisation (GPS)</Text>
          {newCarLatitude && newCarLongitude ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ flex: 1, color: '#2d3748', fontSize: 13 }}>
                📍 {newCarLatitude}, {newCarLongitude}
              </Text>
              <TouchableOpacity
                onPress={() => setCurrentScreen('LocationPicker')}
                style={{ backgroundColor: '#ebf8ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#bee3f8' }}
              >
                <Text style={{ color: '#2b6cb0', fontSize: 12, fontWeight: '600' }}>Modifier 🗺️</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.pickerTriggerSurface, { marginBottom: 8 }]}
              onPress={() => setCurrentScreen('LocationPicker')}
            >
              <Text style={{ color: '#4a5568', fontWeight: '600' }}>🗺️ Choisir sur la carte</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.calendarMiniLabel}>Période de disponibilité</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Début (YYYY-MM-DD)"
              placeholderTextColor="#a0aec0"
              value={newCarStartDate}
              onChangeText={setNewCarStartDate}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Fin (YYYY-MM-DD)"
              placeholderTextColor="#a0aec0"
              value={newCarEndDate}
              onChangeText={setNewCarEndDate}
            />
          </View>

          <TouchableOpacity
            style={[styles.bookActionBtn, { backgroundColor: '#c05621', marginTop: 20 }]}
            onPress={() =>
              handleCreateCar(
                {
                  newCarName, newCarPrice, newCarImageName, newCarType,
                  newCarFuel, newCarTransmission,
                  newCarPhone, newCarLatitude, newCarLongitude,
                  startDate: newCarStartDate, endDate: newCarEndDate,
                },
                {
                  setLoading, setNewCarName, setNewCarPrice, setNewCarImageName,
                  setPickedImageUri, refreshCars,
                }
              )
            }
            disabled={loading || uploadingImage}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.bookActionBtnText}>Insérer dans la Base Cars</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentScreen === 'LocationPicker') {
    return (
      <FreeCarsMapScreen
        dbCars={[]}
        onSelectCar={() => {}}
        onBack={() => setCurrentScreen('Admin')}
        pickerMode={true}
        onPickLocation={(lat, lng) => {
          setNewCarLatitude(lat);
          setNewCarLongitude(lng);
          setCurrentScreen('Admin');
        }}
      />
    );
  }

  if (currentScreen === 'Map') {
    return (
      <FreeCarsMapScreen
        dbCars={dbCars}
        onSelectCar={(car) => { setSelectedCar(car); setCurrentScreen('Details'); }}
        onBack={() => setCurrentScreen('Home')}
      />
    );
  }

  if (currentScreen === 'Profile') {
    return (
      <ProfileScreen
        userSession={userSession}
        isAdmin={isAdmin}
        userReservations={userReservations}
        onBack={() => setCurrentScreen('Home')}
      />
    );
  }

  return null;
}
