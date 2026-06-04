import { Alert } from 'react-native';
import { supabase } from '../../../supabase';

export const fetchAvailableCars = async (startDate, endDate, setDbCars, setFetchingCars) => {
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

    const bookedCarIds = resData.map((r) => r.car_id);
    setDbCars(
      (carsData || []).map((car) => ({
        ...car,
        isAvailable: !bookedCarIds.includes(car.id),
      }))
    );
  } catch (error) {
    Alert.alert('Erreur', error.message);
  } finally {
    setFetchingCars(false);
  }
};

export const handleCreateCar = async (
  { newCarName, newCarPrice, newCarImageName, newCarType, newCarFuel, newCarTransmission,
    newCarPhone, newCarLatitude, newCarLongitude, startDate, endDate },
  { setLoading, setNewCarName, setNewCarPrice, setNewCarImageName, setPickedImageUri, refreshCars }
) => {
  if (!newCarName || !newCarPrice || !newCarImageName) {
    Alert.alert('Erreur Admin', 'Veuillez sélectionner une image et remplir tous les champs.');
    return;
  }
  setLoading(true);
  const imageUrl = `https://ewsqhvbbyvzhjamabsir.supabase.co/storage/v1/object/public/cars-images/${newCarImageName}`;
  try {
    const { error } = await supabase.from('cars').insert([
      {
        name: newCarName,
        type: newCarType,
        price_per_day: parseInt(newCarPrice),
        fuel: newCarFuel,
        transmission: newCarTransmission,
        phone: newCarPhone || null,
        latitude: newCarLatitude ? parseFloat(newCarLatitude) : null,
        longitude: newCarLongitude ? parseFloat(newCarLongitude) : null,
        available_from: startDate,
        available_to: endDate,
        image_url: imageUrl,
      },
    ]);
    if (error) throw error;
    Alert.alert('Succès Admin', `${newCarName} ajouté à l'inventaire.`);
    setNewCarName('');
    setNewCarPrice('');
    setNewCarImageName('');
    setPickedImageUri(null);
    refreshCars();
  } catch (error) {
    Alert.alert("Erreur d'insertion", error.message);
  } finally {
    setLoading(false);
  }
};

export const handleDeleteCar = async (carId, carName, refreshCars) => {
  Alert.alert('Supprimer ce véhicule ?', `Supprimer "${carName}" de l'inventaire ?`, [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Supprimer',
      style: 'destructive',
      onPress: async () => {
        try {
          const { error } = await supabase.from('cars').delete().eq('id', carId);
          if (error) throw error;
          Alert.alert('Supprimé', `${carName} a été retiré.`);
          refreshCars();
        } catch (error) {
          Alert.alert('Erreur', error.message);
        }
      },
    },
  ]);
};

export const updateCarAvailability = async (carId, startDate, endDate) => {
  const { error } = await supabase
    .from('cars')
    .update({ available_from: startDate, available_to: endDate })
    .eq('id', carId);
  if (error) Alert.alert('Erreur', 'Impossible de définir la période');
  else Alert.alert('Succès', 'Période mise à jour !');
};
