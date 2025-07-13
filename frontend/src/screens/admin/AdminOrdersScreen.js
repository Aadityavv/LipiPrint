import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Linking, Alert, ActivityIndicator, TextInput, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import CustomAlert from '../../components/CustomAlert';

export default function AdminOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('user'); // 'user', 'file', 'date'
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' });
  const [activeTab, setActiveTab] = useState('recentOrders'); // 'recentOrders', 'orders', 'failedPayments', 'paymentsNoOrder'
  const [failedPaymentsOrders, setFailedPaymentsOrders] = useState([]);
  const [paymentsNoOrder, setPaymentsNoOrder] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    setError(null);
    console.log('[DEBUG] fetchOrders called');
    api.request('/orders')
      .then(data => {
        console.log('[DEBUG] /orders API response:', data);
        setOrders(data);
      })
      .catch(e => {
        console.error('[DEBUG] Failed to load orders:', e);
        setError('Failed to load orders');
      })
      .finally(() => setLoading(false));
  };

  const fetchFailedPaymentsOrders = async () => {
    setTabLoading(true);
    try {
      const data = await api.getOrdersWithFailedPayments();
      setFailedPaymentsOrders(data);
    } catch (e) {
      setAlert({ visible: true, title: 'Error', message: 'Failed to load failed payment orders', type: 'error' });
    } finally {
      setTabLoading(false);
    }
  };

  const fetchPaymentsNoOrder = async () => {
    setTabLoading(true);
    try {
      const data = await api.getPaymentsWithoutOrder();
      setPaymentsNoOrder(data);
    } catch (e) {
      setAlert({ visible: true, title: 'Error', message: 'Failed to load payments without order', type: 'error' });
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'failedPayments') fetchFailedPaymentsOrders();
    if (activeTab === 'paymentsNoOrder') fetchPaymentsNoOrder();
    if (activeTab === 'recentOrders') fetchOrders(); // Fetch orders for recentOrders as well
  }, [activeTab]);

  const filters = [
    { id: 'PENDING', label: 'Pending', count: orders.filter(o => (o.status || '').toUpperCase() === 'PENDING').length },
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'PROCESSING', label: 'Processing', count: orders.filter(o => (o.status || '').toUpperCase() === 'PROCESSING').length },
    { id: 'COMPLETED', label: 'Completed', count: orders.filter(o => (o.status || '').toUpperCase() === 'COMPLETED').length },
    { id: 'CANCELLED', label: 'Cancelled', count: orders.filter(o => (o.status || '').toUpperCase() === 'CANCELLED').length },
    { id: 'DELIVERED', label: 'Delivered', count: orders.filter(o => (o.status || '').toUpperCase() === 'DELIVERED').length },
  ];

  const statusColors = {
    PENDING: '#FF9800',
    PROCESSING: '#42A5F5',
    COMPLETED: '#4CAF50',
    CANCELLED: '#F44336',
    DELIVERED: '#66BB6A',
  };

  const statusLabels = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    DELIVERED: 'Delivered',
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'confirmed': return '#FFA726';
      case 'printing': return '#42A5F5';
      case 'ready': return '#66BB6A';
      case 'completed': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'printing': return 'Printing';
      case 'ready': return 'Ready for Pickup';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'printing': return '🖨️';
      case 'ready': return '📦';
      case 'completed': return '🎉';
      default: return '❓';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'normal': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'urgent': return 'URGENT';
      case 'high': return 'HIGH';
      case 'normal': return 'NORMAL';
      default: return 'LOW';
    }
  };

  const getAbsoluteUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return api.baseUrl.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
  };

  const filteredOrders = orders.filter(order => {
    if (selectedFilter !== 'all' && (order.status || '').toUpperCase() !== selectedFilter) return false;
    if (!search) return true;
    const user = order.user;
    const printJob = order.printJob;
    const file = printJob?.file;
    if (searchBy === 'user') {
      return (user?.name || '').toLowerCase().includes(search.toLowerCase());
    } else if (searchBy === 'file') {
      return (file?.originalFilename || '').toLowerCase().includes(search.toLowerCase());
    } else if (searchBy === 'date') {
      return (order.createdAt || '').slice(0, 10).includes(search);
    }
    return true;
  });

  // Get the 10 most recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  const showAlert = (title, message, type = 'info') => {
    setAlert({ visible: true, title, message, type });
  };
  const closeAlert = () => setAlert(a => ({ ...a, visible: false }));

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId + '-' + newStatus);
    try {
      console.log('Updating order status:', orderId, newStatus);
      const res = await api.request(`/orders/${orderId}/status?status=${newStatus.toUpperCase()}`, { method: 'PUT' });
      console.log('Status update response:', res);
      fetchOrders();
      showAlert('Success', `Order status updated to ${newStatus}`, 'success');
    } catch (e) {
      console.error('Status update error:', e);
      showAlert('Error', e?.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePrintFile = (fileUrl) => {
    const absUrl = getAbsoluteUrl(fileUrl);
    console.log('Print file URL:', absUrl);
    if (absUrl && absUrl.startsWith('http')) {
      Linking.openURL(absUrl).catch(err => {
        console.error('Print file error:', err);
        showAlert('Error', 'Failed to open file for printing.', 'error');
      });
    } else {
      showAlert('No file', 'No file available to print.', 'warning');
    }
  };

  const handleDownloadFile = (fileUrl) => {
    const absUrl = getAbsoluteUrl(fileUrl);
    console.log('Download file URL:', absUrl);
    if (absUrl && absUrl.startsWith('http')) {
      Linking.openURL(absUrl).catch(err => {
        console.error('Download file error:', err);
        showAlert('Error', 'Failed to download file.', 'error');
      });
    } else {
      showAlert('No file', 'No file available to download.', 'warning');
    }
  };

  const handleDownloadInvoice = (orderId) => {
    const url = getAbsoluteUrl(`/orders/${orderId}/invoice`);
    console.log('Download invoice URL:', url);
    Linking.openURL(url).catch(err => {
      console.error('Download invoice error:', err);
      showAlert('Error', 'Failed to download invoice.', 'error');
    });
  };

  // Status update actions
  const statusActions = [
    { status: 'PROCESSING', label: 'Start Processing' },
    { status: 'COMPLETED', label: 'Complete Order' },
    { status: 'CANCELLED', label: 'Cancel Order' },
    { status: 'DELIVERED', label: 'Mark Delivered' },
  ];

  // Add icons for each status
  const statusActionIcons = {
    PROCESSING: 'autorenew',
    COMPLETED: 'check-circle',
    CANCELLED: 'cancel',
    DELIVERED: 'local-shipping',
  };

  const renderOrderCard = ({ item, index }) => {
    const user = item.user;
    const printJob = item.printJob;
    const file = printJob?.file;
    const status = (item.status || '').toUpperCase();
    // Split statusActions into two rows
    const firstRow = statusActions.slice(0, 2);
    const secondRow = statusActions.slice(2);
    // Determine file count for label
    let fileLabel = 'No file';
    if (item.printJobs && Array.isArray(item.printJobs)) {
      if (item.printJobs.length > 1) fileLabel = 'Multiple files';
      else if (item.printJobs.length === 1) fileLabel = 'One file';
    } else if (file) {
      fileLabel = 'One file';
    }
    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 60}
        duration={350}
        style={styles.orderCardMinimal}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AdminOrderDetailScreen', { orderId: item.id })}
          style={{ flex: 1 }}
        >
          <View style={styles.orderCardContentMinimal}>
            <View style={styles.orderCardRowMinimal}>
              <Text style={styles.orderIdMinimal}>Order #{item.id}</Text>
              <View style={[styles.statusBadgeMinimal, { backgroundColor: statusColors[status] || '#9E9E9E' }]}> 
                <Text style={styles.statusBadgeTextMinimal}>{statusLabels[status] || status}</Text>
              </View>
            </View>
            <Text style={styles.orderFileMinimal}>{fileLabel}</Text>
            <View style={styles.orderCardRowMinimal}>
              <Text style={styles.orderUserMinimal}>{user?.name} ({user?.email || user?.phone})</Text>
              <Text style={styles.orderAmountMinimal}>₹{item.totalAmount}</Text>
              </View>
            <View style={styles.orderCardRowMinimal}>
              <Text style={styles.orderDateMinimal}>{item.createdAt?.slice(0, 10)}</Text>
            </View>
            {/* Status update buttons (2x2 matrix) */}
            <View style={styles.statusActionsMatrix}>
              <View style={styles.statusActionsMatrixRow}>
                {firstRow.map(({ status: s, label }) => (
                <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusActionBtnBetter,
                      { backgroundColor: statusColors[s] || '#667eea', flex: 1, marginHorizontal: 4 },
                      updatingId === item.id + '-' + s && styles.statusActionBtnLoading,
                    ]}
                    onPress={() => handleUpdateStatus(item.id, s)}
                    disabled={updatingId === item.id + '-' + s}
                    activeOpacity={0.85}
                >
                    {updatingId === item.id + '-' + s ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                      <>
                        <Icon name={statusActionIcons[s] || 'check'} size={16} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.statusActionTextBetter}>{label}</Text>
                      </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
              <View style={styles.statusActionsMatrixRow}>
                {secondRow.map(({ status: s, label }) => (
                <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusActionBtnBetter,
                      { backgroundColor: statusColors[s] || '#667eea', flex: 1, marginHorizontal: 4 },
                      updatingId === item.id + '-' + s && styles.statusActionBtnLoading,
                    ]}
                    onPress={() => handleUpdateStatus(item.id, s)}
                    disabled={updatingId === item.id + '-' + s}
                    activeOpacity={0.85}
                >
                    {updatingId === item.id + '-' + s ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                      <>
                        <Icon name={statusActionIcons[s] || 'check'} size={16} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.statusActionTextBetter}>{label}</Text>
                      </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER: Minimal, just back button and title */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Order</Text>
          <TouchableOpacity onPress={fetchOrders} style={styles.refreshButton}>
            <Icon name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* SEARCH BAR: Minimal, sticky, no toggles */}
      <View style={styles.searchBarRowSticky}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search by ${searchBy}`}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="always"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
            <Icon name="close" size={18} color="#667eea" />
          </TouchableOpacity>
        )}
        <View style={styles.searchByRow}>
          {['user', 'file', 'date'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.searchByBtn, searchBy === type && styles.searchByBtnActive]}
              onPress={() => setSearchBy(type)}
            >
              <Text style={[styles.searchByText, searchBy === type && styles.searchByTextActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Filters */}
      <Animatable.View animation="fadeInUp" delay={200} duration={500}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
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
                  selectedFilter === filter.id && styles.selectedFilter
                ]}
                onPress={() => setSelectedFilter(filter.id)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.selectedFilterText
                ]}>
                  {filter.label}
                </Text>
                <View style={[
                  styles.filterCount,
                  selectedFilter === filter.id && styles.selectedFilterCount
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    selectedFilter === filter.id && styles.selectedFilterCountText
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animatable.View>
          ))}
        </ScrollView>
      </Animatable.View>

      {/* TABS: Only update order cards section, not the whole screen */}
      <View style={styles.tabBarMinimal}>
        <TouchableOpacity onPress={() => setActiveTab('recentOrders')} style={[styles.tabBtnMinimal, activeTab === 'recentOrders' && styles.tabBtnActiveMinimal]}>
          <Text style={[styles.tabBtnTextMinimal, activeTab === 'recentOrders' && styles.tabBtnTextActiveMinimal]}>Recent</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('orders')} style={[styles.tabBtnMinimal, activeTab === 'orders' && styles.tabBtnActiveMinimal]}>
          <Text style={[styles.tabBtnTextMinimal, activeTab === 'orders' && styles.tabBtnTextActiveMinimal]}>All</Text>
        </TouchableOpacity>
      </View>
      {/* Tab Content */}
      {activeTab === 'recentOrders' && (
        loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Text style={{ color: '#e53935', fontWeight: 'bold' }}>{error}</Text>
          </View>
        ) : recentOrders.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Text style={{ color: '#888', fontWeight: 'bold' }}>No recent orders found.</Text>
          </View>
        ) : (
          <FlatList
            data={recentOrders}
            renderItem={renderOrderCard}
            keyExtractor={item => item.id?.toString()}
            contentContainerStyle={styles.ordersList}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
      {activeTab === 'orders' && (
        loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Text style={{ color: '#e53935', fontWeight: 'bold' }}>{error}</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Text style={{ color: '#888', fontWeight: 'bold' }}>No orders found.</Text>
          </View>
        ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={item => item.id?.toString()}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
        />
        )
      )}
      {activeTab === 'failedPayments' && (
        tabLoading ? <ActivityIndicator size="large" color="#e53935" style={{ marginTop: 40 }} /> :
        <FlatList
          data={failedPaymentsOrders}
          renderItem={({ item }) => (
            <View style={[styles.orderCardModern, { borderLeftWidth: 4, borderLeftColor: '#e53935' }]}> 
              <Text style={styles.orderIdModern}>Order #{item.id}</Text>
              <Text style={{ color: '#e53935', fontWeight: 'bold' }}>Payment Failed</Text>
              <Text>User: {item.user?.name} ({item.user?.email || item.user?.phone})</Text>
              <Text>Amount: ₹{item.totalAmount}</Text>
              <Text>Date: {item.createdAt?.slice(0, 10)}</Text>
            </View>
          )}
          keyExtractor={item => item.id?.toString()}
          contentContainerStyle={styles.ordersList}
        />
      )}
      {activeTab === 'paymentsNoOrder' && (
        tabLoading ? <ActivityIndicator size="large" color="#ffb300" style={{ marginTop: 40 }} /> :
        <FlatList
          data={paymentsNoOrder}
          renderItem={({ item }) => (
            <View style={[styles.orderCardModern, { borderLeftWidth: 4, borderLeftColor: '#ffb300' }]}> 
              <Text style={styles.orderIdModern}>Payment ID: {item.id}</Text>
              <Text style={{ color: '#ffb300', fontWeight: 'bold' }}>No Order Linked</Text>
              <Text>User: {item.user?.name} ({item.user?.email || item.user?.phone})</Text>
              <Text>Amount: ₹{item.amount}</Text>
              <Text>Status: {item.status}</Text>
              <Text>Razorpay Order ID: {item.razorpayOrderId}</Text>
              <Text>Date: {item.createdAt?.slice(0, 10)}</Text>
            </View>
          )}
          keyExtractor={item => item.id?.toString()}
          contentContainerStyle={styles.ordersList}
        />
      )}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={closeAlert}
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
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  selectedFilter: {
    backgroundColor: '#667eea',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  selectedFilterText: {
    color: 'white',
  },
  filterCount: {
    backgroundColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  selectedFilterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
  orderCardModern: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderIdModern: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  statusBadgeModern: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderTitleModern: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  orderMetaModern: {
    fontSize: 12,
    color: '#888',
  },
  orderAmountModern: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
    marginLeft: 8,
  },
  userInfoModern: {
    fontSize: 13,
    color: '#555',
  },
  fileActionsModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  fileActionBtnModern: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f4f6fa',
    marginHorizontal: 2,
  },
  fileActionTextModern: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: '#333',
  },
  actionButtonsModernStacked: {
    marginTop: 10,
  },
  actionButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  actionButtonModern: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 4,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonTextModern: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  searchByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchByBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#eee',
    marginLeft: 4,
  },
  searchByBtnActive: {
    backgroundColor: '#667eea',
  },
  searchByText: {
    fontSize: 12,
    color: '#333',
  },
  searchByTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchBarRowSticky: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'sticky',
    top: Platform.OS === 'web' ? 0 : undefined,
    zIndex: 10,
  },
  clearSearchBtn: {
    marginLeft: 4,
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  searchByBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginLeft: 4,
  },
  searchByBtnActivePill: {
    backgroundColor: '#667eea',
  },
  tabBarMinimal: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6fa',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 4,
    padding: 4,
  },
  tabBtnMinimal: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
    marginHorizontal: 2,
  },
  tabBtnActiveMinimal: {
    backgroundColor: '#667eea',
  },
  tabBtnTextMinimal: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: 'bold',
  },
  tabBtnTextActiveMinimal: {
    color: '#fff',
  },
  orderCardMinimal: {
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  orderCardContentMinimal: {
    padding: 16,
  },
  orderCardRowMinimal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderIdMinimal: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 15,
  },
  statusBadgeMinimal: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeTextMinimal: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  orderFileMinimal: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
    marginTop: 2,
  },
  orderUserMinimal: {
    fontSize: 13,
    color: '#555',
  },
  orderAmountMinimal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#667eea',
  },
  orderDateMinimal: {
    fontSize: 12,
    color: '#888',
  },
  viewDetailsBtnMinimal: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  viewDetailsTextMinimal: {
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: 13,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewDetailsBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusActionBtn: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  // STYLES: Modern pill-shaped, icon, shadow, spacing
  statusActionsRowBetter: {
    marginTop: 12,
    marginBottom: 4,
  },
  statusActionsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 2,
  },
  statusActionBtnBetter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    marginHorizontal: 4,
    backgroundColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    minWidth: 44,
    minHeight: 36,
    justifyContent: 'center',
  },
  statusActionBtnLoading: {
    opacity: 0.7,
  },
  statusActionTextBetter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  // STYLES: Add matrix layout
  statusActionsMatrix: {
    marginTop: 12,
    marginBottom: 4,
  },
  statusActionsMatrixRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
}); 