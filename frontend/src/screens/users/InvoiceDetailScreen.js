import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Share } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNBlobUtil from 'react-native-blob-util';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import LipiPrintLogo from '../../assets/logo/LipiPrintLogo.png';
import CustomAlert from '../../components/CustomAlert';
import { useTheme } from '../../theme/ThemeContext';
import Pdf from 'react-native-pdf';
import Heading from '../../components/Heading';

export default function InvoiceDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId, showPdf } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [alertOnConfirm, setAlertOnConfirm] = useState(null);
  const [alertShowCancel, setAlertShowCancel] = useState(false);
  const { theme } = useTheme();
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfLoadStart, setPdfLoadStart] = useState(Date.now());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        console.log('[InvoiceDetailScreen] orderId:', orderId);
        const apiUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://10.142.175.104:8082/'}api/orders/${orderId}`;
        console.log('[InvoiceDetailScreen] API URL:', apiUrl);
        const token = await AsyncStorage.getItem('authToken');
        console.log('[InvoiceDetailScreen] token:', token);
        if (!token) {
          setError('Not authenticated. Please log in again.');
          return;
        }
        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('[InvoiceDetailScreen] fetch status:', res.status);
        const text = await res.text();
        console.log('[InvoiceDetailScreen] fetch response text:', text);
        if (!text) throw new Error('Empty response from server');
        let data;
        try {
          data = JSON.parse(text);
        } catch (jsonErr) {
          console.log('[InvoiceDetailScreen] JSON parse error:', jsonErr);
          throw new Error('Invalid response from server');
        }
        console.log('[InvoiceDetailScreen] order data:', data);
        setOrder(data);
      } catch (e) {
        console.log('[InvoiceDetailScreen] fetch error:', e);
        setError('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const { dirs } = RNBlobUtil.fs;
      const path = `${dirs.DownloadDir}/invoice-${orderId}.pdf`;
      const apiUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://10.142.175.104:8082/'}api/orders/${orderId}/invoice`;
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setDownloading(false);
        showAlert('Not authenticated', 'Please log in again.', 'error');
        return;
      }
      await RNBlobUtil.config({
        path,
        fileCache: true,
        appendExt: 'pdf',
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: `invoice-${orderId}.pdf`,
          description: 'Invoice PDF',
          mime: 'application/pdf',
          mediaScannable: true,
        },
      }).fetch('GET', apiUrl, {
        Authorization: `Bearer ${token}`,
      });
      setDownloading(false);
      showAlert('Download Complete', `Invoice saved to Downloads as invoice-${orderId}.pdf`, 'success');
    } catch (e) {
      setDownloading(false);
      showAlert('Download Failed', 'Could not download invoice PDF.', 'error');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `LipiPrint Invoice\nOrder ID: LP${order.id}\nTotal: INR ${grandTotal}`
      });
    } catch (e) {
      showAlert('Share Failed', 'Could not share invoice.', 'error');
    }
  };

  const showAlert = (title, message, type = 'info', onConfirm = null, showCancel = false) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertOnConfirm(() => onConfirm);
    setAlertShowCancel(showCancel);
    setAlertVisible(true);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#667eea" /><Text>Loading invoice...</Text></View>;
  if (error) return <View style={styles.center}><Text>{error}</Text></View>;
  if (!order) return <View style={styles.center}><Text>No invoice data</Text></View>;

  const { user, status, createdAt } = order;
  const gstRate = 0.18;
  const deliveryCharge = order.deliveryCharge || 0;
  const subtotal = order.totalAmount ? (order.totalAmount / (1 + gstRate)).toFixed(2) : '0.00';
  const gst = order.totalAmount ? (parseFloat(subtotal) * gstRate).toFixed(2) : '0.00';
  const grandTotal = order.totalAmount ? (parseFloat(subtotal) + parseFloat(gst) + parseFloat(deliveryCharge)).toFixed(2) : '0.00';

  const invoiceUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://10.142.175.104:8082/'}api/orders/${orderId}/invoice`;

  // Utility to get display file name
  const getDisplayFileName = (file) => {
    if (!file) return '-';
    let name = file.originalFilename || file.filename || '-';
    try {
      name = decodeURIComponent(name);
    } catch (e) {
      name = name.replace(/%20/g, ' ');
    }
    return name;
  };

  if (showPdf) {
    // Minimum spinner time logic
    const handlePdfLoadComplete = () => {
      const elapsed = Date.now() - pdfLoadStart;
      if (elapsed < 500) {
        setTimeout(() => setPdfLoading(false), 500 - elapsed);
      } else {
        setPdfLoading(false);
      }
    };
    return (
      <View style={{ flex: 1 }}>
        <Pdf
          source={{ uri: invoiceUrl, cache: true }}
          style={{ flex: 1 }}
          onLoadComplete={handlePdfLoadComplete}
          onError={error => { setPdfLoading(false); console.log('PDF error:', error); }}
        />
        {pdfLoading && (
          <View style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(255,255,255,0.8)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={{ marginTop: 12 }}>Generating invoice PDF...</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ padding: 0 }}>
      <LinearGradient
        colors={['#22194f', '#22194f']}
        style={styles.gradientHeader}
      >
        <Heading
          title="Invoice Details"
          variant="primary"
        />
      </LinearGradient>
      {/* <View style={styles.logoContainer}>
        <Image source={LipiPrintLogo} style={styles.logo} resizeMode="contain" />
      </View> */}
      <View style={styles.invoiceBox}>
        <Text style={styles.invoiceTitle}>LipiPrint Invoice</Text>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Icon name="receipt" size={18} color="#764ba2" style={styles.infoIcon} />
          <Text style={styles.invoiceInfo}>Order ID: LP{order.id}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="event" size={18} color="#764ba2" style={styles.infoIcon} />
          <Text style={styles.invoiceInfo}>Date: {createdAt.split('T')[0]}</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="person" size={18} color="#667eea" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Customer Info</Text>
          </View>
          <Text>Name: {user?.name || '-'}</Text>
          <Text>Phone: {user?.phone || '-'}</Text>
          <Text>Email: {user?.email || '-'}</Text>
        </View>
        <View style={[styles.section, styles.sectionHighlight]}>
          <View style={styles.sectionHeader}>
            <Icon name="description" size={18} color="#667eea" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Print Jobs</Text>
          </View>
          {order.printJobs && order.printJobs.length > 0 ? (
            order.printJobs.map((pj, idx) => (
              <View key={pj.id || idx} style={{ marginBottom: 10 }}>
                <Text style={{ fontWeight: 'bold', color: '#764ba2' }}>File: {getDisplayFileName(pj.file)}</Text>
                <Text>Pages: {pj.file?.pages || '-'}</Text>
                <Text>Ordered On: {pj.file?.createdAt?.split('T')[0] || '-'}</Text>
                {/* Print Specifications */}
                {pj.options && (() => {
                  let specs;
                  try {
                    specs = typeof pj.options === 'string' ? JSON.parse(pj.options) : pj.options;
                  } catch (e) {
                    return <Text style={{ color: 'red' }}>Print Specs: [Invalid format]</Text>;
                  }
                  return Object.keys(specs).length > 0 ? (
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontWeight: 'bold', color: '#667eea', marginBottom: 2 }}>Print Specifications:</Text>
                      {Object.entries(specs).map(([key, value]) => (
                        <Text key={key} style={{ marginLeft: 8 }}>
                          {key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())}: {String(value)}
                        </Text>
                      ))}
                    </View>
                  ) : null;
                })()}
              </View>
            ))
          ) : (
            <Text>No print jobs found.</Text>
          )}
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="table-chart" size={18} color="#667eea" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeader]}>File</Text>
            <Text style={[styles.tableCell, styles.tableHeader]}>Pages</Text>
          </View>
          {order.printJobs && order.printJobs.length > 0 ? (
            order.printJobs.map((pj, idx) => (
              <View key={pj.id || idx} style={styles.tableRow}>
                <Text style={styles.tableCell}>{getDisplayFileName(pj.file)}</Text>
                <Text style={styles.tableCell}>{pj.file?.pages || '-'}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>-</Text>
              <Text style={styles.tableCell}>-</Text>
            </View>
          )}
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal (Before GST)</Text>
              <Text style={styles.priceValue}>INR {subtotal}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceValue}>INR {gst}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery</Text>
              <Text style={styles.priceValue}>INR {deliveryCharge}</Text>
            </View>
            <View style={styles.priceRowDivider} />
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, styles.grandTotal]}>Grand Total</Text>
              <Text style={[styles.priceValue, styles.grandTotal]}>INR {grandTotal}</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="info" size={18} color="#667eea" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Order Status</Text>
          </View>
          <Text>{status}</Text>
        </View>
        <View style={styles.thankYouBox}>
          <Text style={styles.thankYouText}>Thank you for choosing LipiPrint!</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} activeOpacity={0.85} disabled={downloading}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.downloadGradient}>
          <Icon name="file-download" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.downloadText}>{downloading ? 'Downloading...' : 'Download PDF'}</Text>
        </LinearGradient>
      </TouchableOpacity>
      {downloading && (
        <View style={styles.downloadOverlay}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={{ marginTop: 14, color: '#667eea', fontWeight: 'bold', fontSize: 16 }}>Downloading PDF...</Text>
        </View>
      )}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertOnConfirm}
        showCancel={alertShowCancel}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center' 
  },
  gradientHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
   },

  header: {     flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop:-30
 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight:10
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'left' },
  shareBtn: { padding: 8 },
  logoContainer: { alignItems: 'center', marginBottom: 8 },
  logo: { width: 120, height: 60, marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#764ba2', marginVertical: 8, opacity: 0.2 },
  invoiceBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginHorizontal: 8, marginBottom: 24, elevation: 4, shadowColor: '#764ba2', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  invoiceTitle: { fontSize: 22, fontWeight: 'bold', color: '#764ba2', marginBottom: 8, textAlign: 'center' },
  invoiceInfo: { fontSize: 14, color: '#333', marginBottom: 2, textAlign: 'left' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  infoIcon: { marginRight: 6 },
  section: { marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sectionIcon: { marginRight: 6 },
  sectionTitle: { fontWeight: 'bold', color: '#667eea', fontSize: 16 },
  sectionHighlight: { backgroundColor: '#f0f4ff', borderRadius: 8, padding: 10 },
  tableRow: { flexDirection: 'row', marginBottom: 2 },
  tableCell: { flex: 1, fontSize: 14, color: '#333', padding: 2 },
  tableHeader: { fontWeight: 'bold', color: '#764ba2' },
  downloadBtn: { marginTop: 8, borderRadius: 8, overflow: 'hidden', marginHorizontal: 8, marginBottom:50 },
  downloadGradient: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 8, justifyContent: 'center' },
  downloadText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  priceLabel: { fontWeight: 'bold', color: '#667eea' },
  priceValue: { fontWeight: 'bold', color: '#333' },
  grandTotal: { color: '#764ba2', fontSize: 16 },
  thankYouBox: { backgroundColor: '#e0e7ff', borderRadius: 8, padding: 10, marginTop: 16 },
  thankYouText: { color: '#667eea', fontWeight: 'bold', textAlign: 'center' },
  container: { flex: 1 },
  downloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  priceCard: { backgroundColor: '#f0f4ff', borderRadius: 10, padding: 14, marginTop: 10, marginBottom: 4, elevation: 2 },
  priceRowDivider: { height: 1, backgroundColor: '#d1d5db', marginVertical: 8, opacity: 0.5 },
}); 