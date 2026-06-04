import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import styles from '../styles/AppStyles';

export default function CarCard({
  item,
  isAdmin,
  viewCarDetails,
  handleDeleteCar,
 onEdit,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() =>
        item.isAvailable
          ? viewCarDetails(item)
          : Alert.alert(
              'Indisponible',
              'Ce véhicule est loué aux dates sélectionnées.'
            )
      }
    >
      <View style={styles.carCard}>
        {/* IMAGE */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.carImage}
          />

          <View
            style={[
              styles.availabilityOverlay,
              {
                backgroundColor: item.isAvailable
                  ? '#38a169'
                  : '#e53e3e',
              },
            ]}
          >
            <Text style={styles.availabilityOverlayText}>
              {item.isAvailable
                ? '✓ Disponible'
                : '✗ Réservé'}
            </Text>
          </View>

          <View style={styles.priceOverlay}>
            <Text style={styles.priceOverlayText}>
              {item.price_per_day} DH
            </Text>
            <Text style={styles.priceOverlaySuffix}>
              /jour
            </Text>
          </View>
        </View>

        {/* INFO */}
        <View style={styles.carCardBody}>
          <Text style={styles.carCardName}>
            {item.name}
          </Text>

          <View style={styles.carCardTags}>
            <View style={styles.carTag}>
              <Text style={styles.carTagText}>
                ⛽ {item.fuel}
              </Text>
            </View>

            <View style={styles.carTag}>
              <Text style={styles.carTagText}>
                ⚙️ {item.transmission}
              </Text>
            </View>

            <View style={styles.carTag}>
              <Text style={styles.carTagText}>
                🏷️ {item.type}
              </Text>
            </View>
          </View>

          {item.phone ? (
            <View style={styles.carTag}>
              <Text style={styles.carTagText}>
                📞 {item.phone}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ADMIN DELETE */}
{isAdmin && (
    <View style={{ flexDirection: 'row', marginTop: 10 }}>
      <TouchableOpacity
        style={[styles.deleteBtn, { backgroundColor: '#3182ce', marginRight: 10, flex: 1 }]}
        onPress={() => onEdit(item)}
      >
        <Text style={styles.deleteBtnText}>✏️ Modifier</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.deleteBtn, { flex: 1 }]}
        onPress={() => handleDeleteCar(item.id, item.name)}
      >
        <Text style={styles.deleteBtnText}>🗑️ Supprimer</Text>
      </TouchableOpacity>
    </View>
        )}
      </View>
	  
    </TouchableOpacity>

  );
}