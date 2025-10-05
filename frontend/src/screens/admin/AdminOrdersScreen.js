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
import InvoiceGenerator from '../../components/InvoiceGenerator';
import RNPrint from 'react-native-print';

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
  const [trackingData, setTrackingData] = useState({});
  const [loadingTracking, setLoadingTracking] = useState({});

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

  // ✅ NEW: Auto-fetch tracking data for orders that need it
  useEffect(() => {
    if (orders.length > 0) {
      // Auto-fetch tracking for orders that are out for delivery or delivered
      const ordersNeedingTracking = orders.filter(order => 
        (order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED' || order.status === 'COMPLETED') &&
        !trackingData[order.id] && 
        !loadingTracking[order.id]
      );
      
      // Fetch tracking for up to 3 orders at a time to avoid overwhelming the API
      ordersNeedingTracking.slice(0, 3).forEach(order => {
        fetchTrackingData(order.id);
      });
    }
  }, [orders]);

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

  // ✅ NEW: Fetch tracking data for an order
  const fetchTrackingData = async (orderId) => {
    if (trackingData[orderId] || loadingTracking[orderId]) return;
    
    setLoadingTracking(prev => ({ ...prev, [orderId]: true }));
    try {
      console.log('Fetching tracking data for order:', orderId);
      const tracking = await api.trackOrder(orderId);
      console.log('Tracking data received:', tracking);
      
      setTrackingData(prev => ({ ...prev, [orderId]: tracking }));
    } catch (e) {
      console.error('Failed to fetch tracking data:', e);
      showAlert('Error', 'Failed to fetch tracking information', 'error');
    } finally {
      setLoadingTracking(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // ✅ NEW: Get pickup information from tracking data
  const getPickupInfo = (orderId) => {
    const tracking = trackingData[orderId];
    if (!tracking || !tracking.trackingData || !Array.isArray(tracking.trackingData)) return null;
    
    // Look for pickup-related events
    const pickupEvents = tracking.trackingData.filter(event => 
      event && event.activity && (
        event.activity.toLowerCase().includes('pickup') ||
        event.activity.toLowerCase().includes('collected') ||
        event.activity.toLowerCase().includes('picked up') ||
        event.status === 'pickup'
      )
    );
    
    if (pickupEvents.length > 0) {
      const latestPickup = pickupEvents[0];
      return {
        date: latestPickup.date || latestPickup.timestamp || 'Unknown',
        location: latestPickup.location || 'Unknown',
        description: latestPickup.activity || latestPickup.description || 'Pickup completed',
        courier: tracking.courierName || 'Unknown'
      };
    }
    
    return null;
  };

  // ✅ NEW: Get current delivery status from tracking data
  const getDeliveryStatus = (orderId) => {
    const tracking = trackingData[orderId];
    if (!tracking) return null;
    
    return {
      currentStatus: tracking.currentStatus || 'Unknown',
      lastLocation: tracking.lastLocation || 'Not available',
      expectedDelivery: tracking.expectedDeliveryDate || 'Not available',
      deliveredDate: tracking.deliveredDate || null,
      courierName: tracking.courierName || 'Not available',
      awbNumber: tracking.awbNumber || 'Not available'
    };
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
      // First, get the order data
      const orderData = await api.request(`/orders/${orderId}/invoice`);
      
      // Generate PDF using the new frontend system
      await InvoiceGenerator.generateInvoice(
        orderData,
        (pdf) => {
          setInvoiceModal(prev => ({
            ...prev,
            filePath: pdf.filePath,
            loading: false
          }));
        },
        (error) => {
          console.error('Invoice generation error:', error);
          let errorMessage = 'Failed to generate invoice preview.';
          
          if (error.message && error.message.includes('permission')) {
            errorMessage = 'Storage permission denied. Please allow storage access.';
          } else if (error.message && error.message.includes('template')) {
            errorMessage = 'Invoice template error. Please contact support.';
          } else {
            errorMessage = `Invoice generation failed: ${error.message || 'Unknown error'}`;
          }
          
          showAlert('Error', errorMessage, 'error');
          setInvoiceModal(prev => ({ ...prev, loading: false }));
        }
      );
      
    } catch (e) {
      console.error('Invoice preview error:', e);
      let errorMessage = 'Failed to load invoice data.';
      
      if (e.message && e.message.includes('403')) {
        errorMessage = 'You are not authorized to view this invoice.';
      } else if (e.message && e.message.includes('404')) {
        errorMessage = 'Invoice not found. Please contact support.';
      } else if (e.message && e.message.includes('500')) {
        errorMessage = 'Server error occurred while fetching invoice data. Please contact support.';
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
        console.log('[PRINT] Starting print process for invoice:', invoiceModal.filePath);
        
        // Check if the file exists
        const fileExists = await RNFS.exists(invoiceModal.filePath);
        if (!fileExists) {
          throw new Error('Invoice file not found');
        }

        // Use react-native-print to print the PDF
        try {
          const printOptions = {
            html: '', // We're printing a PDF file, not HTML
            filePath: invoiceModal.filePath,
            fileName: `Invoice_LP${orderId}`,
            jobName: `Invoice LP${orderId}`,
            printerURL: '', // Let user select printer
            orientation: 'portrait',
            paperSize: 'A4',
            base64: false,
            width: 595, // A4 width in points
            height: 842, // A4 height in points
            padding: {
              top: 10,
              right: 10,
              bottom: 10,
              left: 10
            }
          };

          console.log('[PRINT] Printing with options:', printOptions);
          
          // Print the PDF file
          await RNPrint.print(printOptions);
          
          console.log('[PRINT] Print job sent successfully');
          showAlert('Success', 'Print job sent to printer successfully!', 'success');
          
        } catch (printError) {
          console.error('[PRINT] Print error:', printError);
          
          // Fallback: Try printing as HTML content
          try {
            console.log('[PRINT] Trying fallback HTML print method');
            
            // Get the invoice data and generate HTML for printing
            const orderData = await api.request(`/orders/${orderId}/invoice`);
            const htmlContent = InvoiceGenerator.generateInvoiceHTML(orderData);
            
            const htmlPrintOptions = {
              html: htmlContent,
              fileName: `Invoice_LP${orderId}`,
              jobName: `Invoice LP${orderId}`,
              printerURL: '',
              orientation: 'portrait',
              paperSize: 'A4',
              base64: false,
              width: 595,
              height: 842,
              padding: {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
              }
            };
            
            await RNPrint.print(htmlPrintOptions);
            console.log('[PRINT] HTML print job sent successfully');
            showAlert('Success', 'Print job sent to printer successfully!', 'success');
            
          } catch (htmlPrintError) {
            console.error('[PRINT] HTML print also failed:', htmlPrintError);
            throw htmlPrintError;
          }
        }
        
      } else {
        showAlert('Error', 'Please preview the invoice first before printing', 'error');
      }
    } catch (error) {
      console.error('[PRINT] Final print error:', error);
      
      // Last resort: Share with print instructions
      try {
        const Share = require('react-native').Share;
        await Share.share({
          url: `file://${invoiceModal.filePath}`,
          title: `🖨️ PRINT Invoice LP${orderId}`,
          message: `📄 Invoice for order LP${orderId}\n\n🖨️ TO PRINT:\n1. Select "Print" from share options\n2. Or open with PDF viewer and print\n3. Or save to Google Drive and print`
        });
      } catch (shareError) {
        console.error('[PRINT] Share fallback also failed:', shareError);
        showAlert('Error', 'Failed to print invoice. Please try sharing and select print option.', 'error');
      }
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
                <Icon name={getStatusIcon(status)} size={10} color="white" />
                <Text style={styles.statusBadgeText}>{statusLabels[status] || status}</Text>
              </View>
            </View>
            <Text style={styles.orderDate}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              }) : ''}
            </Text>
          </View>

          <View style={styles.orderDetails}>
            <View style={styles.customerInfo}>
              <Icon name="person" size={14} color="#6B7280" />
              <Text style={styles.customerName}>{item.userName}</Text>
            </View>
            {item.deliveryType && (
              <View style={styles.deliveryInfo}>
                <Icon name="local-shipping" size={14} color="#6B7280" />
                <Text style={styles.deliveryType}>{item.deliveryType}</Text>
              </View>
            )}
          </View>

          {/* Admin tracking information */}
          {(item.printedByAdminName || item.processedByAdminName || item.completedByAdminName) && (
            <View style={styles.adminTracking}>
              {item.printedByAdminName && (
                <Text style={styles.adminInfo}>🖨️ Printed by: {item.printedByAdminName}</Text>
              )}
              {item.processedByAdminName && (
                <Text style={styles.adminInfo}>⚙️ Processed by: {item.processedByAdminName}</Text>
              )}
              {item.completedByAdminName && (
                <Text style={styles.adminInfo}>✅ Completed by: {item.completedByAdminName}</Text>
              )}
            </View>
          )}

          {/* ✅ NEW: Delivery tracking information - Show for all orders */}
          {true && (
            <View style={styles.deliveryTracking}>
              <View style={styles.trackingHeader}>
                <Icon name="local-shipping" size={14} color="#3B82F6" />
                <Text style={styles.trackingTitle}>Delivery Status</Text>
                {!trackingData[item.id] && (
                  <TouchableOpacity
                    style={styles.trackButton}
                    onPress={() => fetchTrackingData(item.id)}
                    disabled={loadingTracking[item.id]}
                  >
                    {loadingTracking[item.id] ? (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    ) : (
                      <Text style={styles.trackButtonText}>Track</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              
              {(() => {
                const deliveryStatus = getDeliveryStatus(item.id);
                const pickupInfo = getPickupInfo(item.id);
                
                // If no tracking data is available, show a message based on order status
                if (!deliveryStatus) {
                  const statusMessage = {
                    'PENDING': 'Order is pending - not yet shipped',
                    'PROCESSING': 'Order is being processed - preparing for shipment',
                    'COMPLETED': 'Order completed - ready for pickup/shipment',
                    'OUT_FOR_DELIVERY': 'Order is out for delivery - click Track for details',
                    'DELIVERED': 'Order delivered - click Track for delivery details',
                    'CANCELLED': 'Order cancelled'
                  };
                  
                  return (
                    <View style={styles.trackingDetails}>
                      <Text style={styles.trackingStatus}>
                        📦 {statusMessage[item.status] || 'Order status unknown'}
                      </Text>
                      {(item.status === 'OUT_FOR_DELIVERY' || item.status === 'DELIVERED' || item.status === 'COMPLETED') && (
                        <Text style={styles.trackingLocation}>
                          Click "Track" to fetch detailed delivery status
                        </Text>
                      )}
                    </View>
                  );
                }
                
                return (
                  <View style={styles.trackingDetails}>
                    {deliveryStatus.currentStatus && deliveryStatus.currentStatus !== 'Unknown' && (
                      <Text style={styles.trackingStatus}>
                        📦 Status: {deliveryStatus.currentStatus}
                      </Text>
                    )}
                    {deliveryStatus.lastLocation && deliveryStatus.lastLocation !== 'Not available' && (
                      <Text style={styles.trackingLocation}>
                        📍 Last Location: {deliveryStatus.lastLocation}
                      </Text>
                    )}
                    {deliveryStatus.expectedDelivery && deliveryStatus.expectedDelivery !== 'Not available' && (
                      <Text style={styles.trackingExpected}>
                        📅 Expected: {deliveryStatus.expectedDelivery}
                      </Text>
                    )}
                    {deliveryStatus.deliveredDate && (
                      <Text style={styles.trackingDelivered}>
                        ✅ Delivered: {deliveryStatus.deliveredDate}
                      </Text>
                    )}
                    {deliveryStatus.courierName && deliveryStatus.courierName !== 'Not available' && (
                      <Text style={styles.trackingCourier}>
                        🚚 Courier: {deliveryStatus.courierName}
                      </Text>
                    )}
                    {deliveryStatus.awbNumber && deliveryStatus.awbNumber !== 'Not available' && (
                      <Text style={styles.trackingAwb}>
                        🏷️ AWB: {deliveryStatus.awbNumber}
                      </Text>
                    )}
                    
                    {/* Pickup information */}
                    {pickupInfo && (
                      <View style={styles.pickupInfo}>
                        <Text style={styles.pickupTitle}>📦 Pickup Details:</Text>
                        <Text style={styles.pickupDate}>
                          📅 {pickupInfo.date}
                        </Text>
                        {pickupInfo.location && (
                          <Text style={styles.pickupLocation}>
                            📍 {pickupInfo.location}
                          </Text>
                        )}
                        <Text style={styles.pickupDescription}>
                          {pickupInfo.description}
                        </Text>
                        {pickupInfo.courier && (
                          <Text style={styles.pickupCourier}>
                            🚚 {pickupInfo.courier}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
          )}

          <View style={styles.orderStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{item.totalAmount?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.statItem}>
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
                <Icon name="visibility" size={16} color="#6B7280" />
              )}
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
                  <Icon name={status === 'PENDING' ? 'autorenew' : 'check-circle'} size={16} color="white" />
                )}
              </TouchableOpacity>
            )}

            {status === 'COMPLETED' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.statusActionButton, { backgroundColor: '#FBC02D' }]}
                onPress={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'OUT_FOR_DELIVERY'); }}
              >
                <Icon name="local-shipping" size={16} color="white" />
              </TouchableOpacity>
            )}

            {status === 'OUT_FOR_DELIVERY' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.statusActionButton, { backgroundColor: '#66BB6A' }]}
                onPress={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'DELIVERED'); }}
              >
                <Icon name="done-all" size={16} color="white" />
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
      {['all', 'PENDING', 'PROCESSING', 'COMPLETED', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((tab) => (
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
              <Icon name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Orders</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerActionButton} 
                onPress={() => {
                  showAlert('Info', 'Please wait for orders to load first', 'info');
                }}
              >
                <Icon name="track-changes" size={18} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.refreshButton} onPress={() => fetchOrders(true)}>
                <Icon name="refresh" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <LottieView source={LoadingAnim} autoPlay loop style={{ width: 80, height: 80 }} />
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
            <Icon name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Orders</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerActionButton} 
              onPress={() => {
                // Track all orders that don't have tracking data yet
                const trackableOrders = orders.filter(order => 
                  !trackingData[order.id] && !loadingTracking[order.id]
                );
                trackableOrders.forEach(order => {
                  fetchTrackingData(order.id);
                });
                showAlert('Info', `Tracking initiated for ${trackableOrders.length} orders`, 'info');
              }}
            >
              <Icon name="track-changes" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshButton} onPress={() => fetchOrders(true)}>
              <Icon name="refresh" size={20} color="white" />
            </TouchableOpacity>
          </View>
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
          <Icon name="search" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summaryStats.totalOrders}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
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
            <Text style={styles.summaryValue}>{Object.keys(trackingData).length}</Text>
            <Text style={styles.summaryLabel}>Tracked</Text>
          </View>
        </View>

        {renderStatusFilter()}

        <View style={styles.sortFilterContainer}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setDateSort(dateSort === 'desc' ? 'asc' : 'desc')}
          >
            <Icon name="event" size={14} color="#6B7280" />
            <Text style={styles.sortButtonText}>
              {dateSort === 'desc' ? 'Newest' : 'Oldest'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setPriceSort(priceSort === 'none' ? 'desc' : priceSort === 'desc' ? 'asc' : 'none')}
          >
            <Icon name="payments" size={14} color="#6B7280" />
            <Text style={styles.sortButtonText}>
              {priceSort === 'none' ? 'Price' : priceSort === 'desc' ? 'High → Low' : 'Low → High'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ordersList}>
          {error ? (
            <View style={styles.emptyContainer}>
              <Icon name="error" size={48} color="#EF4444" />
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : getFilteredSortedOrders().length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No orders found</Text>
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
        <Icon name="add" size={20} color="white" />
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
              <Icon name="close" size={20} color="#6B7280" />
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
                <Icon name="error" size={32} color="#EF4444" />
                <Text style={styles.pdfPlaceholderText}>Failed to load invoice</Text>
              </View>
            )}
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => handlePrintInvoice(invoiceModal.orderId)}
            >
              <Icon name="print" size={16} color="white" />
              <Text style={styles.modalButtonText}>Print</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={async () => {
                if (invoiceModal.filePath) {
                  try {
                    const Share = require('react-native').Share;
                    await Share.share({
                      url: `file://${invoiceModal.filePath}`,
                      title: `📤 SHARE Invoice LP${invoiceModal.orderId}`,
                      message: `📄 Invoice for order LP${invoiceModal.orderId}\n\n📤 Share this invoice via email, messaging, or cloud storage`
                    });
                  } catch (error) {
                    console.error('Share error:', error);
                    showAlert('Error', 'Failed to share invoice', 'error');
                  }
                }
              }}
            >
              <Icon name="share" size={16} color="white" />
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
    paddingTop: 30,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionButton: {
    padding: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  statusFilter: {
    marginBottom: 8,
  },
  statusFilterContent: {
    paddingRight: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 1,
  },
  sortFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    flex: 1,
    marginHorizontal: 4,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 4,
  },
  ordersList: {
    paddingBottom: 16,
  },
  orderCard: {
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    backgroundColor: '#fff',
  },
  highlightedCard: {
    borderWidth: 1,
    borderColor: '#FBBF24',
    backgroundColor: '#FFFBEB',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 6,
  },
  orderDate: {
    fontSize: 10,
    color: '#6B7280',
  },
  orderDetails: {
    marginBottom: 6,
  },
  adminTracking: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  adminInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 6,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryType: {
    fontSize: 11,
    color: '#4B5563',
    marginLeft: 6,
  },
  orderStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    paddingVertical: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusActionButton: {
    backgroundColor: '#3B82F6',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    color: '#4B5563',
  },
  clearSearchButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  clearSearchText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  loadMoreButton: {
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginTop: 8,
  },
  loadMoreText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 2,
  },
  pdfPreview: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
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
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // ✅ NEW: Delivery tracking styles
  deliveryTracking: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  trackingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginLeft: 4,
    flex: 1,
  },
  trackButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  trackButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  trackingDetails: {
    gap: 2,
  },
  trackingStatus: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: '600',
  },
  trackingLocation: {
    fontSize: 10,
    color: '#6B7280',
  },
  trackingExpected: {
    fontSize: 10,
    color: '#059669',
  },
  trackingDelivered: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  trackingCourier: {
    fontSize: 10,
    color: '#7C3AED',
  },
  trackingAwb: {
    fontSize: 10,
    color: '#DC2626',
    fontFamily: 'monospace',
  },
  pickupInfo: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    padding: 6,
    marginTop: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#F59E0B',
  },
  pickupTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 2,
  },
  pickupDate: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600',
  },
  pickupLocation: {
    fontSize: 10,
    color: '#B45309',
  },
  pickupDescription: {
    fontSize: 10,
    color: '#92400E',
    fontStyle: 'italic',
  },
  pickupCourier: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600',
  },
});