import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Linking, Alert, ActivityIndicator, TextInput, Platform } from 'react-native';
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
    PENDING: '#FF9800',
    PROCESSING: '#1976D2',
    COMPLETED: '#43B581',
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

  // Copy buildInvoiceHtml and groupPrintJobsByOptions from InvoiceDetailScreen.js
  function buildInvoiceHtml(order, printJobGroups) {
    const companyName = 'NAGPAL PRINT HOUSE';
    const companyAddress = 'Near Civil Court Sadar Thana Road, Saharanpur';
    const companyGSTIN = '09AJ0PN3715E1Z3';
    const companyEmail = 'support@lipiprint.in';
    const companyPhone = '+91 12345 67890';
    const invoiceNo = order.id ? `LP${order.id}` : '-';
    const invoiceDate = order.createdAt ? order.createdAt.split('T')[0] : '-';
    const customerName = order.user?.name || '-';
    const customerAddress = order.deliveryAddress || '-';
    const customerEmail = order.user?.email || '-';
    const customerPhone = order.user?.phone || '-';
    const customerGSTIN = order.user?.gstin || '-';
    const printDate = new Date().toLocaleString();
    const groupedJobs = {};
    if (order.printJobs && order.printJobs.length > 0) {
      order.printJobs.forEach((pj) => {
        let opts = {};
        try {
          opts = typeof pj.options === 'string' ? JSON.parse(pj.options) : pj.options;
        } catch {}
        const key = JSON.stringify({
          color: opts.color || '',
          paper: opts.paper || '',
          quality: opts.quality || '',
          side: opts.side || '',
          binding: opts.binding || '',
        });
        if (!groupedJobs[key]) {
          groupedJobs[key] = {
            files: [],
            totalPages: 0,
            printOptions: opts,
          };
        }
        groupedJobs[key].files.push(pj.file);
        groupedJobs[key].totalPages += pj.file?.pages || 1;
      });
    }
    const breakdown = order.breakdown || [];
    let sNo = 1;
    let orderItemsRows = '';
    breakdown.forEach(item => {
      orderItemsRows += `
      <tr>
        <td style='padding:6px 4px;text-align:center;'>${sNo++}</td>
        <td style='padding:6px 4px;'>${item.description}</td>
        <td style='padding:6px 4px;text-align:center;'>${item.quantity}</td>
        <td style='padding:6px 4px;text-align:center;'>${item.hsn}</td>
        <td style='padding:6px 4px;text-align:right;'>${item.rate.toFixed(2)}</td>
        <td style='padding:6px 4px;text-align:right;'>${item.amount.toFixed(2)}</td>
        <td style='padding:6px 4px;text-align:right;'>${item.discount.toFixed(2)}</td>
        <td style='padding:6px 4px;text-align:right;'>${item.total.toFixed(2)}</td>
      </tr>
      <tr>
        <td></td>
        <td colspan='7' style='font-size:13px;color:#555;padding-bottom:8px;'>${item.printOptions || ''}</td>
      </tr>
    `;
    });
    const summarySubtotal = order.subtotal !== undefined && order.subtotal !== null ? order.subtotal.toFixed(2) : '0.00';
    const summaryDiscount = order.discount !== undefined && order.discount !== null ? order.discount.toFixed(2) : '0.00';
    const summaryDiscountedSubtotal = order.discountedSubtotal !== undefined && order.discountedSubtotal !== null ? order.discountedSubtotal.toFixed(2) : '0.00';
    const summaryGST = order.gst !== undefined && order.gst !== null ? order.gst.toFixed(2) : '0.00';
    const summaryDelivery = order.delivery !== undefined && order.delivery !== null ? order.delivery.toFixed(2) : '0.00';
    const summaryGrandTotal = order.grandTotal !== undefined && order.grandTotal !== null ? order.grandTotal.toFixed(2) : '0.00';
    return `
    <!DOCTYPE html>
    <html lang='en'>
    <head>
      <meta charset='UTF-8' />
      <title>Invoice - LipiPrint</title>
      <style>
        body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f7f9fb; color: #222; }
        .container { max-width: 800px; margin: 0px auto 0px auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px #0001; padding: 36px 32px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .company-info { font-size: 15px; line-height: 1.6; margin-top: 10px; color: #555; }
        .invoice-meta { text-align: right; font-size: 15px; }
        .invoice-title { font-size: 28px; font-weight: 700; color: #2d6cdf; margin-bottom: 8px; letter-spacing: 1px; }
        .section { margin-top: 28px; }
        .section-title { font-size: 18px; font-weight: 600; color: #4a4a4a; margin-bottom: 12px; letter-spacing: 0.5px; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 4px 0; font-size: 15px; }
        .order-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .order-table th, .order-table td { border: 1px solid #e0e0e0; }
        .order-table th { background: #f0f4ff; color: #22194f; font-size: 15px; font-weight: 700; padding: 8px 4px; }
        .order-table td { font-size: 15px; color: #333; padding: 6px 4px; }
        .totals { margin-top: 18px; width: 100%; border-collapse: collapse; }
        .totals td { font-size: 16px; padding: 8px 0; }
        .totals .label { text-align: right; color: #666; font-weight: 600; }
        .totals .value { text-align: right; font-weight: 700; }
        .grand-total { font-size: 20px; color: #2d6cdf; font-weight: 700; border-top: 2px solid #eee; padding-top: 10px; }
        .footer { margin-top: 40px; text-align: center; color: #888; font-size: 14px; border-top: 1px solid #eee; padding-top: 16px; background: #fff; }
        .highlight { background: #eaf6ff; border-radius: 8px; padding: 12px 10px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
    <div class='container'>
      <div class='header'>
        <div>
          <div class='company-info'>
            <b>${companyName}</b><br />
            ${companyAddress}<br />
            <b>GSTIN:</b> ${companyGSTIN}<br />
            ${companyEmail} | ${companyPhone}
          </div>
        </div>
        <div class='invoice-meta'>
          <div class='invoice-title'>INVOICE</div>
          <div>Invoice No.: <b>${invoiceNo}</b></div>
          <div>Date: <b>${invoiceDate}</b></div>
        </div>
      </div>
      <div class='section'>
        <div class='section-title'>Bill To</div>
        <table class='info-table'>
          <tr><td><b>Name:</b></td><td>${customerName}</td></tr>
          <tr><td><b>Email:</b></td><td>${customerEmail}</td></tr>
          <tr><td><b>Phone:</b></td><td>${customerPhone}</td></tr>
          <tr><td><b>Address:</b></td><td>${customerAddress}</td></tr>
          <tr><td><b>GSTIN:</b></td><td>${customerGSTIN}</td></tr>
        </table>
      </div>
      <div class='section'>
        <div class='section-title'>Order Items</div>
        <table class='order-table'>
          <tr>
            <th>S.No</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>HSN</th>
            <th>Rate</th>
            <th>Amount</th>
            <th>Discount</th>
            <th>Total</th>
          </tr>
          ${orderItemsRows}
        </table>
        <div style='font-size:13px;color:#888;margin-top:8px;'>All prices are backend-calculated for accuracy. See summary below.</div>
      </div>
      <div class='section'>
        <div class='section-title'>Summary</div>
        <table class='totals'>
          <tr><td class='label'>Subtotal</td><td class='value'>INR ${summarySubtotal}</td></tr>
          <tr><td class='label'>Discount</td><td class='value'>INR ${summaryDiscount}</td></tr>
          <tr><td class='label'>Subtotal (After Discount)</td><td class='value'>INR ${summaryDiscountedSubtotal}</td></tr>
          <tr><td class='label'>GST</td><td class='value'>INR ${summaryGST}</td></tr>
          <tr><td class='label'>Delivery</td><td class='value'>INR ${summaryDelivery}</td></tr>
          <tr><td class='label grand-total'>Grand Total</td><td class='value grand-total'>INR ${summaryGrandTotal}</td></tr>
        </table>
      </div>
      <div class='footer'>
        All subject to Saharanpur Jurisdiction only<br>
        Our responsibility ceases the moment the goods leave from office.<br>
        Certified that particulars given above are true and correct.<br>
        This is computer generated invoice. Printed on ${printDate}
      </div>
    </div>
    </body>
    </html>
  `;
  }

  function groupPrintJobsByOptions(printJobs) {
    if (!printJobs) return [];
    const groups = [];
    const seen = new Map();
    printJobs.forEach(pj => {
      let optionsKey = '';
      try {
        const opts = typeof pj.options === 'string' ? JSON.parse(pj.options) : pj.options;
        optionsKey = JSON.stringify(opts, Object.keys(opts).sort());
      } catch {
        optionsKey = String(pj.options);
      }
      if (!seen.has(optionsKey)) {
        seen.set(optionsKey, { options: pj.options, files: [pj.file], createdAts: [pj.file?.createdAt] });
      } else {
        const group = seen.get(optionsKey);
        group.files.push(pj.file);
        group.createdAts.push(pj.file?.createdAt);
      }
    });
    return Array.from(seen.values());
  }

  const handleAdminDownloadInvoice = async (orderId) => {
    setDownloadingInvoiceId(orderId);
    try {
      // Fetch order details
      const order = await api.getOrder(orderId);
      // Group print jobs
      const printJobGroups = groupPrintJobsByOptions(order.printJobs);
      // Build invoice HTML
      const html = buildInvoiceHtml(order, printJobGroups);
      // Request storage permission if needed (Android < 11)
      let granted = true;
      if (Platform.OS === 'android' && Platform.Version < 30) {
        granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to save the invoice PDF.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        ) === PermissionsAndroid.RESULTS.GRANTED;
      }
      if (!granted) {
        setDownloadingInvoiceId(null);
        showAlert('Permission Denied', 'Cannot save PDF without storage permission.', 'error');
        return;
      }
      // Generate PDF to temp path
      const tempFile = await RNHTMLtoPDF.convert({
        html,
        fileName: `invoice-${order.id}`,
        directory: 'Documents',
        base64: false,
      });
      // Move to Downloads
      let destPath = '';
      if (Platform.OS === 'android' && RNFS.DownloadDirectoryPath) {
        destPath = `${RNFS.DownloadDirectoryPath}/invoice-${order.id}.pdf`;
      } else {
        destPath = `${RNFS.DocumentDirectoryPath}/invoice-${order.id}.pdf`;
      }
      await RNFS.moveFile(tempFile.filePath, destPath);
      setDownloadingInvoiceId(null);
      setInvoiceModal({ visible: true, filePath: destPath, orderId });
      showAlert('Download Complete', `Invoice saved at:\n${destPath}`, 'success');
    } catch (e) {
      setDownloadingInvoiceId(null);
      showAlert('Download Failed', 'Could not generate invoice PDF.', 'error');
    }
  };

  const handlePreviewInvoice = () => {
    setInvoiceModal(modal => ({ ...modal, preview: true }));
  };
  const handlePrintInvoice = async () => {
    if (invoiceModal.filePath) {
      await RNPrint.print({ filePath: invoiceModal.filePath });
    }
  };
  const handleOpenInFolder = () => {
    if (Platform.OS === 'android') {
      Linking.openURL('file://' + RNFS.DownloadDirectoryPath);
    } else {
      Linking.openURL('file://' + RNFS.DocumentDirectoryPath);
    }
  };

  // In renderOrderCard, update to use OrderListDTO fields
  const renderOrderCard = ({ item, index }) => {
    // item: { id, userName, status, totalAmount, createdAt, deliveryType }
    const status = (item.status || '').toUpperCase();
    const statusColor = statusColors[status] || '#9E9E9E';
    const isHighlighted = item.id === lastUpdatedOrderId;
    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 40}
        duration={350}
        style={{
          backgroundColor: isHighlighted ? '#fffbe6' : '#fff',
          borderRadius: 18,
          padding: 20,
          marginBottom: 18,
          shadowColor: '#667eea',
          shadowOpacity: 0.10,
          shadowRadius: 8,
          elevation: 4,
          borderLeftWidth: 5,
          borderLeftColor: statusColor,
          borderWidth: isHighlighted ? 2 : 0,
          borderColor: isHighlighted ? '#ffd700' : 'transparent',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#22194f', flex: 1 }}>Order #{item.id}</Text>
          <View style={{ backgroundColor: statusColor, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{statusLabels[status] || status}</Text>
              </View>
            </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Icon name="person" size={16} color="#667eea" style={{ marginRight: 4 }} />
          <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 15 }}>{item.userName}</Text>
          {item.deliveryType && (
            <Text style={{ color: '#888', fontSize: 13, marginLeft: 10 }}>({item.deliveryType})</Text>
                )}
              </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Icon name="event" size={15} color="#764ba2" style={{ marginRight: 4 }} />
          <Text style={{ color: '#888', fontSize: 13 }}>{item.createdAt ? String(item.createdAt).slice(0, 10) : ''}</Text>
          <Icon name="" size={15} color="#43B581" style={{ marginLeft: 16, marginRight: 2 }} />
          <Text style={{ color: '#22194f', fontWeight: 'bold', fontSize: 15 }}>₹{item.totalAmount}</Text>
            </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginTop: 10 }}>
                <TouchableOpacity
            style={{
              backgroundColor: '#667eea',
              borderRadius: 8,
              paddingVertical: 7,
              paddingHorizontal: 16,
              marginRight: 10,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('AdminOrderDetailScreen', { orderId: item.id })}
                    activeOpacity={0.85}
                >
            <Icon name="info" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
            style={{
              backgroundColor: '#43B581',
              borderRadius: 8,
              paddingVertical: 7,
              paddingHorizontal: 16,
              marginRight: 10,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => handleAdminDownloadInvoice(item.id)}
            disabled={downloadingInvoiceId === item.id}
                    activeOpacity={0.85}
                >
            <Icon name="file-download" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{downloadingInvoiceId === item.id ? 'Downloading...' : 'Invoice'}</Text>
                </TouchableOpacity>
          {(status === 'PENDING' || status === 'PROCESSING') && (
            <TouchableOpacity
              style={{
                backgroundColor: '#FBC02D',
                borderRadius: 8,
                paddingVertical: 7,
                paddingHorizontal: 16,
                marginRight: 10,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={() => handleUpdateStatus(item.id, status === 'PENDING' ? 'PROCESSING' : 'COMPLETED')}
              activeOpacity={0.85}
            >
              <Icon name={status === 'PENDING' ? 'autorenew' : 'check-circle'} size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{status === 'PENDING' ? 'Start Processing' : 'Complete'}</Text>
        </TouchableOpacity>
          )}
        </View>
      </Animatable.View>
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

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f9fb' }}>
      {/* Sticky Gradient Header */}
      <LinearGradient
        colors={["#22194f", "#667eea"]}
        style={{ paddingTop: 48, paddingBottom: 18, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 6 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 22, color: '#fff', fontWeight: 'bold', marginLeft: 0, letterSpacing: 0.5 }}>
            Manage Orders
          </Text>
          <TouchableOpacity onPress={() => fetchOrders(true)} style={{ padding: 6 }}>
            <Icon name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
        {/* Sticky Search Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginTop: 18, paddingHorizontal: 12, paddingVertical: 6, elevation: 2 }}>
          <Icon name="search" size={20} color="#667eea" style={{ marginRight: 6 }} />
        <TextInput
            style={{ flex: 1, fontSize: 16, color: '#222', paddingVertical: 6 }}
            placeholder="Search by user, file, or date..."
            placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
            clearButtonMode="while-editing"
        />
        {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ marginLeft: 4 }}>
            <Icon name="close" size={18} color="#667eea" />
          </TouchableOpacity>
        )}
        </View>
        {/* Horizontal Status Tab Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16, paddingHorizontal: 0, marginHorizontal: 0 }} contentContainerStyle={{ paddingBottom: 2, paddingHorizontal: 0, marginHorizontal: 0 }}>
          {['all', 'PENDING', 'PROCESSING', 'COMPLETED', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((tab, idx, arr) => (
            <TouchableOpacity
              key={tab}
              style={{
                backgroundColor: statusFilter === tab ? '#fff' : 'rgba(255,255,255,0.15)',
                borderRadius: 18,
                paddingHorizontal: 18,
                paddingVertical: 8,
                marginLeft: idx === 0 ? 0 : 10,
                marginRight: idx === arr.length - 1 ? 0 : 10,
                elevation: statusFilter === tab ? 2 : 0,
                borderWidth: statusFilter === tab ? 1.5 : 0,
                borderColor: statusFilter === tab ? '#667eea' : 'transparent',
              }}
              onPress={() => setStatusFilter(tab)}
              activeOpacity={0.85}
            >
              <Text style={{ color: statusFilter === tab ? '#22194f' : '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.2 }}>
                {tab === 'all' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Date/Price Filter Row (new line) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 2, paddingLeft: 2 }}>
          <Icon name="event" size={18} color="#667eea" style={{ marginRight: 2 }} />
          <TouchableOpacity
            style={{ backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: '#eee' }}
            onPress={() => setDateSort(dateSort === 'desc' ? 'asc' : 'desc')}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#22194f', fontWeight: 'bold', fontSize: 14 }}>
              {dateSort === 'desc' ? 'Newest' : 'Oldest'}
            </Text>
          </TouchableOpacity>
          <Icon name="" size={18} color="#43B581" style={{ marginRight: 2 }} />
              <TouchableOpacity
            style={{ backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#eee' }}
            onPress={() => setPriceSort(priceSort === 'none' ? 'desc' : priceSort === 'desc' ? 'asc' : 'none')}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#22194f', fontWeight: 'bold', fontSize: 14 }}>
              {priceSort === 'none' ? 'Price' : priceSort === 'desc' ? 'High → Low' : 'Low → High'}
                </Text>
              </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Orders List or Loading/Empty State */}
      <View style={{ flex: 1, marginTop: -9, paddingHorizontal: 0 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
            <LottieView source={LoadingAnim} autoPlay loop style={{ width: 120, height: 120 }} />
            <Text style={{ color: '#667eea', fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Loading orders...</Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: '#e53935', fontWeight: 'bold', fontSize: 16 }}>{error}</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
            <LottieView source={LoadingAnim} autoPlay loop style={{ width: 120, height: 120 }} />
            <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>No orders found for this filter.</Text>
          </View>
        ) : (
        <FlatList
            ref={flatListRef}
            data={getFilteredSortedOrders()}
          renderItem={renderOrderCard}
          keyExtractor={item => item.id?.toString()}
            contentContainerStyle={{ padding: 18, paddingTop: 10, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasMore && !loadingMore && !loading) fetchOrders(false);
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={hasMore && loadingMore ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <LottieView source={LoadingAnim} autoPlay loop style={{ width: 60, height: 60 }} />
            </View>
            ) : null}
            getItemLayout={(data, index) => ({ length: 110, offset: 110 * index, index })}
          />
        )}
            </View>
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={closeAlert}
      />
      <Modal isVisible={invoiceModal.visible} onBackdropPress={() => setInvoiceModal({ visible: false, filePath: '', orderId: null })}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Invoice Downloaded</Text>
          <Text style={{ color: '#333', marginBottom: 18, textAlign: 'center' }}>Invoice saved to:
            {'\n'}{invoiceModal.filePath}
          </Text>
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <TouchableOpacity style={{ backgroundColor: '#667eea', borderRadius: 8, padding: 12, marginHorizontal: 6 }} onPress={handlePreviewInvoice}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#43B581', borderRadius: 8, padding: 12, marginHorizontal: 6 }} onPress={handlePrintInvoice}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Print</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#FBC02D', borderRadius: 8, padding: 12, marginHorizontal: 6 }} onPress={handleOpenInFolder}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Open Folder</Text>
            </TouchableOpacity>
          </View>
          {invoiceModal.preview && (
            <View style={{ width: 320, height: 420, marginTop: 10 }}>
              <Pdf source={{ uri: 'file://' + invoiceModal.filePath }} style={{ flex: 1, borderRadius: 8 }} />
            </View>
          )}
          <TouchableOpacity style={{ marginTop: 18 }} onPress={() => setInvoiceModal({ visible: false, filePath: '', orderId: null })}>
            <Text style={{ color: '#667eea', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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