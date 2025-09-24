import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';
import api from '../../services/api';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user statistics
      const [ordersResponse, userResponse] = await Promise.all([
        api.request('/orders'),
        api.request('/auth/me')
      ]);

      const orders = ordersResponse.content || ordersResponse;
      const user = userResponse;

      // Calculate statistics
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const completedOrders = orders.filter(order => order.status === 'DELIVERED').length;
      const pendingOrders = orders.filter(order => ['PENDING', 'PROCESSING'].includes(order.status)).length;
      const deliveredOrders = orders.filter(order => order.status === 'DELIVERED').length;

      // Recent orders (last 5)
      const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Monthly spending
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlySpending = orders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        })
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      // Most used delivery type
      const deliveryOrders = orders.filter(order => order.deliveryType === 'DELIVERY').length;
      const pickupOrders = orders.filter(order => order.deliveryType === 'PICKUP').length;
      const preferredDelivery = deliveryOrders > pickupOrders ? 'Home Delivery' : 'Store Pickup';

      setDashboardData({
        user,
        stats: {
          totalOrders,
          totalSpent,
          completedOrders,
          pendingOrders,
          deliveredOrders,
          monthlySpending,
          preferredDelivery,
        },
        recentOrders,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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

  const renderStatCard = (title, value, icon, color, subtitle) => (
    <Animatable.View
      animation="fadeInUp"
      duration={500}
      style={[styles.statCard, { backgroundColor: theme.card }]}
    >
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Icon name={icon} size={24} color="white" />
        </View>
        <Text style={[styles.statTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      )}
    </Animatable.View>
  );

  const renderRecentOrder = (order, index) => (
    <Animatable.View
      key={order.id}
      animation="fadeInRight"
      delay={index * 100}
      duration={400}
      style={[styles.recentOrderCard, { backgroundColor: theme.card }]}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate('InvoiceDetailScreen', { orderId: order.id })}
        style={styles.orderTouchable}
      >
        <View style={styles.orderHeader}>
          <Text style={[styles.orderId, { color: theme.text }]}>Order #{order.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Icon name={getStatusIcon(order.status)} size={12} color="white" />
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>
        <View style={styles.orderDetails}>
          <Text style={[styles.orderAmount, { color: theme.text }]}>₹{order.totalAmount}</Text>
          <Text style={[styles.orderDate, { color: theme.textSecondary }]}>
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.deliveryInfo}>
          <Icon 
            name={order.deliveryType === 'DELIVERY' ? 'local-shipping' : 'store'} 
            size={16} 
            color="#667eea" 
          />
          <Text style={[styles.deliveryText, { color: theme.textSecondary }]}>
            {order.deliveryType === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}
          </Text>
          {order.awbNumber && (
            <>
              <Icon name="track-changes" size={16} color="#667eea" style={styles.trackIcon} />
              <Text style={[styles.trackText, { color: '#667eea' }]}>Track</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
          <Heading title="Dashboard" subtitle="Your printing journey overview" variant="primary" />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
          <Heading title="Dashboard" subtitle="Your printing journey overview" variant="primary" />
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#ccc" />
          <Text style={[styles.errorText, { color: theme.text }]}>Failed to load dashboard</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { user, stats, recentOrders } = dashboardData;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
        <Heading 
          title="Dashboard" 
          subtitle={`Welcome back, ${user?.name || 'User'}!`} 
          variant="primary" 
        />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            {renderStatCard(
              'Total Orders',
              stats.totalOrders.toString(),
              'assignment',
              '#667eea',
              'All time'
            )}
            {renderStatCard(
              'Total Spent',
              `₹${stats.totalSpent.toFixed(0)}`,
              'account-balance-wallet',
              '#4CAF50',
              'All time'
            )}
          </View>
          
          <View style={styles.statsRow}>
            {renderStatCard(
              'Completed',
              stats.completedOrders.toString(),
              'check-circle',
              '#4CAF50',
              'Delivered orders'
            )}
            {renderStatCard(
              'This Month',
              `₹${stats.monthlySpending.toFixed(0)}`,
              'trending-up',
              '#FF9800',
              'Monthly spending'
            )}
          </View>
          
          <View style={styles.statsRow}>
            {renderStatCard(
              'Pending',
              stats.pendingOrders.toString(),
              'schedule',
              '#2196F3',
              'In progress'
            )}
            {renderStatCard(
              'Preferred',
              stats.preferredDelivery,
              stats.preferredDelivery === 'Home Delivery' ? 'home' : 'store',
              '#9C27B0',
              'Delivery method'
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <Animatable.View animation="fadeInUp" delay={300} duration={500}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate('UploadScreen')}
            >
              <Icon name="upload-file" size={32} color="#667eea" />
              <Text style={[styles.actionTitle, { color: theme.text }]}>Upload Files</Text>
              <Text style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
                Start a new print job
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate('TrackOrderScreen')}
            >
              <Icon name="track-changes" size={32} color="#4CAF50" />
              <Text style={[styles.actionTitle, { color: theme.text }]}>Track Orders</Text>
              <Text style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
                Monitor your shipments
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate('OrdersScreen')}
            >
              <Icon name="assignment" size={32} color="#FF9800" />
              <Text style={[styles.actionTitle, { color: theme.text }]}>All Orders</Text>
              <Text style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
                View order history
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate('ProfileScreen')}
            >
              <Icon name="person" size={32} color="#9C27B0" />
              <Text style={[styles.actionTitle, { color: theme.text }]}>Profile</Text>
              <Text style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
                Manage your account
              </Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <Animatable.View animation="fadeInUp" delay={400} duration={500}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Orders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('OrdersScreen')}>
                <Text style={[styles.viewAllText, { color: '#667eea' }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentOrdersContainer}>
              {recentOrders.map((order, index) => renderRecentOrder(order, index))}
            </View>
          </Animatable.View>
        )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  recentOrdersContainer: {
    marginBottom: 24,
  },
  recentOrderCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderTouchable: {
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
  },
  trackIcon: {
    marginLeft: 8,
  },
  trackText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
