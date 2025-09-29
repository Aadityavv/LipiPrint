import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  Dimensions,
  FlatList,
  TextInput,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import ApiService from '../../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const OrdersScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[OrdersScreen] Fetching orders...');
      
      const ordersData = await ApiService.getOrders();
      console.log('[OrdersScreen] Orders received:', ordersData);
      
      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
      } else {
        console.error('[OrdersScreen] Invalid orders data:', ordersData);
        setError('Invalid data received from server');
      }
    } catch (err) {
      console.error('[OrdersScreen] Error fetching orders:', err);
      setError(`Failed to load orders: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'PROCESSING': return '#2196F3';
      case 'COMPLETED': return '#4CAF50';
      case 'DELIVERED': return '#8BC34A';
      case 'CANCELLED': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return 'schedule';
      case 'PROCESSING': return 'print';
      case 'COMPLETED': return 'done-all';
      case 'DELIVERED': return 'check-circle';
      case 'CANCELLED': return 'cancel';
      default: return 'info';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'PROCESSING': return 'Processing';
      case 'COMPLETED': return 'Completed';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return 'Unknown';
    }
  };


  // Fixed search functionality
  const filteredOrders = React.useMemo(() => {
    let result = [...orders];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(order => {
        // Ensure order.id is converted to string for comparison
        const orderId = String(order.id).toLowerCase();
        const userName = order.userName ? order.userName.toLowerCase() : '';
        
        return orderId.includes(query) || userName.includes(query);
      });
    }
    
    return result;
  }, [orders, searchQuery]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const handleOrderPress = (order) => {
    navigation.navigate('InvoiceDetailScreen', { orderId: order.id });
  };

  const handleTrackOrder = (order) => {
    navigation.navigate('TrackOrderScreen', { orderId: order.id });
  };

  const renderOrderCard = ({ item: order, index }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={500}
      style={styles.orderCard}
    >
      <TouchableOpacity
        style={styles.orderCardContent}
        onPress={() => handleOrderPress(order)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>#{order.id}</Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Icon name={getStatusIcon(order.status)} size={14} color="white" />
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Icon name="person" size={16} color="#666" />
            <Text style={styles.detailText}>{order.userName || 'Guest User'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="local-shipping" size={16} color="#666" />
            <Text style={styles.detailText}>
              {order.deliveryType === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}
            </Text>
          </View>
          <View style={[styles.detailRow, styles.lastDetailRow]}>
            <Icon name="account-balance-wallet" size={16} color="#666" />
            <Text style={styles.detailText}>{formatAmount(order.totalAmount)}</Text>
          </View>
        </View>


        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOrderPress(order)}
          >
            <Icon name="visibility" size={16} color="white" />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
          
          {order.status !== 'CANCELLED' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.trackButton]}
              onPress={() => handleTrackOrder(order)}
            >
              <Icon name="track-changes" size={16} color="white" />
              <Text style={styles.actionButtonText}>Track</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderShimmerItem = () => (
    <View style={styles.orderCard}>
      <View style={styles.orderCardContent}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <View style={styles.shimmerOrderId} />
            <View style={styles.shimmerOrderDate} />
          </View>
          <View style={styles.shimmerStatusBadge} />
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <View style={styles.shimmerIcon} />
            <View style={styles.shimmerText} />
          </View>
          <View style={styles.detailRow}>
            <View style={styles.shimmerIcon} />
            <View style={styles.shimmerText} />
          </View>
          <View style={[styles.detailRow, styles.lastDetailRow]}>
            <View style={styles.shimmerIcon} />
            <View style={styles.shimmerText} />
          </View>
        </View>

        <View style={styles.orderActions}>
          <View style={styles.shimmerButton} />
          <View style={styles.shimmerButton} />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a237e', '#3949ab']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>My Orders</Text>
              <Text style={styles.headerSubtitle}>Loading...</Text>
            </View>
            <TouchableOpacity 
              style={styles.trackHeaderButton}
              onPress={() => navigation.navigate('TrackOrderScreen')}
            >
              <Icon name="track-changes" size={20} color="white" />
              <Text style={styles.trackButtonText}>Track</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color="#999" />
            <Text style={styles.searchPlaceholder}>Search orders...</Text>
          </View>
        </View>
        
        <FlatList
          data={[1, 2, 3]}
          renderItem={renderShimmerItem}
          keyExtractor={(item) => `shimmer-${item}`}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a237e', '#3949ab']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>My Orders</Text>
              <Text style={styles.headerSubtitle}>Error</Text>
            </View>
            <TouchableOpacity 
              style={styles.trackHeaderButton}
              onPress={() => navigation.navigate('TrackOrderScreen')}
            >
              <Icon name="track-changes" size={20} color="white" />
              <Text style={styles.trackButtonText}>Track</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Icon name="refresh" size={20} color="white" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a237e', '#3949ab']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>My Orders</Text>
            <Text style={styles.headerSubtitle}>{orders.length} orders</Text>
          </View>
          <TouchableOpacity 
            style={styles.trackHeaderButton}
            onPress={() => navigation.navigate('TrackOrderScreen')}
          >
            <Icon name="track-changes" size={20} color="white" />
            <Text style={styles.trackButtonText}>Track</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders by ID or customer name"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="cancel" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matching orders' : 'No orders found'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Try a different search term' : 'Your orders will appear here'}
          </Text>
          {searchQuery && (
            <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#1a237e']}
              tintColor="#1a237e"
            />
          }
          ListFooterComponent={<View style={styles.listFooter} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  trackHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trackButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
  },
  ordersList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listFooter: {
    height: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearSearchButton: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  clearSearchText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  orderCardContent: {
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
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
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lastDetailRow: {
    marginBottom: 0,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#1a237e',
  },
  trackButton: {
    backgroundColor: '#4caf50',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Shimmer loading styles
  shimmerOrderId: {
    width: 80,
    height: 16,
    borderRadius: 4,
    marginBottom: 4,
    backgroundColor: '#e0e0e0',
  },
  shimmerOrderDate: {
    width: 60,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  shimmerStatusBadge: {
    width: 70,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  shimmerIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  shimmerText: {
    flex: 1,
    height: 14,
    borderRadius: 4,
    marginLeft: 8,
    backgroundColor: '#e0e0e0',
  },
  shimmerButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#e0e0e0',
  },
});

export default OrdersScreen;