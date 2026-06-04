import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/AppStyles';

export default function Navbar({
  isAdmin,
  onProfile,
  onAdmin,
  onMap,
  onHistory,
  onLogout,
}) {
  return (
    <View style={styles.navBar}>
      <Text style={styles.navLogo}>
        🚗 CarRent
        <Text style={{ color: '#e53e3e' }}>.ma</Text>
      </Text>

      <View style={styles.navActions}>
        <TouchableOpacity
          onPress={onProfile}
          style={styles.navBtn}
        >
          <Text style={styles.navBtnText}>👤</Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            onPress={onAdmin}
            style={[styles.navBtnAdmin, { marginLeft: 8 }]}
          >
            <Text style={styles.navBtnAdminText}>
              ⚙️ Admin
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onMap}
          style={[styles.navBtn, { marginLeft: 8 }]}
        >
          <Text style={styles.navBtnText}>🗺️</Text>
        </TouchableOpacity>

        {!isAdmin && (
          <TouchableOpacity
            onPress={onHistory}
            style={[styles.navBtn, { marginLeft: 8 }]}
          >
            <Text style={styles.navBtnText}>📋</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onLogout}
          style={[styles.navBtnLogout, { marginLeft: 8 }]}
        >
          <Text style={styles.navBtnLogoutText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}