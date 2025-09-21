import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import CustomAlert from '../../components/CustomAlert';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function AdminOrdersScreen({ navigation }) {
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [updatingId, setUpdatingId] = useState(null);

  const statusOptions = [
    { key: 'ALL', label: 'All Orders', color: '#6B7280', count: 0 },
    { key: 'PENDING', label: 'Pending', color: '#F59E0B', count: 0 },
    { key: 'PRINTING', label: 'Printing', color: '#3B82F6', count: 0 },
    { key: 'COMPLETED', label: 'Completed', color: '#10B981', count: 0 },
    { key: 'CANCELLED', label: 'Cancelled', color: '#EF4444', count: 0 },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const response = await api.request('/orders/admin');
      setOrders(response || []);
      updateStatusCounts(response || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showAlert('Error', 'Failed to load orders. Please try again.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStatusCounts = (ordersList) => {
    const counts = { ALL: ordersList.length, PENDING: 0, PRINTING: 0, COMPLETED: 0, CANCELLED: 0 };
    ordersList.forEach(order => {
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status]++;
      }
    });
    
    statusOptions.forEach(option => {
      option.count = counts[option.key];
    });
  };

  const showAlert = (title, message, type = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await api.request(`/orders/${orderId}/status?status=${newStatus}`, { method: 'PUT' });
      showAlert('Success', `Order status updated to ${newStatus}`, 'success');
      fetchOrders();
    } catch (error) {
      showAlert('Error', 'Failed to update order status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      PENDING: '#F59E0B',
      PRINTING: '#3B82F6',
      COMPLETED: '#10B981',
      CANCELLED: '#EF4444',
    };
    return statusMap[status] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      PENDING: 'schedule',
      PRINTING: 'print',
      COMPLETED: 'check-circle',
      CANCELLED: 'cancel',
    };
    return iconMap[status] || 'help';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toFixed(2) || '0.00'}`;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toString().includes(searchQuery) ||
                         order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.user?.phone?.includes(searchQuery);
    const matchesStatus = selectedStatus === 'ALL' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const renderStatusFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.statusFilter}
      contentContainerStyle={styles.statusFilterContent}
    >
      {statusOptions.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.statusChip,
            { backgroundColor: selectedStatus === option.key ? option.color : theme.card },
            selectedStatus === option.key && styles.statusChipActive,
          ]}
          onPress={() => setSelectedStatus(option.key)}
        >
          <Text
            style={[
              styles.statusChipText,
              { color: selectedStatus === option.key ? 'white' : theme.text },
            ]}
          >
            {option.label}
          </Text>
          {option.count > 0 && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: selectedStatus === option.key ? 'rgba(255,255,255,0.3)' : option.color }
            ]}>
              <Text style={[
                styles.statusBadgeText,
                { color: selectedStatus === option.key ? 'white' : 'white' }
              ]}>
                {option.count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderOrderCard = (order, index) => (
    <Animatable.View
      key={order.id}
      animation="fadeInUp"
      delay={index * 100}
      duration={500}
      style={[styles.orderCard, { backgroundColor: theme.card }]}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={[styles.orderId, { color: theme.text }]}>#{order.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Icon name={getStatusIcon(order.status)} size={12} color="white" />
            <Text style={styles.statusBadgeText}>{order.status}</Text>
          </View>
        </View>
        <Text style={[styles.orderDate, { color: theme.textSecondary }]}>
          {formatDate(order.createdAt)}
        </Text>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.customerInfo}>
          <Icon name="person" size={16} color={theme.textSecondary} />
          <Text style={[styles.customerName, { color: theme.text }]}>
            {order.user?.name || 'Unknown Customer'}
          </Text>
        </View>
        <View style={styles.phoneInfo}>
          <Icon name="phone" size={16} color={theme.textSecondary} />
          <Text style={[styles.phoneNumber, { color: theme.textSecondary }]}>
            {order.user?.phone || 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.orderStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Files</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {order.printJobs?.length || 0}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Amount</Text>
          <Text style={[styles.statValue, { color: '#10B981', fontWeight: 'bold' }]}>
            {formatCurrency(order.totalAmount)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Pages</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {order.printJobs?.reduce((total, job) => total + (job.file?.pages || 0), 0) || 0}
          </Text>
        </View>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AdminOrderDetail', { orderId: order.id })}
        >
          <Icon name="visibility" size={20} color="#3B82F6" />
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>

        {order.status === 'PENDING' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.printButton]}
            onPress={() => handleStatusUpdate(order.id, 'PRINTING')}
            disabled={updatingId === order.id}
          >
            {updatingId === order.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="print" size={20} color="white" />
            )}
            <Text style={[styles.actionButtonText, { color: 'white' }]}>Start Printing</Text>
          </TouchableOpacity>
        )}

        {order.status === 'PRINTING' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleStatusUpdate(order.id, 'COMPLETED')}
            disabled={updatingId === order.id}
          >
            {updatingId === order.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="check" size={20} color="white" />
            )}
            <Text style={[styles.actionButtonText, { color: 'white' }]}>Mark Complete</Text>
          </TouchableOpacity>
        )}

        {order.status === 'PENDING' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleStatusUpdate(order.id, 'CANCELLED')}
            disabled={updatingId === order.id}
          >
            {updatingId === order.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="cancel" size={20} color="white" />
            )}
            <Text style={[styles.actionButtonText, { color: 'white' }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animatable.View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Management</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0058A3" />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Management</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => fetchOrders(true)}>
            <Icon name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
          <Icon name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by order ID, customer name, or phone..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="clear" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter */}
        {renderStatusFilter()}

        {/* Orders List */}
        <View style={styles.ordersList}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={64} color="#999" />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {searchQuery ? 'No orders found matching your search' : 'No orders available'}
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredOrders.map((order, index) => renderOrderCard(order, index))
          )}
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  statusFilter: {
    marginBottom: 20,
  },
  statusFilterContent: {
    paddingRight: 20,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  statusChipActive: {
    elevation: 3,
    shadowOpacity: 0.2,
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  ordersList: {
    paddingBottom: 20,
  },
  orderCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  orderDate: {
    fontSize: 12,
    textAlign: 'right',
  },
  orderDetails: {
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneNumber: {
    fontSize: 14,
    marginLeft: 8,
  },
  orderStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    flex: 1,
    justifyContent: 'center',
    minWidth: (width - 80) / 2,
  },
  printButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: '#374151',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  clearSearchText: {
    color: 'white',
    fontWeight: '600',
  },
});