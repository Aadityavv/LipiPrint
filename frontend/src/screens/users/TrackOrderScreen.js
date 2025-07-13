import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';

const { width } = Dimensions.get('window');

const statusIcons = {
  'PENDING': <Icon name="schedule" size={24} color="#FFA726" />,
  'CONFIRMED': <Icon name="check-circle" size={24} color="#4CAF50" />,
  'PRINTING': <Icon name="print" size={24} color="#42A5F5" />,
  'READY': <Icon name="local-shipping" size={24} color="#66BB6A" />,
  'OUT_FOR_DELIVERY': <Icon name="local-shipping" size={24} color="#FFA726" />,
  'DELIVERED': <Icon name="done-all" size={24} color="#4CAF50" />,
  'CANCELLED': <Icon name="cancel" size={24} color="#F44336" />,
};

const orderStatusSteps = [
  { key: 'PENDING', label: 'Order Pending', description: 'Your order is being processed' },
  { key: 'CONFIRMED', label: 'Order Confirmed', description: 'Your order has been confirmed' },
  { key: 'PRINTING', label: 'Printing in Progress', description: 'Your documents are being printed' },
  { key: 'READY', label: 'Ready for Pickup/Delivery', description: 'Your order is ready' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', description: 'Your order is on its way' },
  { key: 'DELIVERED', label: 'Delivered', description: 'Your order has been delivered' },
];

export default function TrackOrderScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { orderId } = route.params;

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      // Extract the actual order ID from the formatted string (e.g., "LP123456" -> "123456")
      const actualOrderId = orderId.replace('LP', '');
      const response = await api.request(`/orders/${actualOrderId}`);
      setOrder(response);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const statusIndex = orderStatusSteps.findIndex(step => step.key === order.status);
    return statusIndex >= 0 ? statusIndex : 0;
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': '#FFA726',
      'CONFIRMED': '#4CAF50',
      'PRINTING': '#42A5F5',
      'READY': '#66BB6A',
      'OUT_FOR_DELIVERY': '#FFA726',
      'DELIVERED': '#4CAF50',
      'CANCELLED': '#F44336',
    };
    return colors[status] || '#667eea';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="search-off" size={48} color="#F44336" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStepIndex = getCurrentStepIndex();
  const files = order.printJobs ? order.printJobs.map(pj => pj.file) : [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <Heading
            title="Track Order"
            variant="primary"
          />
        </LinearGradient>

        <View style={styles.content}>
          {/* Order Summary */}
          <Animatable.View animation="fadeInUp" delay={200} duration={500} style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Icon name="receipt" size={24} color="#667eea" />
              <Text style={styles.summaryTitle}>Order Summary</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{order.status.replace('_', ' ')}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Files:</Text>
              <Text style={styles.summaryValue}>{files.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Pages:</Text>
              <Text style={styles.summaryValue}>{files.reduce((total, file) => total + (file.pages || 0), 0)}</Text>
            </View>
            {files.map((file, idx) => (
              <View key={file.id || idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Icon name="description" size={16} color="#667eea" style={{ marginRight: 6 }} />
                <Text style={{ color: '#222', fontSize: 14 }}>{file.filename} ({file.pages} pages)</Text>
              </View>
            ))}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount:</Text>
              <Text style={styles.summaryValue}>₹{order.totalAmount || 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Order Date:</Text>
              <Text style={styles.summaryValue}>{formatDate(order.createdAt)}</Text>
            </View>
            {order.deliveryType && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery:</Text>
                <Text style={styles.summaryValue}>{order.deliveryType}</Text>
              </View>
            )}
          </Animatable.View>

          {/* Status Stepper */}
          <Animatable.View animation="fadeInUp" delay={400} duration={500}>
            <Text style={styles.sectionTitle}>Order Progress</Text>
            <View style={styles.stepper}>
              {orderStatusSteps.map((step, idx) => (
                <Animatable.View
                  key={step.key}
                  animation="fadeInUp"
                  delay={500 + idx * 100}
                  duration={400}
                >
                  <View style={styles.stepRow}>
                    <View style={styles.stepIconWrap}>
                      <View style={[
                        styles.stepIcon, 
                        idx <= currentStepIndex && styles.stepIconActive,
                        order.status === 'CANCELLED' && idx > currentStepIndex && styles.stepIconCancelled
                      ]}>
                        {idx <= currentStepIndex ? statusIcons[step.key] : (
                          <Icon name="radio-button-unchecked" size={24} color="#e0e7ef" />
                        )}
                      </View>
                      {idx < orderStatusSteps.length - 1 && (
                        <View style={[
                          styles.stepLine, 
                          idx < currentStepIndex && styles.stepLineActive,
                          order.status === 'CANCELLED' && idx >= currentStepIndex && styles.stepLineCancelled
                        ]} />
                      )}
                    </View>
                    <View style={styles.stepTextWrap}>
                      <Text style={[
                        styles.stepLabel, 
                        idx <= currentStepIndex && styles.stepLabelActive,
                        order.status === 'CANCELLED' && idx > currentStepIndex && styles.stepLabelCancelled
                      ]}>
                        {step.label}
                      </Text>
                      <Text style={[
                        styles.stepDescription,
                        idx <= currentStepIndex && styles.stepDescriptionActive
                      ]}>
                        {step.description}
                      </Text>
                    </View>
                  </View>
                </Animatable.View>
              ))}
            </View>
          </Animatable.View>

          {/* Action Buttons */}
          <Animatable.View animation="fadeInUp" delay={800} duration={500}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('InvoiceDetailScreen', { orderId: order.id, navigation })}
                activeOpacity={0.9}
              >
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.primaryGradient}>
                  <Icon name="receipt" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>View Invoice</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Orders' })}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>View All Orders</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerGradient: { 
    paddingTop: 50, 
    paddingBottom: 30, 
    paddingHorizontal: 20 
  },
  header: { 
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: 'white', 
    marginBottom: 8 
  },
  headerSubtitle: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.9)', 
    textAlign: 'center' 
  },
  content: { 
    padding: 20 
  },
  summaryCard: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 28, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.07, 
    shadowRadius: 5, 
    elevation: 1 
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  summaryRow: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: { 
    fontSize: 15, 
    color: '#333' 
  },
  summaryValue: { 
    fontWeight: 'bold', 
    color: '#667eea' 
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#1a1a1a', 
    marginBottom: 16 
  },
  stepper: { 
    marginTop: 10, 
    marginLeft: 10 
  },
  stepRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 30 
  },
  stepIconWrap: { 
    alignItems: 'center', 
    width: 40, 
    position: 'relative' 
  },
  stepIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#e0e7ef', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  stepIconActive: { 
    backgroundColor: '#667eea' 
  },
  stepIconCancelled: {
    backgroundColor: '#f5f5f5',
  },
  stepLine: { 
    position: 'absolute', 
    top: 36, 
    left: 18, 
    width: 4, 
    height: 30, 
    backgroundColor: '#e0e7ef', 
    borderRadius: 2 
  },
  stepLineActive: { 
    backgroundColor: '#667eea' 
  },
  stepLineCancelled: {
    backgroundColor: '#f5f5f5',
  },
  stepTextWrap: { 
    marginLeft: 18, 
    flex: 1 
  },
  stepLabel: { 
    fontSize: 16, 
    color: '#888', 
    fontWeight: 'bold' 
  },
  stepLabelActive: { 
    color: '#667eea' 
  },
  stepLabelCancelled: {
    color: '#ccc',
  },
  stepDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  stepDescriptionActive: {
    color: '#667eea',
  },
  buttonContainer: {
    marginTop: 20,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  primaryGradient: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
}); 