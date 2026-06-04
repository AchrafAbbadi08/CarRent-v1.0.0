import { Alert } from 'react-native';
import { supabase } from '../../../supabase';
import { scheduleNotification } from './notificationApi';

export const fetchUserBookings = async (setUserReservations, setFetchingHistory) => {
  setFetchingHistory(true);
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(
        `id, pickup_city, start_date, end_date, total_price, status, rental_days, cars(name, image_url)`
      )
      .order('created_at', { ascending: false });
    if (error) throw error;
    setUserReservations(data || []);
  } catch (error) {
    console.error(error);
  } finally {
    setFetchingHistory(false);
  }
};

export const executeBooking = async (
  { userId, selectedCar, selectedCity, startDate, endDate, isAdmin },
  { setLoading, setCurrentScreen, refreshBookings }
) => {
  if (isAdmin) {
    Alert.alert('Accès refusé', 'Les administrateurs ne peuvent pas effectuer de réservations.');
    return;
  }
  setLoading(true);
  const dayCount = Math.max(
    1,
    Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
  );
  const totalPrice = selectedCar.price_per_day * dayCount;
  try {
    const { error } = await supabase.from('reservations').insert([
      {
        user_id: userId,
        car_id: selectedCar.id,
        pickup_city: selectedCity,
        start_date: startDate,
        end_date: endDate,
        rental_days: dayCount,
        total_price: totalPrice,
        status: 'confirmed',
      },
    ]);
    if (error) throw error;
    await scheduleNotification(
      '🚗 Réservation Confirmée !',
      `Votre véhicule ${selectedCar.name} est bloqué à ${selectedCity}.`,
      { screen: 'History' }
    );
    await refreshBookings();
    Alert.alert('Réservée !', 'Votre véhicule est bloqué.', [
      { text: 'OK', onPress: () => setCurrentScreen('Home') },
    ]);
  } catch (error) {
    Alert.alert('Erreur', error.message);
  } finally {
    setLoading(false);
  }
};

export const handleCancelBooking = async (reservationId, refreshBookings, refreshCars) => {
  Alert.alert('Supprimer la réservation ?', 'Cette action est irréversible.', [
    { text: 'Non', style: 'cancel' },
    {
      text: 'Oui, Supprimer',
      style: 'destructive',
      onPress: async () => {
        try {
          const { error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', reservationId);
          if (error) throw error;
          await scheduleNotification(
            '⚠️ Réservation Supprimée',
            'Votre réservation a été supprimée définitivement.'
          );
          Alert.alert('Supprimée', 'Votre réservation a été supprimée.');
          refreshBookings();
          refreshCars();
        } catch (error) {
          Alert.alert('Erreur', error.message);
        }
      },
    },
  ]);
};
