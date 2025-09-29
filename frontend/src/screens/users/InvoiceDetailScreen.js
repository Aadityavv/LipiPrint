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
import InvoiceGenerator from '../../components/InvoiceGenerator';
import RNPrint from 'react-native-print';
import * as Animatable from 'react-native-animatable';

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
  const [printing, setPrinting] = useState(false);
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
        const apiUrl = `${process.env.EXPO_PUBLIC_API_URL || 'https://lipiprint-freelance.onrender.com/'}api/orders/${orderId}/invoice`;
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

  // Add a helper to truncate file names
  function truncateFileName(name, maxLength = 30) {
    if (!name) return '';
    if (name.length <= maxLength) return name;
    const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
    return name.slice(0, maxLength - ext.length - 3) + '...' + ext;
  }

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
      // Try to extract file names from item.description (comma separated or multiple files)
      let descHtml = item.description;
      if (descHtml && descHtml.includes('Multiple files:')) {
        // Extract file names after 'Multiple files:'
        let filesStr = descHtml.split('Multiple files:')[1].trim();
        let fileNames = filesStr.split(',').map(f => f.trim());
        descHtml = 'Multiple files:<br>' + fileNames.map(fn => truncateFileName(fn)).join('<br>');
      } else if (descHtml && descHtml.length > 40) {
        // Truncate single long file name
        descHtml = truncateFileName(descHtml);
      }
      orderItemsRows += `
        <tr>
          <td style='padding:6px 4px;text-align:center;'>${sNo++}</td>
          <td style='padding:6px 4px; max-width:240px; width:240px; word-break:break-all; white-space:pre-line; overflow:hidden; text-overflow:ellipsis;'>${descHtml}</td>
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
      
      // Use the new InvoiceGenerator
      await InvoiceGenerator.generateInvoice(
        order,
        (pdf) => {
          setDownloading(false);
          InvoiceGenerator.showDownloadSuccess(pdf.filePath);
        },
        (error) => {
          setDownloading(false);
          InvoiceGenerator.showDownloadError(error);
        }
      );
      
    } catch (e) {
      setDownloading(false);
      showAlert('Download Failed', 'Could not generate invoice PDF.', 'error');
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      console.log('[USER PRINT] Starting print process for invoice:', orderId);
      
      // First generate the PDF
      let pdfPath = null;
      
      await InvoiceGenerator.generateInvoice(
        order,
        (pdf) => {
          pdfPath = pdf.filePath;
        },
        (error) => {
          throw error;
        }
      );
      
      if (!pdfPath) {
        throw new Error('Failed to generate PDF for printing');
      }
      
      // Check if the file exists
      const RNFS = require('react-native-fs');
      const fileExists = await RNFS.exists(pdfPath);
      if (!fileExists) {
        throw new Error('Generated PDF file not found');
      }

      // Use react-native-print to print the PDF
      const printOptions = {
        html: '', // We're printing a PDF file, not HTML
        filePath: pdfPath,
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

      console.log('[USER PRINT] Printing with options:', printOptions);
      
      // Print the PDF file
      await RNPrint.print(printOptions);
      
      console.log('[USER PRINT] Print job sent successfully');
      showAlert('Success', 'Print job sent to printer successfully!', 'success');
      
    } catch (error) {
      console.error('[USER PRINT] Print error:', error);
      
      // Fallback: Try printing as HTML content
      try {
        console.log('[USER PRINT] Trying fallback HTML print method');
        
        const htmlContent = InvoiceGenerator.generateInvoiceHTML(order);
        
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
        console.log('[USER PRINT] HTML print job sent successfully');
        showAlert('Success', 'Print job sent to printer successfully!', 'success');
        
      } catch (htmlPrintError) {
        console.error('[USER PRINT] HTML print also failed:', htmlPrintError);
        showAlert('Print Failed', 'Failed to print invoice. Please try downloading and printing manually.', 'error');
      }
    } finally {
      setPrinting(false);
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

  const invoiceUrl = `${process.env.EXPO_PUBLIC_API_URL || 'https://lipiprint-freelance.onrender.com/'}api/orders/${orderId}/invoice`;

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Invoice Details</Text>
            <Text style={styles.headerSubtitle}>Order LP{order.id}</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Icon name="share" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Invoice Header Card */}
        <Animatable.View animation="fadeInDown" duration={500} style={styles.invoiceHeaderCard}>
          <View style={styles.invoiceHeaderContent}>
            <View style={styles.invoiceIconContainer}>
              <Icon name="receipt" size={32} color="#667eea" />
            </View>
            <View style={styles.invoiceHeaderText}>
              <Text style={styles.invoiceHeaderTitle}>LipiPrint Invoice</Text>
              <Text style={styles.invoiceHeaderSubtitle}>Professional Printing Services</Text>
            </View>
            <View style={styles.invoiceStatusBadge}>
              <Text style={styles.invoiceStatusText}>{order.status}</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Order Info Card */}
        <Animatable.View animation="fadeInUp" delay={200} duration={500} style={styles.orderInfoCard}>
          <View style={styles.cardHeader}>
            <Icon name="info" size={20} color="#667eea" />
            <Text style={styles.cardTitle}>Order Information</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Icon name="receipt" size={16} color="#999" />
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue}>LP{order.id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="event" size={16} color="#999" />
              <Text style={styles.infoLabel}>Order Date</Text>
              <Text style={styles.infoValue}>{order.createdAt?.split('T')[0] || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="local-shipping" size={16} color="#999" />
              <Text style={styles.infoLabel}>Delivery Type</Text>
              <Text style={styles.infoValue}>{order.deliveryType === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="payment" size={16} color="#999" />
              <Text style={styles.infoLabel}>Payment Status</Text>
              <Text style={[styles.infoValue, { color: '#4CAF50' }]}>Paid</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Customer Info Card */}
        <Animatable.View animation="fadeInUp" delay={300} duration={500} style={styles.customerCard}>
          <View style={styles.cardHeader}>
            <Icon name="person" size={20} color="#667eea" />
            <Text style={styles.cardTitle}>Customer Information</Text>
          </View>
          <View style={styles.customerInfo}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitial}>{order.user?.name?.charAt(0) || 'U'}</Text>
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{order.user?.name || 'Customer'}</Text>
              <View style={styles.customerContact}>
                <Icon name="phone" size={14} color="#666" />
                <Text style={styles.customerContactText}>{order.user?.phone || 'No phone'}</Text>
              </View>
              <View style={styles.customerContact}>
                <Icon name="email" size={14} color="#666" />
                <Text style={styles.customerContactText}>{order.user?.email || 'No email'}</Text>
              </View>
              {order.deliveryAddress && (
                <View style={styles.customerContact}>
                  <Icon name="location-on" size={14} color="#666" />
                  <Text style={styles.customerContactText}>{order.deliveryAddress}</Text>
                </View>
              )}
            </View>
          </View>
        </Animatable.View>


        {/* Print Jobs Card */}
        <Animatable.View animation="fadeInUp" delay={400} duration={500} style={styles.printJobsCard}>
          <View style={styles.cardHeader}>
            <Icon name="description" size={20} color="#667eea" />
            <Text style={styles.cardTitle}>Print Jobs ({printJobGroups.length})</Text>
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
                <View key={idx} style={styles.printJobGroup}>
                  <View style={styles.printJobHeader}>
                    <Icon name="print" size={16} color="#667eea" />
                    <Text style={styles.printJobTitle}>Print Group {idx + 1}</Text>
                  </View>
                  
                  <View style={styles.printOptionsContainer}>
                    <Text style={styles.printOptionsTitle}>Print Options:</Text>
                    <View style={styles.printOptionsGrid}>
                      {Object.entries(specs).map(([key, value]) => (
                        <View key={key} style={styles.printOptionItem}>
                          <Text style={styles.printOptionLabel}>
                            {key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())}:
                          </Text>
                          <Text style={styles.printOptionValue}>{String(value)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.filesContainer}>
                    <Text style={styles.filesTitle}>Files ({group.files.length}):</Text>
                    {group.files.map((file, fidx) => (
                      <View key={fidx} style={styles.fileItem}>
                        <Icon name="insert-drive-file" size={16} color="#999" />
                        <View style={styles.fileDetails}>
                          <Text style={styles.fileName}>{getDisplayFileName(file)}</Text>
                          <View style={styles.fileMeta}>
                            <Text style={styles.fileMetaText}>{file?.pages || 0} pages</Text>
                            <Text style={styles.fileMetaText}>•</Text>
                            <Text style={styles.fileMetaText}>
                              {file?.createdAt?.split('T')[0] || 'Unknown date'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.noJobsContainer}>
              <Icon name="description" size={48} color="#ccc" />
              <Text style={styles.noJobsText}>No print jobs found</Text>
            </View>
          )}
        </Animatable.View>

        {/* Pricing Summary Card */}
        <Animatable.View animation="fadeInUp" delay={500} duration={500} style={styles.pricingCard}>
          <View style={styles.cardHeader}>
            <Icon name="account-balance-wallet" size={20} color="#667eea" />
            <Text style={styles.cardTitle}>Pricing Summary</Text>
          </View>
          
          <View style={styles.pricingBreakdown}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Subtotal</Text>
              <Text style={styles.pricingValue}>₹{order.subtotal?.toFixed(2) || '0.00'}</Text>
            </View>
            
            {order.discount > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Discount</Text>
                <Text style={[styles.pricingValue, { color: '#4CAF50' }]}>-₹{order.discount?.toFixed(2) || '0.00'}</Text>
              </View>
            )}
            
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>GST (18%)</Text>
              <Text style={styles.pricingValue}>₹{order.gst?.toFixed(2) || '0.00'}</Text>
            </View>
            
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Delivery</Text>
              <Text style={styles.pricingValue}>₹{order.delivery?.toFixed(2) || '0.00'}</Text>
            </View>
            
            <View style={styles.pricingDivider} />
            
            <View style={[styles.pricingRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{order.grandTotal?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Action Buttons */}
        <Animatable.View animation="fadeInUp" delay={600} duration={500} style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDownload} disabled={downloading}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.actionButtonGradient}>
              <Icon name="file-download" size={20} color="white" />
              <Text style={styles.actionButtonText}>
                {downloading ? 'Downloading...' : 'Download PDF'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handlePrint} disabled={printing}>
            <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.actionButtonGradient}>
              <Icon name="print" size={20} color="white" />
              <Text style={styles.actionButtonText}>
                {printing ? 'Printing...' : 'Print Invoice'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Thank You Card */}
        <Animatable.View animation="fadeInUp" delay={700} duration={500} style={styles.thankYouCard}>
          <Icon name="favorite" size={24} color="#FF5722" />
          <Text style={styles.thankYouText}>Thank you for choosing LipiPrint!</Text>
          <Text style={styles.thankYouSubtext}>We appreciate your business and look forward to serving you again.</Text>
        </Animatable.View>
      </ScrollView>

      {/* Download Overlay */}
      {downloading && (
        <View style={styles.downloadOverlay}>
          <LottieView
            source={searchForInvoiceAnim}
            autoPlay
            loop
            style={styles.downloadAnimation}
          />
          <Text style={styles.downloadText}>Generating PDF...</Text>
          <Text style={styles.downloadSubtext}>This may take a moment</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  gradientHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  invoiceHeaderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  invoiceHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  invoiceHeaderText: {
    flex: 1,
  },
  invoiceHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  invoiceHeaderSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  invoiceStatusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  invoiceStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  customerInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  customerContact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerContactText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  printJobsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  printJobGroup: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  printJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  printJobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  printOptionsContainer: {
    marginBottom: 12,
  },
  printOptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  printOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  printOptionItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  printOptionLabel: {
    fontSize: 12,
    color: '#666',
  },
  printOptionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  filesContainer: {
    marginTop: 8,
  },
  filesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fileDetails: {
    flex: 1,
    marginLeft: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileMetaText: {
    fontSize: 12,
    color: '#666',
    marginRight: 6,
  },
  noJobsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noJobsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  pricingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pricingBreakdown: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666',
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  grandTotalRow: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  actionButtonsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  thankYouCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  thankYouText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginTop: 8,
    marginBottom: 4,
  },
  thankYouSubtext: {
    fontSize: 14,
    color: '#E65100',
    textAlign: 'center',
    lineHeight: 20,
  },
  downloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  downloadAnimation: {
    width: 120,
    height: 120,
  },
  downloadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#667eea',
    marginTop: 16,
  },
  downloadSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  center: { 
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center' 
  },
}); 