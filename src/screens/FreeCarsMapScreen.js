// src/screens/FreeCarsMapScreen.js
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const CITY_COORDINATES = {
  'Rabat': { lat: 33.9716, lng: -6.8498 },
  'Casablanca': { lat: 33.5731, lng: -7.5898 },
  'Marrakech': { lat: 31.6295, lng: -7.9811 },
  'Tangier': { lat: 35.7595, lng: -5.8340 },
  'Agadir': { lat: 30.4184, lng: -9.5981 }
};

export default function FreeCarsMapScreen({ dbCars, onSelectCar, onBack }) {
  
  // 📍 Génération ou récupération des coordonnées GPS
  const mappedCars = dbCars.map((car, index) => {
    let lat = car.latitude;
    let lng = car.longitude;

    if (!lat || !lng) {
      const cities = Object.keys(CITY_COORDINATES);
      const assignedCity = cities[index % cities.length]; 
      const baseCoords = CITY_COORDINATES[assignedCity];
      lat = baseCoords.lat + (Math.sin(index) * 0.02);
      lng = baseCoords.lng + (Math.cos(index) * 0.02);
    }

    return {
      ...car,
      latitude: lat,
      longitude: lng
    };
  });

  // 🌐 CONFIGURATION HTML AVEC AFFICHAGE DES IMAGES SUPABASE
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        
        /* Style du Popup Leaflet */
        .popup-wrapper { padding: 2px; width: 160px; }
        
        /* 📸 Style de l'image de la voiture */
        .popup-img-container {
          width: 100%;
          height: 95px;
          border-radius: 6px;
          overflow: hidden;
          background-color: #edf2f7;
          margin-bottom: 8px;
        }
        .popup-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .popup-title { font-weight: bold; font-size: 14px; margin: 0 0 2px 0; color: #1a202c; }
        .popup-desc { color: #718096; font-size: 11px; margin: 0 0 6px 0; }
        .popup-price { color: #2b6cb0; font-weight: bold; font-size: 13px; margin: 0 0 8px 0; }
        .popup-btn {
          background-color: #2b6cb0; color: white; border: none; padding: 8px 12px;
          border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; text-align: center;
          font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .popup-btn:active { background-color: #1a4975; }
        .status-booked { color: #e53e3e; font-size: 11px; font-weight: bold; margin: 4px 0 0 0; text-transform: uppercase; }
        
        /* Ajuster la taille globale du popup Leaflet pour éviter les barres de défilement */
        .leaflet-popup-content { margin: 10px 12px !important; line-height: 1.2 !important; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([33.0, -7.5], 6);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        function emitSelectCar(carId) {
          window.ReactNativeWebView.postMessage(carId);
        }

        const rawCarsData = ${JSON.stringify(mappedCars)};
        var bounds = [];

        rawCarsData.forEach(function(car) {
          const markerColor = car.isAvailable ? '27ae60' : 'c0392b';
          
          const customIcon = L.icon({
            iconUrl: 'https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + markerColor,
            iconSize: [21, 34],
            iconAnchor: [10, 34],
            popupAnchor: [0, -34]
          });

          // Fallback au cas où image_url est vide ou invalide
          const carImage = car.image_url ? car.image_url : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400';

          // 🛠️ Intégration dynamique de la photo dans le HTML du popup
          const popupContent = \`
            <div class="popup-wrapper">
              <div class="popup-img-container">
                <img class="popup-img" src="\${carImage}" alt="\${car.name}" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400';"/>
              </div>
              <p class="popup-title">\${car.name}</p>
              <p class="popup-desc">\${car.fuel || 'Diesel'} • \${car.transmission || 'Manual'}</p>
              <p class="popup-price">\${car.price_per_day} DH / jour</p>
              \${car.isAvailable 
                ? \`<button class="popup-btn" onclick="emitSelectCar('\${car.id}')">Sélectionner</button>\`
                : '<p class="status-booked">❌ Déjà réservé</p>'
              }
            </div>
          \`;

          L.marker([car.latitude, car.longitude], { icon: customIcon })
            .addTo(map)
            .bindPopup(popupContent);

          bounds.push([car.latitude, car.longitude]);
        });

        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.floatingBackButton} onPress={onBack} activeOpacity={0.8}>
        <Text style={styles.backButtonText}>← Retour Catalogue</Text>
      </TouchableOpacity>

      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webView}
        onMessage={(event) => {
          const clickedCarId = event.nativeEvent.data;
          const selectedCarObj = dbCars.find(c => c.id.toString() === clickedCarId.toString());
          if (selectedCarObj) onSelectCar(selectedCarObj);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  webView: { flex: 1, width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  floatingBackButton: {
    position: 'absolute', top: 50, left: 16, zIndex: 999,
    backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 25,
    borderWidth: 1, borderColor: '#e2e8f0', elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 4,
  },
  backButtonText: { color: '#2b6cb0', fontWeight: 'bold', fontSize: 13 },
});