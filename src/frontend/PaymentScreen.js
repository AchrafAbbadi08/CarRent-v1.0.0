// src/frontend/PaymentScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet, ScrollView, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import { supabase } from '../../supabase';

export default function PaymentScreen({ userSession, selectedCar, selectedCity, startDate, endDate, totalPrice, dayCount, onSuccess, onBack }) {
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  useEffect(() => {
    fetchPaymentIntent();
  }, []);

  const fetchPaymentIntent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: totalPrice,
          currency: 'usd',
          reservationId: `temp_${Date.now()}`,
        },
      });

      if (error) throw error;
      setClientSecret(data.clientSecret);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de préparer le paiement : ' + err.message);
    }
  };

  const handlePay = async () => {
    if (!clientSecret || !cardComplete) {
      Alert.alert('Carte incomplète', 'Veuillez saisir vos informations de carte valides.');
      return;
    }

    setLoading(true);
    try {
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            email: userSession.user.email,
          },
        },
      });

      if (error) throw new Error(error.message);

      if (paymentIntent.status === 'Succeeded') {
        // Créer la réservation dans Supabase après paiement réussi
        const { error: resError } = await supabase
          .from('reservations')
          .insert([{
            user_id: userSession.user.id,
            car_id: selectedCar.id,
            pickup_city: selectedCity,
            start_date: startDate,
            end_date: endDate,
            rental_days: dayCount,
            total_price: totalPrice,
            status: 'confirmed',
            payment_status: 'paid',
            payment_intent_id: paymentIntent.id,
          }]);

        if (resError) throw resError;

        onSuccess();
      }
    } catch (err) {
      Alert.alert('Paiement échoué', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Retour</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ padding: 24 }}>

        {/* Header */}
        <Text style={styles.title}>💳 Paiement sécurisé</Text>
        <Text style={styles.subtitle}>Votre paiement est chiffré et sécurisé par Stripe</Text>

        {/* Récap commande */}
        <View style={styles.orderCard}>
          <Image source={{ uri: selectedCar.image_url }} style={styles.carThumb} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.carName}>{selectedCar.name}</Text>
            <Text style={styles.carMeta}>📍 {selectedCity}</Text>
            <Text style={styles.carMeta}>📅 {startDate} → {endDate}</Text>
            <Text style={styles.carMeta}>🗓️ {dayCount} jour{dayCount > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total à payer</Text>
          <Text style={styles.totalAmount}>{totalPrice} DH</Text>
        </View>

        {/* Card Input */}
        <View style={styles.cardSection}>
          <Text style={styles.cardLabel}>💳 Informations de carte</Text>
          <CardField
            postalCodeEnabled={false}
            placeholder={{ number: '4242 4242 4242 4242' }}
            cardStyle={{
              backgroundColor: '#f7fafc',
              textColor: '#1a202c',
              borderColor: '#e2e8f0',
              borderWidth: 1,
              borderRadius: 10,
              fontSize: 16,
            }}
            style={styles.cardField}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
          />
          <Text style={styles.testHint}>
            🧪 Test : utilisez la carte 4242 4242 4242 4242 — exp: 12/34 — CVC: 123
          </Text>
        </View>

        {/* Bouton payer */}
        <TouchableOpacity
          style={[styles.payBtn, (!cardComplete || loading || !clientSecret) && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={!cardComplete || loading || !clientSecret}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payBtnText}>🔒 Payer {totalPrice} DH</Text>
          )}
        </TouchableOpacity>

        {/* Badges sécurité */}
        <View style={styles.securityBadges}>
          <Text style={styles.securityText}>🔐 SSL • 🛡️ Stripe Secure • ✅ 3D Secure</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  backButton: { padding: 14, backgroundColor: '#fff' },
  backButtonText: { color: '#2b6cb0', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: '800', color: '#1a202c', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#718096', marginBottom: 24 },
  orderCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  carThumb: { width: 90, height: 70, borderRadius: 10, resizeMode: 'cover' },
  carName: { fontSize: 16, fontWeight: '700', color: '#1a202c', marginBottom: 4 },
  carMeta: { fontSize: 12, color: '#718096', marginTop: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ebf8ff', borderRadius: 12, padding: 16, marginBottom: 24 },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#2b6cb0' },
  totalAmount: { fontSize: 26, fontWeight: '800', color: '#2b6cb0' },
  cardSection: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#2d3748', marginBottom: 14 },
  cardField: { width: '100%', height: 52, marginBottom: 10 },
  testHint: { fontSize: 11, color: '#a0aec0', textAlign: 'center', marginTop: 6 },
  payBtn: { backgroundColor: '#2b6cb0', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  payBtnDisabled: { backgroundColor: '#a0aec0' },
  payBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  securityBadges: { alignItems: 'center', marginBottom: 30 },
  securityText: { fontSize: 12, color: '#a0aec0' },
});