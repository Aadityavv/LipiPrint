import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function OrderConfirmationScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [showConfetti, setShowConfetti] = React.useState(true);

  // Use real order from params
  const order = route?.params?.order;

  // Always go to Home on back
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('MainTabs', { screen: 'Home' });
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  // Defensive check
  if (!order) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No order found. Please return to Home.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })} style={{ marginTop: 20, padding: 12, backgroundColor: '#667eea', borderRadius: 8 }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fallback for breakdown if not present
  const files = order?.printJobs ? order.printJobs.map(pj => pj.file) : [];

  const orderDetails = {
    orderId: order?.id ? `LP${order.id}` : 'N/A',
    status: order?.status || 'Confirmed',
    estimatedTime: '2-3 hours',
    totalAmount: order?.totalAmount ? `₹${order.totalAmount}` : 'N/A',
    items: files.map(f => ({ name: f.filename, pages: f.pages, price: '' })),
  };

  const steps = [
    { step: 1, title: 'Order Placed', description: 'Your order has been placed', icon: <Icon name="check-circle" size={24} color="#667eea" />, completed: true },
    { step: 2, title: 'Printing', description: 'Your documents are being printed', icon: <Icon name="print" size={24} color="#42A5F5" />, completed: false },
    { step: 3, title: 'Ready for Pickup', description: 'Your order is ready for pickup', icon: <Icon name="local-shipping" size={24} color="#66BB6A" />, completed: false },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#4CAF50', '#45a049']}
          style={styles.headerGradient}
        >
          <Animatable.View animation="fadeInDown" delay={100} duration={500} style={styles.header}>
            <Animatable.View animation="bounceIn" delay={300} duration={600}>
              <Text style={styles.successIcon}>🎉</Text>
            </Animatable.View>
            <Text style={styles.headerTitle}>Order Confirmed!</Text>
            <Text style={styles.headerSubtitle}>Your print order has been successfully placed</Text>
          </Animatable.View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Order ID Card */}
          <Animatable.View animation="fadeInUp" delay={200} duration={500}>
            <View style={styles.orderIdCard}>
              <Text style={styles.orderIdLabel}>Order ID</Text>
              <Text style={styles.orderId}>{orderDetails.orderId}</Text>
              <Text style={styles.orderStatus}>{orderDetails.status}</Text>
            </View>
          </Animatable.View>

          {/* Order Summary */}
          <Animatable.View animation="fadeInUp" delay={300} duration={500}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryCard}>
              {files.map((item, index) => (
                <Animatable.View
                  key={index}
                  animation="slideInRight"
                  delay={400 + index * 100}
                  duration={400}
                >
                  <View style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.filename}</Text>
                      <Text style={styles.itemPages}>{item.pages} pages</Text>
                    </View>
                    <Text style={styles.itemPrice}>{item.price}</Text>
                  </View>
                </Animatable.View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>{orderDetails.totalAmount}</Text>
              </View>
            </View>
          </Animatable.View>

          {/* Next Steps */}
          <Animatable.View animation="fadeInUp" delay={400} duration={500}>
            <Text style={styles.sectionTitle}>What's Next?</Text>
            <View style={styles.stepsContainer}>
              {steps.map((step, index) => (
                <Animatable.View
                  key={step.step}
                  animation="fadeInUp"
                  delay={500 + index * 150}
                  duration={400}
                >
                  <View style={styles.stepCard}>
                    <View style={styles.stepIcon}>
                      <Icon name={step.icon.props.name} size={24} color={step.icon.props.color} />
                    </View>
                    <View style={styles.stepInfo}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepDescription}>{step.description}</Text>
                    </View>
                    {step.completed && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>✓</Text>
                      </View>
                    )}
                  </View>
                </Animatable.View>
              ))}
            </View>
          </Animatable.View>

          {/* Estimated Time */}
          <Animatable.View animation="fadeInUp" delay={600} duration={500}>
            <View style={styles.timeCard}>
              <Text style={styles.timeIcon}>⏰</Text>
              <Text style={styles.timeTitle}>Estimated Ready Time</Text>
              <Text style={styles.timeValue}>{orderDetails.estimatedTime}</Text>
            </View>
          </Animatable.View>

          {/* Action Buttons */}
          <Animatable.View animation="fadeInUp" delay={700} duration={500}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('TrackOrderScreen', { orderId: orderDetails.orderId })}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.primaryGradient}
                >
                  <Text style={styles.primaryButtonText}>Track Order</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.invoiceButton}
                onPress={() => navigation.navigate('InvoiceDetailScreen', { orderId: order.id, navigation })}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.invoiceGradient}>
                  <Icon name="receipt" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.invoiceText}>Invoice</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Support Info */}
          <Animatable.View animation="fadeInUp" delay={800} duration={500}>
            <View style={styles.supportCard}>
              <Text style={styles.supportIcon}>💬</Text>
              <Text style={styles.supportTitle}>Need Help?</Text>
              <Text style={styles.supportText}>
                Contact us at support@lipiprint.com or call +91 98765 43210
              </Text>
            </View>
          </Animatable.View>
        </View>
      </ScrollView>
      {showConfetti && (
        <ConfettiCannon
          count={180}
          origin={{ x: width / 2, y: 0 }}
          fadeOut
          explosionSpeed={120}
          fallSpeed={1200}
          onAnimationEnd={() => setShowConfetti(false)}
          autoStart
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  orderIdCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orderIdLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  orderStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemPages: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  stepsContainer: {
    marginBottom: 30,
  },
  stepCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  timeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  primaryGradient: {
    padding: 16,
    alignItems: 'center',
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
  supportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supportIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  supportText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  invoiceButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  invoiceGradient: {
    padding: 16,
    alignItems: 'center',
  },
  invoiceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
}); 
