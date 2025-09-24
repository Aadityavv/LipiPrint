import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, RefreshControl, Image, TextInput, Dimensions, Animated, Alert } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ApiService from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';
import LottieView from 'lottie-react-native';
import LoadingPaperplane from '../../assets/animations/Loading_Paperplane.json';

export default function OrdersScreen({ navigation }) {
  const { theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // For paper plane animation
  const screenWidth = Dimensions.get('window').width;
  const planeAnim = React.useRef(new Animated.Value(-180)).current;
  
  useEffect(() => {
    let isMounted = true;
    function startPlaneAnim() {
      planeAnim.setValue(-180);
      Animated.timing(planeAnim, {
        toValue: screenWidth,
        duration: 1800,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && isMounted && loading) {
          startPlaneAnim();
        }
      });
    }
    if (loading) {
      startPlaneAnim();
    }
    return () => { isMounted = false; };
  }, [loading]);

  const fetchOrders = () => {
    setLoading(true);
    setError(null);
    ApiService.getOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    ApiService.getOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders'))
      .finally(() => setRefreshing(false));
  };

  const filters = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'PENDING', label: 'Pending', count: orders.filter(o => o.status === 'PENDING').length },
    { id: 'PROCESSING', label: 'Processing', count: orders.filter(o => o.status === 'PROCESSING').length },
    { id: 'COMPLETED', label: 'Completed', count: orders.filter(o => o.status === 'COMPLETED').length },
    { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', count: orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length },
    { id: 'DELIVERED', label: 'Delivered', count: orders.filter(o => o.status === 'DELIVERED').length },
  ];

  // Modern, soft status badge colors
  const statusBadgeColors = {
    PENDING: '#FFC107',
    PROCESSING: '#039BE5',
    COMPLETED: '#8E24AA',
    OUT_FOR_DELIVERY: '#FBC02D',
    DELIVERED: '#00897B',
  };

  const getStatusColor = (status) => statusBadgeColors[status] || '#9E9E9E';

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'PROCESSING': return 'Processing';
      case 'COMPLETED': return 'Completed';
      case 'OUT_FOR_DELIVERY': return 'Out for Delivery';
      case 'DELIVERED': return 'Delivered';
      default: return status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Icon name="schedule" size={16} color="#fff" />;
      case 'PROCESSING': return <Icon name="print" size={16} color="#fff" />;
      case 'COMPLETED': return <Icon name="done-all" size={16} color="#fff" />;
      case 'OUT_FOR_DELIVERY': return <Icon name="local-shipping" size={16} color="#fff" />;
      case 'DELIVERED': return <Icon name="check-circle" size={16} color="#fff" />;
      default: return <Icon name="info" size={16} color="#fff" />;
    }
  };

  const getDisplayFileName = (file) => {
    if (!file) return 'No file';
    let name = file.originalFilename || file.filename || 'No file';
    try {
      name = decodeURIComponent(name);
    } catch (e) {
      name = name.replace(/%20/g, ' ');
    }
    return name;
  };

  // *** NEW: Handle tracking functionality ***
  const handleTrackOrder = async (order) => {
    if (!order.awbNumber) {
      Alert.alert(
        'Tracking Not Available',
        order.deliveryType === 'PICKUP' 
          ? 'This order is for pickup from store. No tracking required.'
          : 'Tracking information is not yet available for this order.'
      );
      return;
    }

    try {
      navigation.navigate('OrderTracking', {
        orderId: order.id,
        awbNumber: order.awbNumber
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to open tracking screen');
    }
  };

  // *** NEW: Retry shipment creation for failed deliveries ***
  const handleRetryShipment = async (orderId) => {
    try {
      await ApiService.retryShipmentCreation(orderId);
      Alert.alert('Success', 'Shipment creation retry initiated. Please check back in a few minutes.');
      fetchOrders(); // Refresh orders
    } catch (error) {
      Alert.alert('Error', 'Failed to retry shipment creation');
    }
  };

  // *** NEW: Get shipping status badge ***
  const getShippingStatusBadge = (order) => {
    if (order.deliveryType === 'PICKUP') {
      return (
        <View style={styles.shippingBadge}>
          <Icon name="store" size={12} color="#4ECDC4" />
          <Text style={[styles.shippingText, { color: '#4ECDC4' }]}>Pickup</Text>
        </View>
      );
    }

    if (order.awbNumber) {
      return (
        <View style={styles.shippingBadge}>
          <Icon name="local-shipping" size={12} color="#667eea" />
          <Text style={[styles.shippingText, { color: '#667eea' }]}>
            {order.courierName ? `${order.courierName} - ` : ''}AWB: {order.awbNumber}
          </Text>
        </View>
      );
    }

    if (order.deliveryType === 'DELIVERY' && !order.shippingCreated) {
      return (
        <View style={[styles.shippingBadge, { backgroundColor: '#ffebee' }]}>
          <Icon name="error-outline" size={12} color="#f44336" />
          <Text style={[styles.shippingText, { color: '#f44336' }]}>Shipment Pending</Text>
        </View>
      );
    }

    return null;
  };

  // Search filter
  const filteredOrders = (selectedFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedFilter)
  ).filter(order => {
    if (!search.trim()) return true;
    const searchLower = search.trim().toLowerCase();
    const idMatch = order.id.toString().includes(searchLower);
    const fileMatch = order.printJobs && order.printJobs.some(pj => {
      const name = (pj.file?.originalFilename || pj.file?.filename || '').toLowerCase();
      return name.includes(searchLower);
    });
    const awbMatch = order.awbNumber && order.awbNumber.toLowerCase().includes(searchLower);
    return idMatch || fileMatch || awbMatch;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <LinearGradient
        colors={['#22194f', '#22194f']}
        style={styles.headerGradient}
      >
        <Heading
          title="My Orders"
          subtitle="Track your print orders & deliveries"
          variant="primary"
        />
      </LinearGradient>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, backgroundColor: theme.background }}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order ID, file name, or AWB number..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <LottieView
              source={LoadingPaperplane}
              autoPlay
              loop
              speed={1.5}
              style={styles.loadingAnimation}
            />
          </View>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          {/* Filters */}
          <Animatable.View animation="fadeInUp" delay={200} duration={500}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={[styles.filtersContainer, { backgroundColor: theme.card }]}
              contentContainerStyle={styles.filtersContent}
            >
              {filters.map((filter, index) => (
                <Animatable.View
                  key={filter.id}
                  animation="zoomIn"
                  delay={300 + index * 100}
                  duration={400}
                >
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      selectedFilter === filter.id && styles.selectedFilterButton,
                    ]}
                    onPress={() => setSelectedFilter(filter.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={[
                      styles.filterText,
                      selectedFilter === filter.id && styles.selectedFilterText,
                    ]}>
                      {filter.label}
                    </Text>
                    <View style={[
                      styles.filterCount,
                      selectedFilter === filter.id && styles.selectedFilterCount,
                    ]}>
                      <Text style={[
                        styles.filterCountText,
                        selectedFilter === filter.id && styles.selectedFilterCountText,
                      ]}>
                        {filter.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </ScrollView>
          </Animatable.View>

          {/* Orders List */}
          <FlatList
            data={filteredOrders}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item, index }) => (
              <Animatable.View
                animation="fadeInUp"
                delay={index * 80}
                duration={400}
                style={styles.orderItemContainer}
              >
                <TouchableOpacity
                  style={styles.orderCard}
                  onPress={() => navigation.navigate('InvoiceDetailScreen', { orderId: item.id, navigation })}
                  activeOpacity={0.92}
                >
                  <View style={styles.orderHeader}>
                    <View style={styles.orderTitleSection}>
                      <Text style={styles.orderTitle}>Order #{item.id}</Text>
                      <Text style={styles.orderDate}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { 
                          day: 'numeric', month: 'short', year: 'numeric' 
                        }) : ''}
                      </Text>
                    </View>
                    
                    <View style={styles.orderActions}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        {getStatusIcon(item.status)}
                        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Files List */}
                  <View style={styles.filesSection}>
                    {item.printJobs && item.printJobs.length > 0 ? (
                      item.printJobs.map((pj, idx) => (
                        <Text key={pj.id || idx} style={styles.fileText}>
                          • {getDisplayFileName(pj.file)} ({pj.file?.pages || 0} pages)
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.fileText}>No files</Text>
                    )}
                  </View>

                  {/* Shipping Info */}
                  {getShippingStatusBadge(item)}

                  {/* Order Footer */}
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderAmount}>₹{item.totalAmount}</Text>
                    
                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      {/* Track Button for delivery orders with AWB */}
                      {item.deliveryType === 'DELIVERY' && item.awbNumber && (
                        <TouchableOpacity 
                          style={styles.trackButton}
                          onPress={() => handleTrackOrder(item)}
                        >
                          <Icon name="track-changes" size={14} color="#667eea" />
                          <Text style={styles.trackButtonText}>Track</Text>
                        </TouchableOpacity>
                      )}
                      
                      {/* Retry Button for failed shipments */}
                      {item.deliveryType === 'DELIVERY' && !item.awbNumber && !item.shippingCreated && (
                        <TouchableOpacity 
                          style={styles.retryButton}
                          onPress={() => handleRetryShipment(item.id)}
                        >
                          <Icon name="refresh" size={14} color="#ff9800" />
                          <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                      )}
                      
                      {/* Pickup Info for pickup orders */}
                      {item.deliveryType === 'PICKUP' && (
                        <View style={styles.pickupInfo}>
                          <Icon name="store" size={14} color="#4ECDC4" />
                          <Text style={styles.pickupText}>Store Pickup</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animatable.View>
            )}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="inbox" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No orders found.</Text>
                {search.trim() && (
                  <Text style={styles.emptySubtext}>Try adjusting your search terms</Text>
                )}
              </View>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#222',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingContent: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  loadingAnimation: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#666',
    fontSize: 16,
  },
  filtersContainer: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  filtersContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  filterButton: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#e0eafc',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  selectedFilterButton: {
    backgroundColor: '#667eea',
    borderColor: '#764ba2',
    borderWidth: 2,
  },
  filterText: {
    fontSize: 15,
    marginRight: 8,
    color: '#222',
  },
  selectedFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filterCount: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 2,
  },
  selectedFilterCount: {
    backgroundColor: '#fff',
  },
  filterCountText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: 'bold',
  },
  selectedFilterCountText: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  orderItemContainer: {
    marginBottom: 18,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    shadowColor: '#667eea',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    padding: 18,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderTitleSection: {
    flex: 1,
  },
  orderTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#22194f',
    marginBottom: 2,
  },
  orderDate: {
    color: '#888',
    fontSize: 13,
  },
  orderActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  filesSection: {
    marginBottom: 12,
  },
  fileText: {
    color: '#333',
    fontSize: 14,
    marginBottom: 2,
  },
  shippingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  shippingText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: {
    color: '#764ba2',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  trackButtonText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  retryButtonText: {
    color: '#ff9800',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  pickupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  pickupText: {
    color: '#4ECDC4',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
  },
  emptySubtext: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
});
