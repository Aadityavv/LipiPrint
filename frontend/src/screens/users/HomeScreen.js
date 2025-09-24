import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import ApiService from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import StoreClosedBanner from '../../components/StoreClosedBanner';
import Heading from '../../components/Heading';
import BannerImage from '../../assets/banner/banner.png';
import CustomAlert from '../../components/CustomAlert';
import LottieView from 'lottie-react-native';
import { navigationRef } from '../../navigation/AppNavigator';
import { CommonActions } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    ApiService.getCurrentUser()
      .then(userData => {
        setUser(userData);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load user');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setOrdersLoading(true);
    ApiService.getRecentOrders(3)
      .then(ordersData => setOrders(Array.isArray(ordersData) ? ordersData : []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, []);

  useEffect(() => {
    ApiService.request('/settings/accepting-orders')
      .then(res => setAcceptingOrders(res.acceptingOrders))
      .catch(() => setAcceptingOrders(true));
  }, []);

  // Enhanced quickActions with better organization
const quickActions = [
  {
    title: 'Upload & Print',
    subtitle: 'A3 & A4 colour & b/w prints',
    color: ['#667eea', '#764ba2'],
    icon: <Icon name="upload-file" size={32} color="white" style={{ marginBottom: 8 }} />,
    onPress: () => navigation.navigate('Upload'),
  },
  {
    title: 'Track Orders',
    subtitle: 'Monitor your shipments',
    color: ['#4CAF50', '#45a049'],
    icon: <Icon name="track-changes" size={32} color="white" style={{ marginBottom: 8 }} />,
    onPress: () => navigation.navigate('TrackOrderScreen'),
  },
  {
    title: 'My Orders',
    subtitle: 'View order history',
    color: ['#FF9800', '#F57C00'],
    icon: <Icon name="assignment" size={32} color="white" style={{ marginBottom: 8 }} />,
    onPress: () => navigation.navigate('OrdersScreen'),
  },
  {
    title: 'Profile',
    subtitle: 'Manage your account',
    color: ['#9C27B0', '#7B1FA2'],
    icon: <Icon name="person" size={32} color="white" style={{ marginBottom: 8 }} />,
    onPress: () => navigation.navigate('Profile'),
  },
];



  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#FFA500';
      case 'PROCESSING': return '#0058A3';
      case 'COMPLETED': return '#4CAF50';
      case 'CANCELLED': return '#FF3B30';
      case 'DELIVERED': return '#66BB6A';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Ordered': return 'schedule';
      case 'In Process': return 'print';
      case 'Completed': return 'check-circle';
      default: return 'info';
    }
  };

function getGradientColors(title) {
  switch (title) {
    case 'Upload & Print':
      return ['#667eea', '#764ba2'];
    case 'Track Orders':
      return ['#4CAF50', '#45a049'];
    case 'My Orders':
      return ['#FF9800', '#F57C00'];
    case 'Profile':
      return ['#9C27B0', '#7B1FA2'];
    default:
      return ['#667eea', '#764ba2'];
  }
}


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <LottieView
          source={require('../../assets/animations/Man-using-printing-machine.json')}
          autoPlay
          loop
          speed={1.5}
          style={{ width: 180, height: 180 }}
        />
        <Text style={{ color: '#22194f', fontWeight: 'bold', fontSize: 18, marginTop: 18 }}>Loading your dashboard...</Text>
        <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 12 }} />
      </View>
    );
  }
  if (error) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{error}</Text></View>;
  }

  // Sort orders descending by createdAt (or id as fallback)
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return (b.id || 0) - (a.id || 0);
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      {!acceptingOrders && <StoreClosedBanner />}
      <LinearGradient
        colors={['#22194f', '#22194f']}
        style={styles.headerGradient}
      >
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44}}>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 26, color: '#fff', fontWeight: 'bold', textAlign: 'left', marginBottom: 4}}>
              {`Welcome back, ${(user?.name?.split(' ')[0]) || 'User'}! 👋`}
            </Text>
            <Text style={{fontSize: 16, color: '#e0e0e0', textAlign: 'left'}}>
              Ready to print something amazing today?
            </Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
              <Icon name="notifications" size={22} color="white" />
              <View style={styles.badge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Profile')}>
              <Icon name="person" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* App Banner */}
      <Image
        source={BannerImage}
        style={{ width: width, height: width * 0.6685, resizeMode: 'contain', marginTop:-2 }}
        accessible={true}
        accessibilityLabel="LipiPrint app banner: Welcome to LipiPrint! Fast & Easy A3, A4 Printing."
      />

      <View style={styles.content}>
        {/* Quick Actions - 2x2 grid layout */}
        <Animatable.View animation="fadeInUp" delay={200} duration={500}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <Animatable.View
                key={action.title}
                animation="zoomIn"
                delay={300 + index * 100}
                duration={400}
                style={styles.actionGridItem}
              >
                <TouchableOpacity
                  style={[styles.actionCardGrid, { overflow: 'hidden' }]}
                  onPress={action.onPress}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={getGradientColors(action.title)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={{ zIndex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    {action.icon}
                    <Text style={styles.actionTitleGrid}>{action.title}</Text>
                    {action.subtitle && (
                      <Text style={styles.actionSubtitleGrid}>{action.subtitle}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </Animatable.View>
            ))}
          </View>
        </Animatable.View>

        {/* Recent Orders */}
        <Animatable.View animation="fadeInUp" delay={400} duration={500} style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrdersScreen')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {ordersLoading ? (
            <View style={{ alignItems: 'center', marginVertical: 24 }}>
              <LottieView
                source={require('../../assets/animations/Man-using-printing-machine.json')}
                autoPlay
                loop
                speed={1.5}
                style={{ width: 120, height: 120 }}
              />
              <Text style={{ color: '#22194f', fontWeight: 'bold', fontSize: 16, marginTop: 10 }}>Loading orders...</Text>
              <ActivityIndicator size="small" color="#667eea" style={{ marginTop: 8 }} />
            </View>
          ) : (
            orders.map((order, index) => (
              <Animatable.View
                key={order.id}
                animation="slideInRight"
                delay={500 + index * 150}
                duration={400}
              >
                <TouchableOpacity style={styles.orderCard} activeOpacity={0.8} onPress={() => navigation.navigate('InvoiceDetailScreen', { orderId: order.id, navigation })}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderTitle}>Order #{order.id}</Text>
                    <View style={styles.orderStatusRow}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                        <Icon name={getStatusIcon(order.status)} size={12} color="white" />
                        <Text style={styles.statusText}>{order.status}</Text>
                      </View>
                      <Text style={styles.deliveryTypeText}>
                        {order.deliveryType === 'DELIVERY' ? '🚚 Delivery' : '🏪 Pickup'}
                      </Text>
                    </View>
                    <Text style={styles.orderDate}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                    </Text>
                    {order.awbNumber && (
                      <Text style={styles.awbText}>
                        AWB: {order.awbNumber}
                      </Text>
                    )}
                  </View>
                  <View style={styles.orderPrice}>
                    <Text style={styles.priceText}>{order.totalAmount ? `₹${order.totalAmount}` : ''}</Text>
                  </View>
                </TouchableOpacity>
              </Animatable.View>
            ))
          )}
          {orders.length === 0 && (
            <Text style={{ color: '#888', textAlign: 'center', marginTop: 16 }}>No recent orders found.</Text>
          )}
        </Animatable.View>

        {/* Upload CTA */}
        {/* <Animatable.View animation="fadeInUp" delay={600} duration={500}>
          <TouchableOpacity
            style={styles.uploadCTA}
            onPress={() => navigation.navigate('Upload')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.uploadGradient}
            >
              <Icon name="cloud-upload" size={40} color="white" style={styles.uploadIcon} />
              <Text style={styles.uploadTitle}>Upload & Print Now</Text>
              <Text style={styles.uploadSubtitle}>Get your documents printed in minutes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View> */}
      </View>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionGridItem: {
    width: (width - 60) / 2,
    marginBottom: 16,
  },
  actionCardGrid: {
    height: 120,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionTitleGrid: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
  },
  actionSubtitleGrid: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  actionCard: {
    width: (width - 60) / 2,
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  deliveryTypeText: {
    fontSize: 12,
    color: '#666',
  },
  awbText: {
    fontSize: 11,
    color: '#667eea',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  orderStatus: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  orderPrice: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  uploadCTA: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  uploadGradient: {
    padding: 24,
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 2,
  },
  quickActionsColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 24,
    marginBottom: 30,
  },
  actionCardVertical: {
    width: '100%',
    height: 90,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  actionTitleVertical: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.2,
  },
  actionSubtitleVertical: {
  fontSize: 14,
  fontWeight: '400',
  color: 'white',
  textAlign: 'center',
  marginTop: 2,
  letterSpacing: 0.1,
},

});
