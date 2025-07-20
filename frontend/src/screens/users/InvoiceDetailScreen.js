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
import LottieView from 'lottie-react-native';
import searchForInvoiceAnim from '../../assets/animations/search for invoice.json';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Platform, PermissionsAndroid } from 'react-native';

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
        const apiUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.11:8082/'}api/orders/${orderId}`;
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

  // Helper to build invoice HTML (premium, professional, with public logo URL)
  function buildInvoiceHtml(order, printJobGroups, subtotal, gst, deliveryCharge, grandTotal) {
    // Company and customer info
    const companyName = 'LipiPrint';
    const companyAddress = '123 Printing Street, Saharanpur, Uttar Pradesh, India';
    const companyEmail = 'support@lipiprint.in';
    const companyPhone = '+91 12345 67890';
    // Use backend-served logo for invoice
    const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.11:8082/';
    const logoUrl = apiBase + 'api/files/logo';
    const orderId = order.id;
    const orderDate = order.createdAt ? order.createdAt.split('T')[0] : '-';
    const orderStatus = order.status || '-';
    const deliveryType = order.deliveryType || '-';
    const customerName = order.user?.name || '-';
    const customerEmail = order.user?.email || '-';
    const customerPhone = order.user?.phone || '-';
    const customerAddress = order.deliveryAddress || '-';
    const paidBadge = (orderStatus.toLowerCase() === 'paid' || orderStatus.toLowerCase() === 'completed')
      ? `<span class='badge paid'>PAID</span>`
      : `<span class='badge unpaid'>UNPAID</span>`;
    // Print job groups block
    const printJobGroupsBlock = printJobGroups.map((group, gidx) => {
      let specs;
      try { specs = typeof group.options === 'string' ? JSON.parse(group.options) : group.options; } catch { specs = {}; }
      return `<tr>
        <td style='padding:8px 6px; border-bottom:1px solid #f0f0f0;'>${group.files.map(file => file.originalFilename || file.filename || '-').join('<br>')}</td>
        <td style='padding:8px 6px; border-bottom:1px solid #f0f0f0;'>${Object.entries(specs).map(([key, value]) => `<div><b>${key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())}:</b> ${String(value)}</div>`).join('')}</td>
        <td style='padding:8px 6px; border-bottom:1px solid #f0f0f0;'>${group.files.map(file => file.pages || '-').join('<br>')}</td>
        <td style='padding:8px 6px; border-bottom:1px solid #f0f0f0;'>${group.files.map(file => file.createdAt ? file.createdAt.split('T')[0] : '-').join('<br>')}</td>
      </tr>`;
    }).join('');
    // Order note block
    const orderNoteBlock = order.orderNote ? `<div class='order-note-block'><b>Order Note:</b> ${order.orderNote}</div>` : '';
    // HTML template
    return `
      <!DOCTYPE html>
      <html lang='en'>
      <head>
        <meta charset='UTF-8' />
        <title>Invoice - LipiPrint</title>
        <link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap' rel='stylesheet'>
        <style>
          body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f7f9fb; color: #222; }
          .container { max-width: 720px; margin: 40px auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px #0001; padding: 36px 32px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
          .logo { height: 64px; border-radius: 8px; }
          .company-info { font-size: 15px; line-height: 1.6; margin-top: 10px; color: #555; }
          .invoice-meta { text-align: right; font-size: 15px; }
          .invoice-title { font-size: 32px; font-weight: 700; color: #2d6cdf; margin-bottom: 8px; letter-spacing: 1px; }
          .badge { display: inline-block; padding: 4px 16px; border-radius: 16px; font-size: 14px; font-weight: 600; margin-top: 8px; }
          .badge.paid { background: #e6fbe6; color: #1aaf1a; border: 1px solid #1aaf1a; }
          .badge.unpaid { background: #fff0f0; color: #e74c3c; border: 1px solid #e74c3c; }
          .section { margin-top: 38px; }
          .section-title { font-size: 20px; font-weight: 600; color: #4a4a4a; margin-bottom: 16px; letter-spacing: 0.5px; }
          .info-table { width: 100%; border-collapse: collapse; }
          .info-table td { padding: 4px 0; font-size: 15px; }
          .order-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .order-table th { background: #f0f4ff; color: #22194f; font-size: 15px; font-weight: 700; padding: 10px 6px; border-bottom: 2px solid #e0e7ef; }
          .order-table td { font-size: 15px; color: #333; }
          .order-note-block { background: #fffbe6; border-left: 4px solid #ffe066; border-radius: 8px; padding: 12px 14px; margin-top: 18px; color: #7a5d00; font-size: 15px; }
          .totals { margin-top: 24px; width: 100%; border-collapse: collapse; }
          .totals td { font-size: 16px; padding: 8px 0; }
          .totals .label { text-align: right; color: #666; font-weight: 600; }
          .totals .value { text-align: right; font-weight: 700; }
          .grand-total { font-size: 22px; color: #2d6cdf; font-weight: 700; border-top: 2px solid #eee; padding-top: 12px; }
          .footer { margin-top: 48px; text-align: center; color: #888; font-size: 15px; border-top: 1px solid #eee; padding-top: 18px; letter-spacing: 0.2px; }
          @media (max-width: 800px) { .container { padding: 18px 4vw; } }
        </style>
      </head>
      <body>
      <div class='container'>
        <div class='header'>
          <div>
            <img src='${logoUrl}' alt='LipiPrint Logo' class='logo' />
            <div class='company-info'>
              <b>${companyName}</b><br />
              ${companyAddress}<br />
              ${companyEmail} | ${companyPhone}
            </div>
          </div>
          <div class='invoice-meta'>
            <div class='invoice-title'>INVOICE</div>
            <div>Invoice #: <b>LP${orderId}</b></div>
            <div>Date: <b>${orderDate}</b></div>
            <div>Status: <b>${orderStatus}</b> ${paidBadge}</div>
          </div>
        </div>
        <div class='section'>
          <div class='section-title'>Bill To</div>
          <table class='info-table'>
            <tr><td><b>Name:</b></td><td>${customerName}</td></tr>
            <tr><td><b>Email:</b></td><td>${customerEmail}</td></tr>
            <tr><td><b>Phone:</b></td><td>${customerPhone}</td></tr>
            <tr><td><b>Address:</b></td><td>${customerAddress}</td></tr>
          </table>
        </div>
        <div class='section'>
          <div class='section-title'>Order Items</div>
          <table class='order-table'>
            <tr>
              <th>File(s)</th>
              <th>Print Options</th>
              <th>Pages</th>
              <th>Date</th>
            </tr>
            ${printJobGroupsBlock}
          </table>
        </div>
        ${orderNoteBlock}
        <div class='section'>
          <div class='section-title'>Summary</div>
          <table class='totals'>
            <tr><td class='label'>Subtotal</td><td class='value'>INR ${subtotal}</td></tr>
            <tr><td class='label'>GST (18%)</td><td class='value'>INR ${gst}</td></tr>
            <tr><td class='label'>Delivery</td><td class='value'>INR ${deliveryCharge}</td></tr>
            <tr><td class='label grand-total'>Grand Total</td><td class='value grand-total'>INR ${grandTotal}</td></tr>
          </table>
        </div>
        <div class='footer'>
          Thank you for choosing <b>LipiPrint</b>! For support, contact <a href='mailto:support@lipiprint.in'>support@lipiprint.in</a><br>
          <span style='font-size:13px; color:#bbb;'>This is a computer-generated invoice and does not require a signature.</span>
        </div>
      </div>
      </body>
      </html>
    `;
  }

  // Helper to request storage permission only on Android < 11
  async function requestStoragePermissionIfNeeded() {
    if (Platform.OS === 'android' && Platform.Version < 30) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to your storage to save the invoice PDF.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    // On Android 11+ and iOS, permission is not needed for app's own directories
    return true;
  }

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const granted = await requestStoragePermissionIfNeeded();
      if (!granted) {
        setDownloading(false);
        showAlert('Permission Denied', 'Cannot save PDF without storage permission.', 'error');
        return;
      }
      // Build invoice HTML
      const html = buildInvoiceHtml(order, printJobGroups, subtotal, gst, deliveryCharge, grandTotal);
      const file = await RNHTMLtoPDF.convert({
        html,
        fileName: `invoice-${order.id}`,
        directory: 'Download',
        base64: false,
      });

      // Move/copy to public Downloads folder (Android only)
      let publicPath = file.filePath;
      if (Platform.OS === 'android') {
        publicPath = `/storage/emulated/0/Download/invoice-${order.id}.pdf`;
        try {
          await RNBlobUtil.fs.cp(file.filePath, publicPath);
        } catch (copyErr) {
          // If copy fails, fallback to original path
          publicPath = file.filePath;
        }
      }

      setDownloading(false);
      showAlert('Download Complete', `Invoice saved at:\n${publicPath}`, 'success');
    } catch (e) {
      setDownloading(false);
      showAlert('Download Failed', 'Could not generate invoice PDF.', 'error');
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

  if (loading) return <View style={styles.center}>
    <LottieView
      source={searchForInvoiceAnim}
      autoPlay
      loop
      style={{ width: 120, height: 120, alignSelf: 'center' }}
    />
    <Text>Loading invoice...</Text>
  </View>;
  if (error) return <View style={styles.center}><Text>{error}</Text></View>;
  if (!order) return <View style={styles.center}><Text>No invoice data</Text></View>;

  const { user, status, createdAt } = order;
  const gstRate = 0.18;
  const deliveryCharge = order.deliveryCharge || 0;
  const subtotal = order.totalAmount ? (order.totalAmount / (1 + gstRate)).toFixed(2) : '0.00';
  const gst = order.totalAmount ? (parseFloat(subtotal) * gstRate).toFixed(2) : '0.00';
  const grandTotal = order.totalAmount ? (parseFloat(subtotal) + parseFloat(gst) + parseFloat(deliveryCharge)).toFixed(2) : '0.00';

  const invoiceUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.11:8082/'}api/orders/${orderId}/invoice`;

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

  // Group print jobs by print options
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

  const printJobGroups = groupPrintJobsByOptions(order.printJobs);

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
            <LottieView
              source={searchForInvoiceAnim}
              autoPlay
              loop
              style={{ width: 120, height: 120, alignSelf: 'center' }}
            />
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
          {printJobGroups.length > 0 ? (
            printJobGroups.map((group, idx) => {
              let specs;
              try {
                specs = typeof group.options === 'string' ? JSON.parse(group.options) : group.options;
              } catch {
                specs = {};
              }
              return (
                <View key={idx} style={{ marginBottom: 18, backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e0e0e0' }}>
                  <Text style={{ fontWeight: 'bold', color: '#764ba2', fontSize: 16, marginBottom: 4 }}>Print Options:</Text>
                  <View style={{ marginBottom: 8, marginLeft: 8 }}>
                    {Object.entries(specs).map(([key, value]) => (
                      <Text key={key} style={{ color: '#333', fontSize: 14 }}>
                        {key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())}: {String(value)}
                      </Text>
                    ))}
                  </View>
                  <Text style={{ fontWeight: 'bold', color: '#667eea', fontSize: 15, marginBottom: 2 }}>Files:</Text>
                  {group.files.map((file, fidx) => (
                    <View key={fidx} style={{ marginLeft: 12, marginBottom: 2 }}>
                      <Text style={{ color: '#22194f', fontWeight: 'bold', fontSize: 14 }}>{getDisplayFileName(file)}</Text>
                      <Text style={{ color: '#888', fontSize: 13 }}>Pages: {file?.pages || '-'}</Text>
                      <Text style={{ color: '#888', fontSize: 13 }}>Ordered On: {file?.createdAt?.split('T')[0] || '-'}</Text>
                    </View>
                  ))}
                </View>
              );
            })
          ) : (
            <Text style={{ color: '#888', marginTop: 8 }}>No print jobs found.</Text>
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
          <LottieView
            source={searchForInvoiceAnim}
            autoPlay
            loop
            style={{ width: 120, height: 120, alignSelf: 'center' }}
          />
          <Text style={{ marginTop: 14, color: '#667eea', fontWeight: 'bold', fontSize: 16 }}>Downloading PDF...</Text>
          <Text style={{ marginTop: 8, color: '#888', fontSize: 13 }}>If this takes more than a minute, check your internet or try again later.</Text>
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