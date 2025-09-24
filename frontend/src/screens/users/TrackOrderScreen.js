import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';
import api from '../../services/api';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

export default function TrackOrderScreen({ navigation }) {
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.request('/orders');
      setOrders(response.content || response);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const trackOrder = async (order) => {
    if (!order.awbNumber) {
      Alert.alert('No Tracking Available', 'This order does not have a tracking number yet.');
      return;
    }

    setTrackingLoading(true);
    try {
      const response = await api.request(`/shipping/track/awb/${order.awbNumber}`);
      setTrackingData(response);
      setSelectedOrder(order);
    } catch (error) {
      console.error('Failed to track order:', error);
      Alert.alert('Tracking Error', 'Failed to get tracking information');
    } finally {
      setTrackingLoading(false);
    }
  };

  const showOrderDetails = (order) => {
    setDetailsOrder(order);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'PROCESSING': return '#2196F3';
      case 'COMPLETED': return '#4CAF50';
      case 'SHIPPED': return '#9C27B0';
      case 'OUT_FOR_DELIVERY': return '#FF5722';
      case 'DELIVERED': return '#4CAF50';
      case 'CANCELLED': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return 'schedule';
      case 'PROCESSING': return 'build';
      case 'COMPLETED': return 'check-circle';
      case 'SHIPPED': return 'local-shipping';
      case 'OUT_FOR_DELIVERY': return 'delivery-dining';
      case 'DELIVERED': return 'done-all';
      case 'CANCELLED': return 'cancel';
      default: return 'help';
    }
  };

  const getTrackingSteps = (order) => {
    const steps = [
      { key: 'PENDING', title: 'Order Placed', icon: 'shopping-cart', completed: true },
      { key: 'PROCESSING', title: 'Processing', icon: 'build', completed: ['PROCESSING', 'COMPLETED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) },
      { key: 'COMPLETED', title: 'Completed', icon: 'check-circle', completed: ['COMPLETED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) },
    ];

    if (order.deliveryType === 'DELIVERY') {
      steps.push(
        { key: 'SHIPPED', title: 'Shipped', icon: 'local-shipping', completed: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) },
        { key: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', icon: 'delivery-dining', completed: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) },
        { key: 'DELIVERED', title: 'Delivered', icon: 'done-all', completed: order.status === 'DELIVERED' }
      );
    } else {
      steps.push(
        { key: 'PICKUP_READY', title: 'Ready for Pickup', icon: 'store', completed: ['COMPLETED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) }
      );
    }

    return steps;
  };

  const renderOrderCard = (order, index) => (
    <Animatable.View
      key={order.id}
      animation="fadeInUp"
      delay={index * 100}
      duration={500}
      style={styles.orderCard}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
            </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Icon name={getStatusIcon(order.status)} size={16} color="white" />
                <Text style={styles.statusText}>{order.status.replace('_', ' ')}</Text>
              </View>
            </View>

      <View style={styles.orderDetails}>
        <Text style={styles.amount}>₹{order.totalAmount}</Text>
        <Text style={styles.deliveryType}>
          {order.deliveryType === 'DELIVERY' ? '🚚 Home Delivery' : '🏪 Store Pickup'}
        </Text>
            </View>

      {/* Enhanced Tracking Information */}
      <View style={styles.trackingInfo}>
        {order.awbNumber ? (
          <>
            <View style={styles.trackingRow}>
              <Icon name="local-shipping" size={16} color="#667eea" />
              <Text style={styles.trackingText}>
                <Text style={styles.courierNameText}>{order.courierName || 'NimbusPost'}</Text>
              </Text>
            </View>
            <View style={styles.trackingRow}>
              <Icon name="confirmation-number" size={16} color="#667eea" />
              <Text style={styles.trackingText}>
                AWB: <Text style={styles.awbText}>{order.awbNumber}</Text>
              </Text>
              </View>
            {order.expectedDeliveryDate && (
              <View style={styles.trackingRow}>
                <Icon name="schedule" size={16} color="#667eea" />
                <Text style={styles.trackingText}>
                  Expected: {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                </Text>
            </View>
            )}
            {order.trackingUrl && (
              <View style={styles.trackingRow}>
                <Icon name="link" size={16} color="#667eea" />
                <Text style={styles.trackingText}>
                  Tracking URL Available
                </Text>
            </View>
            )}
          </>
        ) : (
          <View style={styles.trackingRow}>
            <Icon name="info" size={16} color="#FF9800" />
            <Text style={[styles.trackingText, { color: '#FF9800' }]}>
              {order.status === 'COMPLETED' ? 'Shipment being prepared' : 'Tracking not available yet'}
            </Text>
              </View>
            )}
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {getTrackingSteps(order).map((step, stepIndex) => (
          <View key={step.key} style={styles.stepContainer}>
                      <View style={[
                        styles.stepIcon, 
              { backgroundColor: step.completed ? '#4CAF50' : '#E0E0E0' }
                      ]}>
              <Icon name={step.icon} size={16} color={step.completed ? 'white' : '#9E9E9E'} />
                      </View>
            <Text style={[
              styles.stepText,
              { color: step.completed ? '#4CAF50' : '#9E9E9E' }
            ]}>
              {step.title}
            </Text>
            {stepIndex < getTrackingSteps(order).length - 1 && (
                        <View style={[
                          styles.stepLine, 
                { backgroundColor: step.completed ? '#4CAF50' : '#E0E0E0' }
                        ]} />
                      )}
                    </View>
        ))}
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => showOrderDetails(order)}
        >
          <Icon name="visibility" size={16} color="#667eea" />
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>

        {order.awbNumber && (
          <TouchableOpacity
            style={[styles.actionButton, styles.trackButton]}
            onPress={() => trackOrder(order)}
            disabled={trackingLoading}
          >
            {trackingLoading ? (
              <ActivityIndicator size="small" color="#667eea" />
            ) : (
              <Icon name="track-changes" size={16} color="#667eea" />
            )}
            <Text style={styles.actionButtonText}>Track</Text>
          </TouchableOpacity>
        )}

        {order.status === 'DELIVERED' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.invoiceButton]}
            onPress={() => navigation.navigate('InvoiceDetailScreen', { orderId: order.id, navigation })}
          >
            <Icon name="receipt" size={16} color="#667eea" />
            <Text style={styles.actionButtonText}>Invoice</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animatable.View>
  );

  const renderTrackingModal = () => {
    if (!selectedOrder || !trackingData) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tracking Details</Text>
            <TouchableOpacity onPress={() => setSelectedOrder(null)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.trackingDetails}>
            <View style={styles.trackingInfo}>
              <Text style={styles.trackingLabel}>AWB Number:</Text>
              <Text style={styles.trackingValue}>{selectedOrder.awbNumber}</Text>
            </View>

            <View style={styles.trackingInfo}>
              <Text style={styles.trackingLabel}>Courier:</Text>
              <Text style={styles.trackingValue}>{selectedOrder.courierName || 'NimbusPost'}</Text>
            </View>

            {trackingData.status && (
              <View style={styles.trackingInfo}>
                <Text style={styles.trackingLabel}>Current Status:</Text>
                <Text style={[styles.trackingValue, { color: getStatusColor(trackingData.status) }]}>
                  {trackingData.status}
                </Text>
              </View>
            )}

            {trackingData.tracking_history && trackingData.tracking_history.length > 0 && (
              <View style={styles.trackingHistory}>
                <Text style={styles.historyTitle}>Tracking History:</Text>
                {trackingData.tracking_history.map((entry, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyDot} />
                    <View style={styles.historyContent}>
                      <Text style={styles.historyStatus}>{entry.status}</Text>
                      <Text style={styles.historyLocation}>{entry.location}</Text>
                      <Text style={styles.historyDate}>{entry.date}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderOrderDetailsModal = () => {
    if (!showDetailsModal || !detailsOrder) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.orderDetailsContent}>
            {/* Order Information */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Order Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order ID:</Text>
                <Text style={styles.detailValue}>#{detailsOrder.id}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, { color: getStatusColor(detailsOrder.status) }]}>
                  {detailsOrder.status}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Amount:</Text>
                <Text style={styles.detailValue}>₹{detailsOrder.totalAmount}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Date:</Text>
                <Text style={styles.detailValue}>
                  {new Date(detailsOrder.createdAt).toLocaleDateString()}
                      </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery Type:</Text>
                <Text style={styles.detailValue}>
                  {detailsOrder.deliveryType === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}
                      </Text>
                    </View>
                  </View>

            {/* Shipping Information */}
            {detailsOrder.deliveryType === 'DELIVERY' && (
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Shipping Information</Text>
                {detailsOrder.awbNumber ? (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>AWB Number:</Text>
                      <Text style={[styles.detailValue, styles.awbValue]}>{detailsOrder.awbNumber}</Text>
                    </View>
                    {detailsOrder.courierName && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Courier:</Text>
                        <Text style={[styles.detailValue, { color: '#667eea' }]}>{detailsOrder.courierName}</Text>
                      </View>
                    )}
                    {detailsOrder.expectedDeliveryDate && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Expected Delivery:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(detailsOrder.expectedDeliveryDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    {detailsOrder.trackingUrl && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Tracking URL:</Text>
                        <Text style={[styles.detailValue, { color: '#667eea' }]}>Available</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailValue, { color: '#FF9800' }]}>
                      Shipment not created yet
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Files Information */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Files ({detailsOrder.printJobs?.length || 0})</Text>
              {detailsOrder.printJobs && detailsOrder.printJobs.length > 0 ? (
                detailsOrder.printJobs.map((printJob, index) => (
                  <View key={printJob.id || index} style={styles.fileItem}>
                    <Text style={styles.fileName}>{printJob.file?.originalFilename || 'Unknown file'}</Text>
                    <Text style={styles.fileDetails}>
                      {printJob.file?.pages || 0} pages • {printJob.status}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.detailValue}>No files found</Text>
              )}
            </View>

          {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  setShowDetailsModal(false);
                  navigation.navigate('InvoiceDetailScreen', { orderId: detailsOrder.id, navigation });
                }}
              >
                <Icon name="receipt" size={16} color="white" />
                <Text style={styles.modalButtonText}>View Invoice</Text>
              </TouchableOpacity>
              
              {detailsOrder.awbNumber && (
              <TouchableOpacity
                  style={[styles.modalButton, styles.secondaryButton]}
                  onPress={() => {
                    setShowDetailsModal(false);
                    trackOrder(detailsOrder);
                  }}
                >
                  <Icon name="track-changes" size={16} color="#667eea" />
                  <Text style={[styles.modalButtonText, { color: '#667eea' }]}>Track Shipment</Text>
              </TouchableOpacity>
              )}
        </View>
      </ScrollView>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
          <Heading title="Track Orders" subtitle="Monitor your order status" variant="primary" />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
        <Heading title="Track Orders" subtitle="Monitor your order status" variant="primary" />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="shopping-cart" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>You haven't placed any orders yet</Text>
            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={() => navigation.navigate('HomeScreen')}
            >
              <Text style={styles.placeOrderButtonText}>Place Your First Order</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order, index) => renderOrderCard(order, index))
        )}
      </ScrollView>

      {renderTrackingModal()}
      {renderOrderDetailsModal()}
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
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#667eea',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  deliveryType: {
    fontSize: 14,
    color: '#666',
  },
  trackingInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trackingText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  courierNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  awbText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'monospace',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: '-50%',
    height: 2,
    zIndex: -1,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  trackButton: {
    backgroundColor: '#f3e5f5',
  },
  invoiceButton: {
    backgroundColor: '#e8f5e8',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  placeOrderButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  placeOrderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 20, 
    margin: 20,
    maxHeight: '80%',
    width: width - 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  trackingDetails: {
    maxHeight: 400,
  },
  trackingInfo: {
    marginBottom: 16,
  },
  trackingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  trackingValue: {
    fontSize: 16,
    color: '#666',
  },
  trackingHistory: {
    marginTop: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold', 
    color: '#333',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row', 
    marginBottom: 16,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#667eea',
    marginTop: 4,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyStatus: {
    fontSize: 16, 
    fontWeight: '600',
    color: '#333',
  },
  historyLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  // Order Details Modal Styles
  orderDetailsContent: {
    maxHeight: 500,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  awbValue: {
    fontFamily: 'monospace',
    color: '#667eea',
  },
  fileItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 12,
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#667eea',
  },
  secondaryButton: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
}); 