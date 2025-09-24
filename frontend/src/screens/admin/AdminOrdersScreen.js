import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Linking, Alert, ActivityIndicator, TextInput, Platform, Dimensions, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import Heading from '../../components/Heading';
import LottieView from 'lottie-react-native';
import LoadingAnim from '../../assets/animations/Loading_Paperplane.json';
import Modal from 'react-native-modal';
import Pdf from 'react-native-pdf';
import RNFS from 'react-native-fs';

const { width } = Dimensions.get('window');

export default function AdminOrdersScreen({ navigation }) {
  console.log('AdminOrdersScreen mounted');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('user');
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' });
  const [activeTab, setActiveTab] = useState('recentOrders');
  const [failedPaymentsOrders, setFailedPaymentsOrders] = useState([]);
  const [paymentsNoOrder, setPaymentsNoOrder] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateSort, setDateSort] = useState('desc');
  const [priceSort, setPriceSort] = useState('none');
  const [lastUpdatedOrderId, setLastUpdatedOrderId] = useState(null);
  const flatListRef = useRef(null);
  const [invoiceModal, setInvoiceModal] = useState({ visible: false, filePath: '', orderId: null, url: '', loading: false });
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (reset = false) => {
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
      const data = await api.request(`/orders?limit=${PAGE_SIZE}&page=${currentPage - 1}`);
      const ordersPage = data.content || [];
      if (reset) {
        setOrders(ordersPage);
      } else {
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
      return false;
    } else if (searchBy === 'date') {
      return (order.createdAt || '').slice(0, 10).includes(search);
    }
    return true;
  });

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

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
      setLastUpdatedOrderId(orderId);
      
      // Update local state instead of refetching all orders
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus.toUpperCase(), ...res }
            : order
        )
      );
      
      showAlert('Success', `Order status updated to ${newStatus}`, 'success');
    } catch (e) {
      console.error('Status update error:', e);
      showAlert('Error', e?.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const downloadInvoiceForPreview = async (orderId) => {
    try {
      const url = getAbsoluteUrl(`/orders/${orderId}/invoice`);
      
      let path;
      if (Platform.OS === 'android') {
        path = `${RNFS.DocumentDirectoryPath}/invoice_${orderId}.pdf`;
      } else {
        path = `${RNFS.DocumentDirectoryPath}/invoice_${orderId}.pdf`;
      }
      
      console.log('Downloading invoice to:', path);
      
      const authToken = await api.getToken();
      
      if (!authToken) {
        throw new Error('Authentication token not available');
      }
      
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };
      
      const downloadOptions = {
        fromUrl: url,
        toFile: path,
        headers: headers,
      };
      
      const downloadResult = await RNFS.downloadFile(downloadOptions).promise;
      
      if (downloadResult.statusCode === 200) {
        console.log('Invoice downloaded successfully');
        return path;
      } else {
        throw new Error(`Download failed with status code: ${downloadResult.statusCode}`);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  };

  const downloadInvoiceWithFetch = async (orderId) => {
    try {
      const url = getAbsoluteUrl(`/orders/${orderId}/invoice`);
      
      const authToken = await api.getToken();
      
      if (!authToken) {
        throw new Error('Authentication token not available');
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/pdf',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Download failed with status code: ${response.status}`);
      }
      
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      
      let path;
      if (Platform.OS === 'android') {
        path = `${RNFS.DocumentDirectoryPath}/invoice_${orderId}.pdf`;
      } else {
        path = `${RNFS.DocumentDirectoryPath}/invoice_${orderId}.pdf`;
      }
      
      await RNFS.writeFile(path, base64, 'base64');
      
      console.log('Invoice downloaded successfully using fetch');
      return path;
    } catch (error) {
      console.error('Error downloading invoice with fetch:', error);
      throw error;
    }
  };
  
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handlePreviewInvoice = async (orderId) => {
    setDownloadingInvoiceId(orderId);
    setInvoiceModal({
      visible: true,
      filePath: '',
      orderId: orderId,
      url: '',
      loading: true
    });
    
    try {
      let filePath;
      
      try {
        filePath = await downloadInvoiceForPreview(orderId);
      } catch (error) {
        console.log('RNFS download failed, trying fetch method:', error);
        filePath = await downloadInvoiceWithFetch(orderId);
      }
      
      setInvoiceModal(prev => ({
        ...prev,
        filePath: filePath,
        loading: false
      }));
    } catch (e) {
      console.error('Invoice preview error:', e);
      let errorMessage = 'Failed to load invoice preview.';
      
      if (e.message && e.message.includes('403')) {
        errorMessage = 'You are not authorized to view this invoice.';
      } else if (e.message && e.message.includes('404')) {
        errorMessage = 'Invoice not found. Please contact support.';
      } else if (e.message && e.message.includes('500')) {
        errorMessage = 'Server error occurred while generating the invoice. This might be due to missing order data or template issues. Please contact support.';
      } else if (e.message && e.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = `Invoice preview failed: ${e.message || 'Unknown error'}`;
      }
      
      showAlert('Error', errorMessage, 'error');
      setInvoiceModal(prev => ({ ...prev, loading: false }));
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handlePrintInvoice = async (orderId) => {
    try {
      if (invoiceModal.filePath) {
        if (Platform.OS === 'android') {
          await Linking.openURL(`file://${invoiceModal.filePath}`);
        } else {
          showAlert('Info', 'Print functionality is not fully implemented on iOS', 'info');
        }
      } else {
        showAlert('Error', 'Please preview the invoice first before printing', 'error');
      }
    } catch (error) {
      console.error('Print error:', error);
      showAlert('Error', 'Failed to print invoice', 'error');
    }
  };

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
                handlePreviewInvoice(item.id);
              }}
              disabled={downloadingInvoiceId === item.id}
            >
              {downloadingInvoiceId === item.id ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <Icon name="visibility" size={20} color="#6B7280" />
              )}
              <Text style={styles.actionButtonText}>Preview</Text>
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
                  {status === 'PENDING' ? 'Process' : 'Complete'}
                </Text>
              </TouchableOpacity>
            )}

            {status === 'COMPLETED' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.statusActionButton, { backgroundColor: '#FBC02D' }]}
                onPress={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'OUT_FOR_DELIVERY'); }}
              >
                <Icon name="local-shipping" size={20} color="white" />
                <Text style={[styles.actionButtonText, { color: 'white' }]}>Deliver</Text>
              </TouchableOpacity>
            )}

            {status === 'OUT_FOR_DELIVERY' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.statusActionButton, { backgroundColor: '#66BB6A' }]}
                onPress={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'DELIVERED'); }}
              >
                <Icon name="done-all" size={20} color="white" />
                <Text style={[styles.actionButtonText, { color: 'white' }]}>Delivered</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animatable.View>
      </TouchableOpacity>
    );
  };

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

        {renderStatusFilter()}

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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          navigation.navigate('CreateOrderScreen');
        }}
      >
        <Icon name="add" size={24} color="white" />
      </TouchableOpacity>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={closeAlert}
      />
      
      <Modal 
        isVisible={invoiceModal.visible} 
        onBackdropPress={() => setInvoiceModal({ visible: false, filePath: '', orderId: null, url: '', loading: false })}
        style={styles.bottomModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invoice Preview</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setInvoiceModal({ visible: false, filePath: '', orderId: null, url: '', loading: false })}
            >
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.pdfPreview}>
            {invoiceModal.loading ? (
              <View style={styles.pdfPlaceholder}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.pdfPlaceholderText}>Loading invoice...</Text>
              </View>
            ) : invoiceModal.filePath ? (
              <Pdf 
                source={{ uri: `file://${invoiceModal.filePath}` }} 
                style={styles.pdfViewer} 
                trustAllCerts={false}
              />
            ) : (
              <View style={styles.pdfPlaceholder}>
                <Icon name="error" size={40} color="#EF4444" />
                <Text style={styles.pdfPlaceholderText}>Failed to load invoice</Text>
              </View>
            )}
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => handlePrintInvoice(invoiceModal.orderId)}
            >
              <Icon name="print" size={20} color="white" />
              <Text style={styles.modalButtonText}>Print</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                if (invoiceModal.filePath) {
                  Linking.openURL(`file://${invoiceModal.filePath}`);
                }
              }}
            >
              <Icon name="share" size={20} color="white" />
              <Text style={styles.modalButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 40,
    paddingBottom: 12,
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
    paddingTop: 16,
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
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
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
    padding: 12,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  statusFilterContent: {
    paddingRight: 20,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
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
    marginBottom: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    padding: 12,
    marginBottom: 12,
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
    marginBottom: 6,
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
    marginBottom: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
    marginBottom: 8,
    paddingVertical: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  pdfPreview: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  pdfViewer: {
    flex: 1,
  },
  pdfPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});