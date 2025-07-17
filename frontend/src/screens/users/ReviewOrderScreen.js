import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';
import api from '../../services/api'; // Assuming api.js is in the parent directory

const { width } = Dimensions.get('window');

export default function ReviewOrderScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api.getOrder(orderId)
      .then(setOrder)
      .catch(e => setError('Failed to load order.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></View>;
  }
  if (error) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }
  if (!order) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>No order found.</Text></View>;
  }

  // Extract data from order
  const files = order.printJobs?.map(j => j.file) || [];
  const printOptions = order.printJobs?.[0]?.options ? JSON.parse(order.printJobs[0].options) : {};
  const delivery = {
    method: order.deliveryType === 'PICKUP' ? 'Store Pickup' : 'Home Delivery',
    address: order.deliveryAddress,
    phone: order.phone,
  };
  const cost = {
    printing: order.totalAmount, // For more detailed breakdown, call api.calculatePrintCost
    delivery: order.deliveryType === 'PICKUP' ? 0 : 30, // Or fetch from settings
    total: order.totalAmount,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <Heading
            title="Review Order"
            variant="primary"
          />
        </LinearGradient>

        <View style={styles.content}>
          {/* Files Summary */}
          <Animatable.View animation="fadeInUp" delay={200} duration={500}>
            <Text style={styles.sectionTitle}>Files</Text>
            <View style={styles.card}>
              {files.map((file, idx) => (
                <View key={file.id || file.name || idx} style={styles.fileRow}>
                  <Text style={styles.fileIcon}>📄</Text>
                  <Text style={styles.fileName}>{file.originalFilename || file.name}</Text>
                  <Text style={styles.filePages}>{file.pages} pages</Text>
                </View>
              ))}
            </View>
          </Animatable.View>

          {/* Print Options */}
          <Animatable.View animation="fadeInUp" delay={300} duration={500}>
            <Text style={styles.sectionTitle}>Print Options</Text>
            <View style={styles.cardRow}>
              <View style={styles.optionCard}><Text style={styles.optionIcon}>📄</Text><Text style={styles.optionText}>{printOptions.paper || printOptions.paperSize}</Text></View>
              <View style={styles.optionCard}><Text style={styles.optionIcon}>🎨</Text><Text style={styles.optionText}>{printOptions.printType || printOptions.color}</Text></View>
              <View style={styles.optionCard}><Text style={styles.optionIcon}>🔄</Text><Text style={styles.optionText}>{printOptions.sides || printOptions.printOption}</Text></View>
            </View>
          </Animatable.View>

          {/* Delivery Info */}
          <Animatable.View animation="fadeInUp" delay={400} duration={500}>
            <Text style={styles.sectionTitle}>Delivery</Text>
            <View style={styles.card}>
              <Text style={styles.deliveryMethod}>{delivery.method}</Text>
              <Text style={styles.deliveryAddress}>{delivery.address}</Text>
              <Text style={styles.deliveryPhone}>📞 {delivery.phone}</Text>
            </View>
          </Animatable.View>

          {/* Cost Breakdown */}
          <Animatable.View animation="fadeInUp" delay={500} duration={500}>
            <Text style={styles.sectionTitle}>Cost Breakdown</Text>
            <View style={styles.card}>
              <View style={styles.costRow}><Text style={styles.costLabel}>Printing</Text><Text style={styles.costValue}>₹{cost.printing}</Text></View>
              <View style={styles.costRow}><Text style={styles.costLabel}>Delivery</Text><Text style={styles.costValue}>₹{cost.delivery}</Text></View>
              <View style={styles.costRowTotal}><Text style={styles.costLabelTotal}>Total</Text><Text style={styles.costValueTotal}>₹{cost.total}</Text></View>
            </View>
          </Animatable.View>
        </View>
      </ScrollView>
      {/* Proceed Button */}
      <Animatable.View animation="fadeInUp" delay={700} duration={500} style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Checkout', { orderId })} activeOpacity={0.85}>
          <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.proceedButton}>
            <Text style={styles.proceedText}>Proceed to Checkout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
}

const CARD_WIDTH = (width - 60) / 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerGradient: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 },
  header: { alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 18, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  optionCard: { width: CARD_WIDTH, backgroundColor: '#f0f8ff', borderRadius: 14, alignItems: 'center', paddingVertical: 18, marginHorizontal: 4 },
  optionIcon: { fontSize: 28, marginBottom: 6 },
  optionText: { fontSize: 15, fontWeight: 'bold', color: '#667eea' },
  fileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  fileIcon: { fontSize: 22, marginRight: 10 },
  fileName: { flex: 1, fontSize: 15, color: '#222' },
  filePages: { fontSize: 14, color: '#667eea', fontWeight: 'bold' },
  deliveryMethod: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  deliveryAddress: { fontSize: 14, color: '#666', marginBottom: 2 },
  deliveryPhone: { fontSize: 14, color: '#667eea', marginTop: 2 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  costLabel: { fontSize: 15, color: '#333' },
  costValue: { fontSize: 15, color: '#333', fontWeight: '600' },
  costRowTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: '#e0e7ef', paddingTop: 10 },
  costLabelTotal: { fontSize: 17, fontWeight: 'bold', color: '#1a1a1a' },
  costValueTotal: { fontSize: 17, fontWeight: 'bold', color: '#667eea' },
  buttonContainer: { padding: 20, backgroundColor: 'transparent' },
  proceedButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 },
  proceedText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
});
