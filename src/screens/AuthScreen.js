// src/screens/AuthScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  TouchableWithoutFeedback, Keyboard, Platform, StatusBar,
  ActivityIndicator, Image, StyleSheet, Alert
} from 'react-native';
import { supabase } from '../../supabase';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleAuthSubmit = async () => {
    if (!email || !password || (!isLogin && !fullName)) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Erreur', error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: email.includes('admin') ? 'admin' : 'client',
          },
        },
      });
      if (error) Alert.alert('Erreur', error.message);
      else Alert.alert('Succès', 'Vérifiez votre boîte email.');
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>

            {/* Logo */}
            <View style={styles.logoSection}>
              <Text style={styles.logoTitle}>🚗 CarRent</Text>
              <Text style={styles.logoSubtitle}>
                {isLogin ? 'Bienvenue ! Connectez-vous.' : 'Créez votre compte gratuitement.'}
              </Text>
            </View>

            {/* Card */}
            <View style={styles.card}>

              {!isLogin && (
                <>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nom Complet *"
                      placeholderTextColor="#a0aec0"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>📱</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Numéro de téléphone"
                      placeholderTextColor="#a0aec0"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                </>
              )}

              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Adresse Email *"
                  placeholderTextColor="#a0aec0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe *"
                  placeholderTextColor="#a0aec0"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity style={styles.btn} onPress={handleAuthSubmit} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>{isLogin ? 'Se Connecter →' : "S'inscrire →"}</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleRow}>
                <Text style={styles.toggleText}>
                  {isLogin ? "Pas encore de compte ? " : "Déjà inscrit ? "}
                  <Text style={styles.toggleHighlight}>
                    {isLogin ? "S'inscrire" : "Se connecter"}
                  </Text>
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  inner: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoSection: {
    marginBottom: 28,
    alignItems: 'center',
  },
  logoTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  logoSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#2d3748',
  },
  btn: {
    backgroundColor: '#2b6cb0',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    elevation: 5,
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  toggleRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 13,
    color: '#718096',
  },
  toggleHighlight: {
    color: '#2b6cb0',
    fontWeight: '700',
  },
});