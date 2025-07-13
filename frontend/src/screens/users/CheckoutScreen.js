import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';

const { width } = Dimensions.get('window');

export default function CheckoutScreen({ navigation, route }) {
  const { theme } = useTheme();
  // Mock data for demonstration
  const order = {
    files: [
      { name: 'Document1.pdf', pages: 12 },
      { name: 'Notes.docx', pages: 8 },
    ],
    delivery: {
      method: 'Home Delivery',
      address: '101, Green Residency, MG Road, Bangalore',
      phone: '9876543210',
    },
    payment: {
      method: 'UPI Payment',
      icon: <Icon name="phone" size={24} color="#667eea" />,
    },
    total: 110,
  };

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      // Create a print job for each file
      const printJobsPayload = order.files.map(file => ({
        file: { id: file.id || 1 }, // Use real file id if available
        user: { id: 1 }, // Use a mock user id for demo
        status: 'QUEUED',
        options: JSON.stringify({
          color: 'Black & White',
          paper: 'A4',
          quality: '75 GSM',
          side: 'Single Side',
          binding: 'None',
        }),
      }));
      // No need to call createPrintJob for each, just send to order
      const deliveryAddress = order.delivery.address ? order.delivery.address.trim() : '';
      const orderPayload = {
        user: { id: 1 },
        printJobs: printJobsPayload,
        status: 'PENDING',
        totalAmount: order.total,
        deliveryType: 'DELIVERY',
        deliveryAddress: deliveryAddress,
        phone: order.delivery.phone,
      };
      const createdOrder = await api.createOrder(orderPayload);
      navigation.navigate('OrderConfirmation', { order: createdOrder });
    } catch (e) {
      setError('Failed to place order. Please try again.');
      console.error('Order creation error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <Heading
            title="Checkout"
            variant="primary"
          />
        </LinearGradient>

        <View style={styles.content}>
          {/* Order Files */}
          <Animatable.View animation="fadeInUp" delay={200} duration={500}>
            <Text style={styles.sectionTitle}>Files</Text>
            <View style={styles.card}>
              {order.files.map((file, idx) => (
                <View key={file.name} style={styles.fileRow}>
                  <Text style={styles.fileIcon}>📄</Text>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <Text style={styles.filePages}>{file.pages} pages</Text>
                </View>
              ))}
            </View>
          </Animatable.View>

          {/* Delivery Address */}
          <Animatable.View animation="fadeInUp" delay={300} duration={500}>
            <Text style={styles.sectionTitle}>Delivery</Text>
            <View style={styles.card}>
              <Text style={styles.deliveryMethod}>{order.delivery.method}</Text>
              <Text style={styles.deliveryAddress}>{order.delivery.address}</Text>
              <Text style={styles.deliveryPhone}>📞 {order.delivery.phone}</Text>
            </View>
          </Animatable.View>

          {/* Payment Method */}
          <Animatable.View animation="fadeInUp" delay={400} duration={500}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.cardRow}>
              <View style={styles.paymentCard}>
                <Text style={styles.paymentIcon}>{order.payment.icon}</Text>
                <Text style={styles.paymentText}>{order.payment.method}</Text>
              </View>
            </View>
          </Animatable.View>

          {/* Total */}
          <Animatable.View animation="fadeInUp" delay={500} duration={500}>
            <Text style={styles.sectionTitle}>Total</Text>
            <View style={styles.card}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{order.total}</Text>
              </View>
            </View>
          </Animatable.View>
        </View>
      </ScrollView>
      {/* Place Order Button */}
      <Animatable.View animation="fadeInUp" delay={700} duration={500} style={styles.buttonContainer}>
        {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}
        <TouchableOpacity onPress={handlePlaceOrder} activeOpacity={0.85} disabled={loading}>
          <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.placeOrderButton}>
            {loading ? (
              <Text style={styles.placeOrderText}>Placing Order...</Text>
            ) : (
              <Text style={styles.placeOrderText}>Place Order</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerGradient: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 },
  header: { alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 18, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 18 },
  fileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  fileIcon: { fontSize: 22, marginRight: 10 },
  fileName: { flex: 1, fontSize: 15, color: '#222' },
  filePages: { fontSize: 14, color: '#667eea', fontWeight: 'bold' },
  deliveryMethod: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  deliveryAddress: { fontSize: 14, color: '#666', marginBottom: 2 },
  deliveryPhone: { fontSize: 14, color: '#667eea', marginTop: 2 },
  paymentCard: { backgroundColor: '#f0f8ff', borderRadius: 14, alignItems: 'center', flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 18 },
  paymentIcon: { fontSize: 26, marginRight: 10 },
  paymentText: { fontSize: 15, fontWeight: 'bold', color: '#667eea' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 17, fontWeight: 'bold', color: '#1a1a1a' },
  totalValue: { fontSize: 17, fontWeight: 'bold', color: '#667eea' },
  buttonContainer: { padding: 20, backgroundColor: 'transparent' },
  placeOrderButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 },
  placeOrderText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
});
