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
import ApiService from '../../services/api';

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
  const [combinations, setCombinations] = useState([]);
  const [bindingOptions, setBindingOptions] = useState([]);
  const [discountRules, setDiscountRules] = useState([]);
  // Remove backend price calculation state and use order fields directly
  const [backendTotal, setBackendTotal] = useState(null);
  const [backendBreakdown, setBackendBreakdown] = useState([]);
  const [backendSubtotal, setBackendSubtotal] = useState(null);
  const [backendGst, setBackendGst] = useState(null);
  const [backendGrandTotal, setBackendGrandTotal] = useState(null);
  const [backendDiscount, setBackendDiscount] = useState(null);

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

  useEffect(() => {
    // Fetch combinations, binding options, and discount rules
    const fetchPricingData = async () => {
      try {
        const [combos, bindings, discounts] = await Promise.all([
          ApiService.request('/print-jobs/combinations'),
          ApiService.request('/print-jobs/binding-options'),
          ApiService.request('/print-jobs/discount-rules'),
        ]);
        setCombinations(combos);
        setBindingOptions(bindings);
        setDiscountRules(discounts);
      } catch (e) {
        // Handle error (optional)
      }
    };
    fetchPricingData();
  }, []);

  useEffect(() => {
    if (!order || !order.printJobs) return;
    // Build filesPayload for backend price calculation
    const filesPayload = order.printJobs.map(pj => {
      let opts = {};
      try { opts = typeof pj.options === 'string' ? JSON.parse(pj.options) : pj.options; } catch {}
      return {
        color: opts.color,
        paper: opts.paper,
        quality: opts.quality,
        side: opts.side,
        binding: opts.binding,
        numPages: pj.file?.pages || 1,
        fileName: pj.file?.originalFilename || pj.file?.filename,
      };
    });
    ApiService.calculatePrintJobsCost({ files: filesPayload })
      .then(res => {
        setBackendSubtotal(res.subtotal);
        setBackendGst(res.gst);
        setBackendGrandTotal(res.grandTotal);
        setBackendDiscount(res.discount || null); // If backend returns discount
      })
      .catch(() => {
        setBackendSubtotal(null);
        setBackendGst(null);
        setBackendGrandTotal(null);
        setBackendDiscount(null);
      });
  }, [order]);

  // Helper to build invoice HTML (premium, professional, with public logo URL)
  function buildInvoiceHtml(order, printJobGroups) {
    // Company and customer info
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
    // Group print jobs by print options (including binding)
    const groupedJobs = {};
    if (order.printJobs && order.printJobs.length > 0) {
      order.printJobs.forEach((pj) => {
        let opts = {};
        try {
          opts = typeof pj.options === 'string' ? JSON.parse(pj.options) : pj.options;
        } catch {}
        // Create a key from all print options (including binding)
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
    // Use backend breakdown for invoice table
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
    // Use backend summary for all monetary values
    const summarySubtotal = order.subtotal !== undefined && order.subtotal !== null ? order.subtotal.toFixed(2) : '0.00';
    const summaryDiscount = order.discount !== undefined && order.discount !== null ? order.discount.toFixed(2) : '0.00';
    const summaryDiscountedSubtotal = order.discountedSubtotal !== undefined && order.discountedSubtotal !== null ? order.discountedSubtotal.toFixed(2) : '0.00';
    const summaryGST = order.gst !== undefined && order.gst !== null ? order.gst.toFixed(2) : '0.00';
    const summaryDelivery = order.delivery !== undefined && order.delivery !== null ? order.delivery.toFixed(2) : '0.00';
    const summaryGrandTotal = order.grandTotal !== undefined && order.grandTotal !== null ? order.grandTotal.toFixed(2) : '0.00';
    // HTML template
    return `
      <!DOCTYPE html>
      <html lang='en'>
      <head>
        <meta charset='UTF-8' />
        <title>Invoice - LipiPrint</title>
        <style>
          body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f7f9fb; color: #222; }
          .container { max-width: 800px; margin: 40px auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px #0001; padding: 36px 32px; }
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
      const html = buildInvoiceHtml(order, printJobGroups);
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
        message: `LipiPrint Invoice\nOrder ID: LP${order.id}\nTotal: INR ${order.grandTotal}`
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

  // Use backend values for all price fields
  const subtotal = order.subtotal !== undefined && order.subtotal !== null ? order.subtotal.toFixed(2) : '0.00';
  const discountedSubtotal = order.discountedSubtotal !== undefined && order.discountedSubtotal !== null ? order.discountedSubtotal.toFixed(2) : '0.00';
  const gst = order.gst !== undefined && order.gst !== null ? order.gst.toFixed(2) : '0.00';
  const delivery = order.delivery !== undefined && order.delivery !== null ? order.delivery.toFixed(2) : '0.00';
  const grandTotal = order.grandTotal !== undefined && order.grandTotal !== null ? order.grandTotal.toFixed(2) : '0.00';

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
          <Text style={styles.invoiceInfo}>Date: {order.createdAt?.split('T')[0] || '-'}</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="person" size={18} color="#667eea" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Customer Info</Text>
          </View>
          <Text>Name: {order.user?.name || '-'}</Text>
          <Text>Phone: {order.user?.phone || '-'}</Text>
          <Text>Email: {order.user?.email || '-'}</Text>
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
              <Text style={styles.priceLabel}>Subtotal (Before Discount)</Text>
              <Text style={styles.priceValue}>INR {order.subtotal?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Discount </Text>
              <Text style={styles.priceValue}>INR {order.discount?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal (After Discount)</Text>
              <Text style={styles.priceValue}>INR {order.discountedSubtotal?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceValue}>INR {order.gst?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery</Text>
              <Text style={styles.priceValue}>INR {order.delivery?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.priceRowDivider} />
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, styles.grandTotal]}>Grand Total</Text>
              <Text style={[styles.priceValue, styles.grandTotal]}>INR {order.grandTotal?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="info" size={18} color="#667eea" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Order Status</Text>
          </View>
          <Text>{order.status}</Text>
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
  thankYouBox: { backgroundColor: '#f0f4ff', borderRadius: 8, padding: 10, marginTop: 16 },
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