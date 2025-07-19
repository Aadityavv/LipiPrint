import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import { launchRazorpay, createRazorpayOrder } from '../../services/razorpay';
import ApiService from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import Heading from '../../components/Heading';

const { width } = Dimensions.get('window');

export default function PaymentScreen({ navigation, route }) {
  console.log('[PaymentScreen] route.params:', route.params);
  const { files, selectedOptions, deliveryType, deliveryAddress, phone, total, totalPrice, priceBreakdown } = route.params || {};
  
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState(null);
  const [invoiceType, setInvoiceType] = useState('B2C'); // Will be set by user type
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [alertOnConfirm, setAlertOnConfirm] = useState(null);
  const [alertShowCancel, setAlertShowCancel] = useState(false);

  useEffect(() => {
    ApiService.getCurrentUser().then(userData => {
      setUser(userData);
      if (userData && userData.type) {
        setInvoiceType(userData.type === 'student' ? 'B2C' : 'B2B');
      }
    });
  }, []);

  // GST Calculation (18% on subtotal)
  const baseTotal = (totalPrice !== undefined && totalPrice !== null) ? totalPrice : (total || 0);
  const gst = Math.round(baseTotal * 0.18);
  const grandTotal = baseTotal + gst;

  const orderSummary = {
    items: files?.length || 0,
    pages: files?.reduce((sum, fileObj) => sum + (fileObj.file?.pages || 0), 0),
    printing: baseTotal,
    gst,
    total: grandTotal,
  };

  const showAlert = (title, message, type = 'info', onConfirm = null, showCancel = false) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertOnConfirm(() => onConfirm);
    setAlertShowCancel(showCancel);
    setAlertVisible(true);
  };

  const handlePayment = async () => {
    setProcessing(true);
    // Defensive: check for valid file IDs
    console.log('[PaymentScreen] files array before payment:', files);
    if (!files || files.length === 0 || files.some(fileObj => !fileObj.file || typeof fileObj.file.id !== 'number' || fileObj.file.id <= 0)) {
      setProcessing(false);
      showAlert('File Error', 'One or more files are missing or not uploaded correctly. Please re-upload your files.', 'error');
      return;
    }
    try {
      // 1. Build the order data (before payment)
      const printJobsPayload = files.map(fileObj => ({
        file: { id: fileObj.file.id },
        user: { id: user?.id },
        status: 'QUEUED',
        options: JSON.stringify(fileObj.printOptions || selectedOptions),
      }));
      const orderData = {
        user: { id: user?.id },
        printJobs: printJobsPayload,
        status: 'PENDING',
        totalAmount: grandTotal,
        deliveryType,
        deliveryAddress,
        phone,
      };
      // 2. Create Razorpay order with grandTotal
      const orderRes = await createRazorpayOrder({
        amount: grandTotal,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      });
      if (!orderRes || !orderRes.id) {
        setProcessing(false);
        showAlert('Payment Error', 'Could not create payment order.', 'error');
        return;
      }
      const options = {
        amount: orderRes.amount,
        name: user?.name || '',
        email: user?.email || '',
        contact: phone,
        description: 'LipiPrint Order',
        orderId: orderRes.id,
        currency: 'INR',
        key: 'rzp_test_XXXXXXXX', // Replace with your test key if not from config
        order_id: orderRes.id,
        prefill: { email: user?.email || '', contact: phone, name: user?.name || '' },
        theme: { color: '#667eea' }
      };
      const result = await launchRazorpay(options);
      // Payment succeeded, now create order in backend
      if (!files[0]?.file?.id) {
        setProcessing(false);
        showAlert('Order Error', 'No file selected for print job.', 'error');
        return;
      }
      // 3. Create order after payment, passing razorpayOrderId
      const finalOrderData = {
        ...orderData,
        razorpayOrderId: orderRes.id,
      };
      const createdOrder = await ApiService.createOrder(finalOrderData);
      setProcessing(false);
      navigation.navigate('OrderConfirmation', { order: createdOrder });
    } catch (error) {
      setProcessing(false);
      showAlert('Payment Failed', error.description || error.message || 'Payment was not completed.', 'error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#22194f', '#22194f']}
          style={styles.headerGradient}
        >
          <Heading
            title="Payment"
            variant="primary"
          />
        </LinearGradient>

        <View style={styles.content}>
          {/* Order Summary */}
          <Animatable.View animation="fadeInUp" delay={200} duration={500}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Print Order</Text>
                <Text style={styles.summaryItems}>{orderSummary.items} item{orderSummary.items > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.summaryDetails}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Pages</Text>
                  <Text style={styles.summaryValue}>{orderSummary.pages}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Printing Cost</Text>
                  <Text style={styles.summaryValue}>₹{orderSummary.printing}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery</Text>
                  <Text style={styles.summaryValue}>₹{orderSummary.gst}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>₹{orderSummary.printing}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GST (18%)</Text>
                  <Text style={styles.summaryValue}>₹{orderSummary.gst}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalAmount}>₹{orderSummary.total}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Invoice Type</Text>
                  <Text style={styles.summaryValue}>{invoiceType === 'B2B' ? 'B2B (Business)' : 'B2C (Personal)'}</Text>
                </View>
              </View>
            </View>
          </Animatable.View>

          {(totalPrice !== undefined && totalPrice !== null) && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Total Price: ₹{totalPrice}</Text>
              {Array.isArray(priceBreakdown) && priceBreakdown.length > 0 && priceBreakdown.map((b, i) => (
                <Text key={i} style={{ fontSize: 13, color: '#888' }}>{b.fileName}: ₹{b.totalCost}</Text>
              ))}
            </View>
          )}

          {/* Payment Method - Only Razorpay */}
          <Animatable.View animation="fadeInUp" delay={300} duration={500}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentList}>
              <TouchableOpacity
                style={[styles.paymentListItem, styles.selectedPaymentListItem]}
                activeOpacity={0.85}
                onPress={handlePayment}
              >
                <View style={styles.paymentListIconWrap}>
                  <Icon name="security" size={24} color="#667eea" />
                </View>
                <View style={styles.paymentListTextWrap}>
                  <Text style={styles.paymentListTitle}>Pay Securely with Razorpay</Text>
                  <Text style={styles.paymentListDesc}>All major UPI, cards, wallets & netbanking supported</Text>
                </View>
                <Text style={styles.paymentListCheck}>✓</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Delivery Info */}
          <Animatable.View animation="fadeInUp" delay={400} duration={500}>
            <Text style={styles.sectionTitle}>Delivery Information</Text>
            <View style={styles.deliveryCard}>
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryMethod}>
                  {deliveryType === 'PICKUP' ? 'Store Pickup' : deliveryType === 'EXPRESS' ? 'Express Delivery' : 'Home Delivery'}
                </Text>
                <Text style={styles.deliveryAddress}>{deliveryAddress}</Text>
              </View>
            </View>
          </Animatable.View>

          {/* Security Notice */}
          <Animatable.View animation="fadeInUp" delay={500} duration={500}>
            <View style={styles.securityCard}>
              <Icon name="security" size={24} color="#4CAF50" style={styles.securityIcon} />
              <Text style={styles.securityTitle}>Secure Payment</Text>
              <Text style={styles.securityDesc}>
                Your payment information is encrypted and secure. We use industry-standard SSL encryption.
              </Text>
            </View>
          </Animatable.View>
        </View>
      </ScrollView>
      {/* Pay Button */}
      <Animatable.View animation="fadeInUp" delay={700} duration={500} style={styles.buttonContainer}>
        <TouchableOpacity onPress={handlePayment} activeOpacity={0.85}>
          <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.payButton}>
            <Text style={styles.payText}>Pay ₹{orderSummary.total}</Text>
            <Text style={styles.paySubtext}>Secure payment via Razorpay</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
      {/* Processing Payment Modal */}
      <Modal
        visible={processing}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="zoomIn" duration={400} style={styles.modalContent}>
            <ActivityIndicator size="large" color="#667eea" style={{ marginBottom: 18 }} />
            <Text style={styles.modalTitle}>Processing Payment</Text>
            <Text style={styles.modalMessage}>Please wait while we process your payment...</Text>
          </Animatable.View>
        </View>
      </Modal>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertOnConfirm}
        showCancel={alertShowCancel}
      />
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
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
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  summaryItems: {
    fontSize: 14,
    color: '#666',
  },
  summaryDetails: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
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
  paymentList: {
    marginBottom: 32,
  },
  paymentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectedPaymentListItem: {
    borderColor: '#667eea',
    backgroundColor: '#f0f8ff',
  },
  paymentListIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e0e7ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  paymentListIcon: {
    fontSize: 22,
  },
  paymentListTextWrap: {
    flex: 1,
  },
  paymentListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  paymentListDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  paymentListCheck: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  payButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  payText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  paySubtext: {
    color: 'white',
    fontSize: 14,
    marginTop: 2,
    opacity: 0.85,
    textAlign: 'center',
  },
  deliveryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryInfo: {
    gap: 8,
  },
  deliveryMethod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#666',
  },
  pickupInfo: {
    fontSize: 14,
    color: '#666',
  },
  securityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  securityIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  securityDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 260,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginTop: 2,
  },
}); 
