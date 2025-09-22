import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Linking, Alert, ActivityIndicator, TextInput, Platform, Dimensions, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import Heading from '../../components/Heading';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { PermissionsAndroid } from 'react-native';
import LottieView from 'lottie-react-native';
import LoadingAnim from '../../assets/animations/Loading_Paperplane.json';
import RNFS from 'react-native-fs';
import RNPrint from 'react-native-print';
import Modal from 'react-native-modal';
import Pdf from 'react-native-pdf';

const { width } = Dimensions.get('window');

export default function AdminOrdersScreen({ navigation }) {
  console.log('AdminOrdersScreen mounted');
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
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  // Add pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;
  const [totalOrders, setTotalOrders] = useState(0);
  // Add filter state for status, date, and price
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateSort, setDateSort] = useState('desc'); // 'desc' (newest) or 'asc' (oldest)
  const [priceSort, setPriceSort] = useState('none'); // 'none', 'asc', 'desc'
  const [lastUpdatedOrderId, setLastUpdatedOrderId] = useState(null);
  const flatListRef = useRef(null);
  const [invoiceModal, setInvoiceModal] = useState({ visible: false, filePath: '', orderId: null });
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (reset = false) => {
    // Defensive: if reset is a synthetic event, treat as true
    if (reset && typeof reset === 'object' && reset.nativeEvent) reset = true;
    console.log('fetchOrders called', { reset, loading, loadingMore });
    if (!reset && (loading || loadingMore)) return;
    if (!reset && !hasMore) return;
    if (reset) {
      setLoading(true);
      setPage(1);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const currentPage = reset ? 1 : page;
      console.log('[API DEBUG] About to fetch orders:', currentPage);
      const data = await api.request(`/orders?limit=${PAGE_SIZE}&page=${currentPage - 1}`); // Spring pages are 0-based
      const ordersPage = data.content || [];
      if (reset) {
        setOrders(ordersPage);
      } else {
        // Deduplicate by ID
        const allOrders = [...orders, ...ordersPage];
        const seen = new Map();
        const duplicates = [];
        for (const order of allOrders) {
          if (seen.has(order.id)) {
            duplicates.push(order.id);
          }
          seen.set(order.id, order);
        }
        if (duplicates.length > 0) {
          console.warn('[Order Pagination] Duplicate order IDs found:', duplicates);
        }
        setOrders(Array.from(seen.values()));
      }
      setTotalOrders(data.totalElements || 0);
      if (data.page + 1 >= data.totalPages) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      setPage(currentPage + 1);
    } catch (e) {
        setError('Failed to load orders');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
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
    fetchOrders(true);
  }, []);

  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'recentOrders') fetchOrders(true);
    if (activeTab === 'failedPayments') fetchFailedPaymentsOrders();
    if (activeTab === 'paymentsNoOrder') fetchPaymentsNoOrder();
  }, [activeTab, selectedFilter, search, searchBy]);

  useEffect(() => {
    if (lastUpdatedOrderId && orders.length > 0) {
      const idx = getFilteredSortedOrders().findIndex(o => o.id === lastUpdatedOrderId);
      if (idx >= 0 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: idx, animated: true });
      }
      // Remove highlight after 2s
      const timeout = setTimeout(() => setLastUpdatedOrderId(null), 2000);
      return () => clearTimeout(timeout);
    }
  }, [orders, lastUpdatedOrderId]);

  const filters = [
    { id: 'PENDING', label: 'Pending', count: orders.filter(o => (o.status || '').toUpperCase() === 'PENDING').length },
    { id: 'PROCESSING', label: 'Processing', count: orders.filter(o => (o.status || '').toUpperCase() === 'PROCESSING').length },
    { id: 'COMPLETED', label: 'Completed', count: orders.filter(o => (o.status || '').toUpperCase() === 'COMPLETED').length },
    { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', count: orders.filter(o => (o.status || '').toUpperCase() === 'OUT_FOR_DELIVERY').length },
    { id: 'DELIVERED', label: 'Delivered', count: orders.filter(o => (o.status || '').toUpperCase() === 'DELIVERED').length },
  ];
  const statusColors = {
    PENDING: '#F59E0B',
    PROCESSING: '#3B82F6',
    COMPLETED: '#10B981',
    OUT_FOR_DELIVERY: '#FBC02D',
    DELIVERED: '#66BB6A',
  };
  const statusLabels = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
  };

  const getStatusIcon = (statusUpper) => {
    switch (statusUpper) {
      case 'PENDING': return 'schedule';
      case 'PROCESSING': return 'autorenew';
      case 'COMPLETED': return 'verified';
      case 'OUT_FOR_DELIVERY': return 'local-shipping';
      case 'DELIVERED': return 'check-circle';
      default: return 'help';
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
    const userName = order.userName;
    if (searchBy === 'user') {
      return (userName || '').toLowerCase().includes(search.toLowerCase());
    } else if (searchBy === 'file') {
      // Not available in lightweight DTO; skip file searching here
      return false;
    } else if (searchBy === 'date') {
      return (order.createdAt || '').slice(0, 10).includes(search);
    }
    return true;
  });

  // Get the 10 most recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  // Calculate summary statistics
  const summaryStats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => (o.status || '').toUpperCase() === 'PENDING').length,
    completedOrders: orders.filter(o => (o.status || '').toUpperCase() === 'COMPLETED').length,
    totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
  };

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
      setLastUpdatedOrderId(orderId); // Remember which order was updated
      await fetchOrders(true); // Reset and fetch latest
      showAlert('Success', `Order status updated to ${newStatus}`, 'success');
    } catch (e) {
      console.error('Status update error:', e);
      showAlert('Error', e?.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingId(null);
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
    { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { status: 'DELIVERED', label: 'Mark Delivered' },
    { status: 'CANCELLED', label: 'Cancel Order' },
  ];

  const statusActionIcons = {
    PROCESSING: 'autorenew',
    COMPLETED: 'check-circle',
    OUT_FOR_DELIVERY: 'local-shipping',
    DELIVERED: 'done-all',
    CANCELLED: 'cancel',
  };

  const renderOrderCard = ({ item, index }) => {
    const status = (item.status || '').toUpperCase();
    const statusColor = statusColors[status] || '#9E9E9E';
    const isHighlighted = item.id === lastUpdatedOrderId;
    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => navigation.navigate('AdminOrderDetailScreen', { orderId: item.id })}
        activeOpacity={0.7}
      >
        <Animatable.View
          animation="fadeInUp"
          delay={index * 100}
          duration={500}
          style={[
            styles.orderCard,
            { backgroundColor: '#fff' },
            isHighlighted && styles.highlightedCard
          ]}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderId}>#{item.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Icon name={getStatusIcon(status)} size={12} color="white" />
                <Text style={styles.statusBadgeText}>{statusLabels[status] || status}</Text>
              </View>
            </View>
            <Text style={styles.orderDate}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : ''}
            </Text>
          </View>

          <View style={styles.orderDetails}>
            <View style={styles.customerInfo}>
              <Icon name="person" size={16} color="#6B7280" />
              <Text style={styles.customerName}>{item.userName}</Text>
            </View>
            {item.deliveryType && (
              <View style={styles.deliveryInfo}>
                <Icon name="local-shipping" size={16} color="#6B7280" />
                <Text style={styles.deliveryType}>{item.deliveryType}</Text>
              </View>
            )}
          </View>

          <View style={styles.orderStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Amount</Text>
              <Text style={[styles.statValue, { color: '#10B981', fontWeight: 'bold' }]}>
                ₹{item.totalAmount?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={[styles.statValue, { color: statusColor }]}>
                {statusLabels[status] || status}
              </Text>
            </View>
          </View>

          <View style={styles.orderActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleAdminDownloadInvoice(item.id);
              }}
              disabled={downloadingInvoiceId === item.id}
            >
              {downloadingInvoiceId === item.id ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <Icon name="file-download" size={20} color="#6B7280" />
              )}
              <Text style={styles.actionButtonText}>Invoice</Text>
            </TouchableOpacity>

            {(status === 'PENDING' || status === 'PROCESSING') && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.statusActionButton,
                  { backgroundColor: status === 'PENDING' ? '#F59E0B' : '#10B981' }
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(item.id, status === 'PENDING' ? 'PROCESSING' : 'COMPLETED');
                }}
                disabled={updatingId === item.id}
              >
                {updatingId === item.id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Icon name={status === 'PENDING' ? 'autorenew' : 'check-circle'} size={20} color="white" />
                )}
                <Text style={[styles.actionButtonText, { color: 'white' }]}>
                  {status === 'PENDING' ? 'Start Processing' : 'Complete'}
                </Text>
              </TouchableOpacity>
            )}

            {status === 'COMPLETED' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.statusActionButton, { backgroundColor: '#FBC02D' }]}
                onPress={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'OUT_FOR_DELIVERY'); }}
              >
                <Icon name="local-shipping" size={20} color="white" />
                <Text style={[styles.actionButtonText, { color: 'white' }]}>Out for Delivery</Text>
              </TouchableOpacity>
            )}

            {status === 'OUT_FOR_DELIVERY' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.statusActionButton, { backgroundColor: '#66BB6A' }]}
                onPress={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'DELIVERED'); }}
              >
                <Icon name="done-all" size={20} color="white" />
                <Text style={[styles.actionButtonText, { color: 'white' }]}>Mark Delivered</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animatable.View>
      </TouchableOpacity>
    );
  };

  // Filter and sort orders before rendering
  const getFilteredSortedOrders = () => {
    let filtered = orders;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => (o.status || '').toUpperCase() === statusFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(o =>
        (o.userName || '').toLowerCase().includes(s) ||
        (o.createdAt && String(o.createdAt).includes(s)) ||
        (o.totalAmount && String(o.totalAmount).includes(s))
      );
    }
    if (dateSort !== 'none') {
      filtered = filtered.slice().sort((a, b) => {
        const aDate = new Date(a.createdAt);
        const bDate = new Date(b.createdAt);
        return dateSort === 'asc' ? aDate - bDate : bDate - aDate;
      });
    }
    if (priceSort !== 'none') {
      filtered = filtered.slice().sort((a, b) => {
        return priceSort === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
      });
    }
    return filtered;
  };

  const renderStatusFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.statusFilter}
      contentContainerStyle={styles.statusFilterContent}
    >
      {['all', 'PENDING', 'PROCESSING', 'COMPLETED', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((tab, idx, arr) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.statusChip,
            { backgroundColor: statusFilter === tab ? '#22194f' : '#F3F4F6' },
          ]}
          onPress={() => setStatusFilter(tab)}
        >
          <Text
            style={[
              styles.statusChipText,
              { color: statusFilter === tab ? 'white' : '#374151' },
            ]}
          >
            {tab === 'all' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </Text>
          {tab !== 'all' && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: statusFilter === tab ? 'rgba(255,255,255,0.3)' : statusColors[tab] || '#9E9E9E' }
            ]}>
              <Text style={[
                styles.statusBadgeText,
                { color: statusFilter === tab ? 'white' : 'white' }
              ]}>
                {filters.find(f => f.id === tab)?.count || 0}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#22194f", "#667eea"]} style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Orders</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={() => fetchOrders(true)}>
              <Icon name="refresh" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <LottieView source={LoadingAnim} autoPlay loop style={{ width: 120, height: 120 }} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#22194f", "#667eea"]} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Orders</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => fetchOrders(true)}>
            <Icon name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by user, file, or date..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summaryStats.totalOrders}</Text>
            <Text style={styles.summaryLabel}>Total Orders</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summaryStats.pendingOrders}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summaryStats.completedOrders}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₹{summaryStats.totalRevenue.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Revenue</Text>
          </View>
        </View>

        {/* Status Filter */}
        {renderStatusFilter()}

        {/* Date/Price Filter Row */}
        <View style={styles.sortFilterContainer}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setDateSort(dateSort === 'desc' ? 'asc' : 'desc')}
          >
            <Icon name="event" size={18} color="#6B7280" />
            <Text style={styles.sortButtonText}>
              {dateSort === 'desc' ? 'Newest' : 'Oldest'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setPriceSort(priceSort === 'none' ? 'desc' : priceSort === 'desc' ? 'asc' : 'none')}
          >
            <Icon name="payments" size={18} color="#6B7280" />
            <Text style={styles.sortButtonText}>
              {priceSort === 'none' ? 'Price' : priceSort === 'desc' ? 'High → Low' : 'Low → High'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Orders List */}
        <View style={styles.ordersList}>
          {error ? (
            <View style={styles.emptyContainer}>
              <Icon name="error" size={64} color="#EF4444" />
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : getFilteredSortedOrders().length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No orders found for this filter.</Text>
              {search.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearch('')}
                >
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {getFilteredSortedOrders().map((item, index) => renderOrderCard({ item, index }))}
              
              {hasMore && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() => fetchOrders(false)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <Text style={styles.loadMoreText}>Load More</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          // Add your quick action here, e.g., create new order
          navigation.navigate('CreateOrderScreen');
        }}
      >
        <Icon name="add" size={24} color="white" />
      </TouchableOpacity> */}

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={closeAlert}
      />
      
      <Modal isVisible={invoiceModal.visible} onBackdropPress={() => setInvoiceModal({ visible: false, filePath: '', orderId: null })}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Invoice Downloaded</Text>
          <Text style={styles.modalMessage}>Invoice saved to:
            {'\n'}{invoiceModal.filePath}
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalButton} onPress={() => setInvoiceModal(modal => ({ ...modal, preview: true }))}>
              <Text style={styles.modalButtonText}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={async () => { if (invoiceModal.filePath) { await RNPrint.print({ filePath: invoiceModal.filePath }); } }}>
              <Text style={styles.modalButtonText}>Print</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.modalButton} onPress={() => Linking.openURL(Platform.OS === 'android' ? 'file://' + RNFS.DownloadDirectoryPath : 'file://' + RNFS.DocumentDirectoryPath)}>
              <Text style={styles.modalButtonText}>Open Folder</Text>
            </TouchableOpacity> */}
          </View>
          {invoiceModal.preview && (
            <View style={styles.pdfPreview}>
              <Pdf source={{ uri: 'file://' + invoiceModal.filePath }} style={styles.pdfViewer} />
            </View>
          )}
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setInvoiceModal({ visible: false, filePath: '', orderId: null })}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerGradient: {
    paddingTop: 48,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    color: '#4B5563',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
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
    color: '#1F2937',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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
  sortFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flex: 1,
    marginHorizontal: 5,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 6,
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
    backgroundColor: '#fff',
  },
  highlightedCard: {
    borderWidth: 2,
    borderColor: '#FBBF24',
    backgroundColor: '#FFFBEB',
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
    color: '#1F2937',
    marginRight: 8,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderDetails: {
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryType: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  orderStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    flex: 1,
    minWidth: (width - 80) / 2,
  },
  statusActionButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: '#4B5563',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    color: '#4B5563',
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
  loadMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginTop: 10,
  },
  loadMoreText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    color: '#1F2937',
  },
  modalMessage: {
    color: '#4B5563',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pdfPreview: {
    width: '100%',
    height: 300,
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  pdfViewer: {
    flex: 1,
  },
  modalCloseButton: {
    marginTop: 18,
  },
  modalCloseText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 16,
  },
});