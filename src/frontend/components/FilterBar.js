import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import styles from '../styles/AppStyles';

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  showFilterMenu,
  setShowFilterMenu,

  startDate,
  setStartDate,
  endDate,
  setEndDate,

  selectedCity,
  setSelectedCity,
  selectedCategory,
  setSelectedCategory,

  filterMinPrice,
  setFilterMinPrice,
  filterMaxPrice,
  setFilterMaxPrice,

  CITIES,
  CATEGORIES,
}) {
  return (
    <>
      {/* Search Bar */}
      <View style={styles.filterBar}>
        <TextInput
          style={styles.filterSearchInput}
          placeholder="🔍 Rechercher un modèle..."
          placeholderTextColor="#a0aec0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <TouchableOpacity
          style={[
            styles.filterMenuBtn,
            showFilterMenu && styles.filterMenuBtnActive,
          ]}
          onPress={() => setShowFilterMenu(!showFilterMenu)}
        >
          <Text
            style={[
              styles.filterMenuBtnText,
              showFilterMenu && { color: '#fff' },
            ]}
          >
            ⚙️ Filtres
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Menu */}
      {showFilterMenu && (
        <View style={styles.filterDropdown}>
          <Text style={styles.filterLabel}>
            📅 Période de location
          </Text>

          <View
            style={{
              flexDirection: 'row',
              marginBottom: 14,
            }}
          >
            <TextInput
              style={[
                styles.filterInput,
                { flex: 1, marginRight: 8 },
              ]}
              placeholder="Début (AAAA-MM-JJ)"
              value={startDate}
              onChangeText={setStartDate}
            />

            <TextInput
              style={[
                styles.filterInput,
                { flex: 1 },
              ]}
              placeholder="Fin (AAAA-MM-JJ)"
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>

          <Text style={styles.filterLabel}>
            📍 Ville
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 14 }}
          >
            {CITIES.map((city) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.filterChip,
                  selectedCity === city &&
                    styles.filterChipActive,
                ]}
                onPress={() => setSelectedCity(city)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCity === city && {
                      color: '#fff',
                    },
                  ]}
                >
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>
            🚗 Catégorie
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 14 }}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  selectedCategory === cat &&
                    styles.filterChipActive,
                ]}
                onPress={() =>
                  setSelectedCategory(cat)
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === cat && {
                      color: '#fff',
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>
            💰 Prix (DH/jour)
          </Text>

          <View
            style={{
              flexDirection: 'row',
              marginBottom: 16,
            }}
          >
            <TextInput
              style={[
                styles.filterInput,
                { flex: 1, marginRight: 8 },
              ]}
              placeholder="Min"
              keyboardType="numeric"
              value={filterMinPrice}
              onChangeText={setFilterMinPrice}
            />

            <TextInput
              style={[
                styles.filterInput,
                { flex: 1 },
              ]}
              placeholder="Max"
              keyboardType="numeric"
              value={filterMaxPrice}
              onChangeText={setFilterMaxPrice}
            />
          </View>

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
            <Text style={styles.filterResetBtnText}>
              🔄 Réinitialiser les filtres
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}