import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import ApiService from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';
import LottieView from 'lottie-react-native';
import LoadingWorld from '../../assets/animations/loading-world.json';

const { width } = Dimensions.get('window');

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId, awbNumber } = route.params || {};
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useTheme();

  const fetchTrackingInfo = async () => {
    try {
      setError(null);
      let response;
      
      if (orderId) {
        response = await ApiService.request(`/api/shipping/track/${orderId}`);
      } else if (awbNumber) {
        response = await ApiService.request(`/api/shipping/track/awb/${awbNumber}`);
      } else {
        throw new Error('Order ID or AWB number required');
      }
      
      setTrackingData(response);
    } catch (error) {
      console.error('Failed to fetch tracking info:', error);
      setError(error.message || 'Failed to fetch tracking information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrackingInfo();
    
    // Refresh tracking every 60 seconds for active deliveries
    const interval = setInterval(() => {
      if (trackingData && !['DELIVERED', 'CANCELLED'].includes(trackingData.currentStatus)) {
        fetchTrackingInfo();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [orderId, awbNumber]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrackingInfo();
  };

  const getStatusColor = (status) => {
    const colors = {
      'SHIPPED': '#2196F3',
      'IN_TRANSIT': '#FF9800', 
      'OUT_FOR_DELIVERY': '#4CAF50',
      'DELIVERED': '#66BB6A',
      'CANCELLED': '#F44336',
      'PENDING': '#FFA500'
    };
    return colors[status?.toUpperCase()] || '#666';
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'SHIPPED': return 'local-shipping';
      case 'IN_TRANSIT': return 'local-shipping';
      case 'OUT_FOR_DELIVERY': return 'local-shipping'; 
      case 'DELIVERED': return 'check-circle';
      case 'CANCELLED': return 'cancel';
      case 'PENDING': return 'schedule';
      default: return 'info';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
          <Heading
            title="Order Tracking"
            subtitle="Track your document delivery"
            variant="primary"
          />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <LottieView
            source={LoadingWorld}
            autoPlay
            loop
            speed={2}
            style={{ width: 180, height: 180 }}
          />
          <Text style={styles.loadingText}>Fetching tracking information...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
          <Heading
            title="Order Tracking"
            subtitle="Track your document delivery"
            variant="primary"
          />
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTrackingInfo}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
          <Heading
            title="Order Tracking"
            subtitle="Track your document delivery"
            variant="primary"
          />
        </LinearGradient>

        <View style={styles.content}>
          {trackingData && (
            <>
              {/* Current Status Card */}
              <Animatable.View animation="fadeInUp" delay={200} duration={500}>
                <View style={styles.statusCard}>
                  <View style={styles.statusHeader}>
                    <Text style={styles.statusIcon}>
                      <Icon name={getStatusIcon(trackingData.currentStatus)} size={16} color="white" />
                    </Text>
                    <View style={styles.statusInfo}>
                      <Text style={[styles.statusText, { color: getStatusColor(trackingData.currentStatus) }]}>
                        {trackingData.currentStatus || 'Processing'}
                      </Text>
                      <Text style={styles.awbNumber}>AWB: {trackingData.awbNumber}</Text>
                    </View>
                  </View>
                  
                  {trackingData.expectedDeliveryDate && (
                    <Text style={styles.deliveryDate}>
                      Expected Delivery: {new Date(trackingData.expectedDeliveryDate).toLocaleDateString('en-IN')}
                    </Text>
                  )}
                </View>
              </Animatable.View>

              {/* Courier Information */}
              <Animatable.View animation="fadeInUp" delay={400} duration={500}>
                <View style={styles.courierCard}>
                  <Text style={styles.cardTitle}>Courier Information</Text>
                  {trackingData.courierName ? (
                    <>
                      <Text style={styles.courierName}>🚚 {trackingData.courierName}</Text>
                      <Text style={styles.courierText}>Via NimbusPost Network</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.courierName}>🚚 Courier Partner</Text>
                      <Text style={styles.courierText}>Via NimbusPost Network</Text>
                    </>
                  )}
                </View>
              </Animatable.View>

              {/* Tracking Timeline */}
              {trackingData.trackingData && trackingData.trackingData.length > 0 && (
                <Animatable.View animation="fadeInUp" delay={600} duration={500}>
                  <View style={styles.timelineCard}>
                    <Text style={styles.cardTitle}>Tracking Timeline</Text>
                    <View style={styles.timeline}>
                      {trackingData.trackingData.map((event, index) => (
                        <View key={index} style={styles.timelineItem}>
                          <View style={styles.timelineDate}>
                            <Text style={styles.dateText}>{event.date}</Text>
                          </View>
                          <View style={styles.timelineContent}>
                            <Text style={styles.timelineActivity}>{event.activity}</Text>
                            <Text style={styles.timelineLocation}>{event.location}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </Animatable.View>
              )}

              {/* Contact Support */}
              <Animatable.View animation="fadeInUp" delay={800} duration={500}>
                <TouchableOpacity 
                  style={styles.supportButton}
                  onPress={() => {
                    Alert.alert(
                      'Contact Support',
                      'Need help with your delivery? Contact LipiPrint support.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Call Support', onPress: () => {} }
                      ]
                    );
                  }}
                >
                  <Icon name="support-agent" size={24} color="#667eea" />
                  <Text style={styles.supportButtonText}>Contact Support</Text>
                </TouchableOpacity>
              </Animatable.View>
            </>
          )}
        </View>
      </ScrollView>
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#22194f',
    fontWeight: '600',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  awbNumber: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  deliveryDate: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 8,
  },
  courierCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  courierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  courierText: {
    fontSize: 14,
    color: '#666',
  },
  timelineCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timelineDate: {
    width: 80,
    marginRight: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  timelineContent: {
    flex: 1,
  },
  timelineActivity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  timelineLocation: {
    fontSize: 12,
    color: '#666',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  supportButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
});
