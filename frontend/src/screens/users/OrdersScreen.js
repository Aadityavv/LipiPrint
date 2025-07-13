import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ApiService from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';

export default function OrdersScreen({ navigation }) {
  const { theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    ApiService.getOrders()
      .then(setOrders)
      .catch(err => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const filters = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'PENDING', label: 'Pending', count: orders.filter(o => o.status === 'PENDING').length },
    { id: 'PROCESSING', label: 'Processing', count: orders.filter(o => o.status === 'PROCESSING').length },
    { id: 'COMPLETED', label: 'Completed', count: orders.filter(o => o.status === 'COMPLETED').length },
    { id: 'CANCELLED', label: 'Cancelled', count: orders.filter(o => o.status === 'CANCELLED').length },
    { id: 'DELIVERED', label: 'Delivered', count: orders.filter(o => o.status === 'DELIVERED').length },
  ];

  // Improved status badge colors
  const statusBadgeColors = {
    PENDING: '#FFA726',      // Orange
    PROCESSING: '#1976D2',  // Blue
    READY: '#43B581',       // Green
    COMPLETED: '#764ba2',   // Purple
    CANCELLED: '#D7263D',   // Red
    DELIVERED: '#00B8D9',   // Cyan
  };

  const getStatusColor = (status) => statusBadgeColors[status] || '#9E9E9E';

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'PROCESSING': return 'Processing';
      case 'READY': return 'Ready for Pickup';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      case 'DELIVERED': return 'Delivered';
      default: return status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Icon name="check-circle" size={20} color="#FFA726" />;
      case 'PROCESSING': return <Icon name="print" size={20} color="#42A5F5" />;
      case 'READY': return <Icon name="local-shipping" size={20} color="#66BB6A" />;
      case 'COMPLETED': return <Icon name="done-all" size={20} color="#4CAF50" />;
      default: return <Icon name="info" size={20} color="#9E9E9E" />;
    }
  };

  const getDisplayFileName = (file) => {
    if (!file) return 'No file';
    // Prefer originalFilename, fallback to filename
    let name = file.originalFilename || file.filename || 'No file';
    // Replace URL-encoded characters with spaces
    try {
      name = decodeURIComponent(name);
    } catch (e) {
      name = name.replace(/%20/g, ' ');
    }
    return name;
  };

  const filteredOrders = selectedFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedFilter);

  const renderOrderCard = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={400}
    >
      <TouchableOpacity
        style={[
          styles.orderCard,
          {
            backgroundColor: 'linear-gradient(90deg, #e0eafc 0%, #cfdef3 100%)',
            shadowColor: '#667eea',
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 4,
          },
        ]}
        onPress={() => navigation.navigate('InvoiceDetailScreen', { orderId: item.id, navigation })}
        activeOpacity={0.88}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderId, { color: '#222' }]}>{item.id}</Text>
            {item.printJobs && item.printJobs.length > 0 ? (
              item.printJobs.map((pj) => (
                <Text key={pj.id} style={[styles.orderTitle, { color: '#333' }]}>• {getDisplayFileName(pj.file)} ({pj.file?.pages || 0} pages)</Text>
              ))
            ) : (
              <Text style={[styles.orderTitle, { color: '#333' }]}>No files</Text>
            )}
            <Text style={[styles.orderMeta, { color: '#888' }]}> {item.createdAt ? `${new Date(item.createdAt).toLocaleString()}` : ''}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: getStatusColor(item.status),
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 6,
              minWidth: 90,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: getStatusColor(item.status),
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 2,
            },
          ]}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <View style={styles.orderDetails}>
          <View style={styles.deliveryInfo}>
            <Icon name="store" size={16} color="#1976D2" style={styles.deliveryIcon} />
            <Text style={[styles.deliveryText, { color: '#1976D2' }]}>Pickup from Main Store</Text>
          </View>
          <Text style={[styles.orderAmount, { color: '#764ba2', fontWeight: 'bold' }]}>₹{item.totalAmount}</Text>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <Heading
          title="My Orders"
          subtitle="Track your print orders"
          variant="primary"
        />
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#667eea" /></View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{error}</Text></View>
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
                      selectedFilter === filter.id && {
                        backgroundColor: '#667eea',
                        borderColor: '#764ba2',
                        borderWidth: 2,
                      },
                      !selectedFilter === filter.id && { backgroundColor: '#e0eafc' },
                    ]}
                    onPress={() => setSelectedFilter(filter.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={[
                      styles.filterText,
                      selectedFilter === filter.id && { color: '#fff', fontWeight: 'bold' },
                      !selectedFilter === filter.id && { color: '#222' },
                    ]}>
                      {filter.label}
                    </Text>
                    <View style={[
                      styles.filterCount,
                      selectedFilter === filter.id && { backgroundColor: '#fff' },
                    ]}>
                      <Text style={[
                        styles.filterCountText,
                        selectedFilter === filter.id && { color: '#667eea', fontWeight: 'bold' },
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
            renderItem={renderOrderCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.ordersList, { backgroundColor: theme.background }]}
            ListEmptyComponent={
              <Animatable.View animation="fadeIn" delay={400} duration={500} style={[styles.emptyState, { backgroundColor: theme.background }]}>
                <Icon name="assignment" size={48} color={theme.text} style={[styles.emptyIcon, { color: theme.text }]} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Orders Found</Text>
                <Text style={[styles.emptySubtitle, { color: theme.text }]}>
                  {selectedFilter === 'all' 
                    ? "You haven't placed any orders yet" 
                    : `No ${selectedFilter} orders found`
                  }
                </Text>
                <TouchableOpacity
                  style={[styles.newOrderButton, { backgroundColor: theme.card }]}
                  onPress={() => navigation.navigate('Upload')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8E53']}
                    style={[styles.newOrderGradient, { backgroundColor: theme.card }]}
                  >
                    <Text style={[styles.newOrderText, { color: theme.text }]}>Place New Order</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animatable.View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFilter: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedFilterText: {
    color: 'white',
  },
  filterCount: {
    backgroundColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  selectedFilterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  selectedFilterCountText: {
    color: 'white',
  },
  ordersList: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 4,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  orderMeta: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deliveryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  deliveryText: {
    fontSize: 14,
    color: '#666',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  newOrderButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  newOrderGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  newOrderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

