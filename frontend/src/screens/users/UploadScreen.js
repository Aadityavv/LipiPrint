import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions, ActivityIndicator, TextInput, FlatList, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { pick, types, isCancel } from '@react-native-documents/picker';
import ImagePicker from 'react-native-image-crop-picker';
import ApiService from '../../services/api';
import Heading from '../../components/Heading';
import RNBlobUtil from 'react-native-blob-util';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

// Define maxSize for file uploads (e.g., 20MB)
const maxSize = 20 * 1024 * 1024; // 20MB

export default function UploadScreen({ navigation }) {
  const [uploadedFiles, setUploadedFiles] = useState([]); // [{file, printOptions}]
  const [showPrintOptionsModal, setShowPrintOptionsModal] = useState(false);
  const [showUploadMorePrompt, setShowUploadMorePrompt] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [currentPrintOptions, setCurrentPrintOptions] = useState({});
  const [lastPrintOptions, setLastPrintOptions] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileId, setUploadingFileId] = useState(null); // NEW: Track which file is uploading
  const [combinations, setCombinations] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(true);
  const [comboError, setComboError] = useState(null);
  // Add state for binding options
  const [bindingOptions, setBindingOptions] = useState(['None']);
  const [loadingBindings, setLoadingBindings] = useState(true);
  // Add state for custom alert modal
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info'); // 'info', 'error', 'success'
  const [totalPrice, setTotalPrice] = useState(null);
  const [priceBreakdown, setPriceBreakdown] = useState([]);
  const [backendSubtotal, setBackendSubtotal] = useState(null);
  const [backendGst, setBackendGst] = useState(null);
  const [backendDiscount, setBackendDiscount] = useState(null);
  const [backendDiscountedSubtotal, setBackendDiscountedSubtotal] = useState(null);

  // Add state for binding groups and order note
  const [orderNote, setOrderNote] = useState('');

  function showCustomAlert(title, message, type = 'info') {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  }

  // Fetch valid print option combinations from backend
  useEffect(() => {
    setLoadingCombos(true);
    ApiService.request('/print-jobs/combinations')
      .then(data => {
        setCombinations(data);
        setLoadingCombos(false);
        console.log('[LOG] Fetched print option combinations:', data);
      })
      .catch(e => {
        setComboError('Failed to load print options');
        setLoadingCombos(false);
        console.log('[LOG] Error fetching combinations:', e);
      });
  }, []);

  // Add state for binding options
  useEffect(() => {
    ApiService.request('/print-jobs/binding-options')
      .then(data => {
        const names = Array.isArray(data) ? data.map(opt => opt.type || opt.name || 'None') : ['None'];
        setBindingOptions(['None', ...names.filter(n => n !== 'None')]);
        setLoadingBindings(false);
        console.log('[LOG] Fetched binding options:', names);
      })
      .catch(e => {
        setBindingOptions(['None']);
        setLoadingBindings(false);
        console.log('[LOG] Error fetching binding options:', e);
      });
  }, []);

  // Build unique selectors from combinations
  const uniqueColors = Array.from(new Set(combinations.map(c => c.color)));
  const uniquePapers = Array.from(new Set(combinations.map(c => c.paperSize)));
  const uniqueQualities = Array.from(new Set(combinations.map(c => c.paperQuality)));
  const uniqueSides = Array.from(new Set(combinations.map(c => c.printOption)));

  // Helper: filter available options based on current selection
  function getAvailableOptions(type, sel) {
    let filtered = combinations;
    if (type !== 'color' && sel.color) filtered = filtered.filter(c => c.color === sel.color);
    if (type !== 'paper' && sel.paper) filtered = filtered.filter(c => c.paperSize === sel.paper);
    if (type !== 'quality' && sel.quality) filtered = filtered.filter(c => c.paperQuality === sel.quality);
    if (type !== 'side' && sel.side) filtered = filtered.filter(c => c.printOption === sel.side);
    switch (type) {
      case 'color': return Array.from(new Set(filtered.map(c => c.color)));
      case 'paper': return Array.from(new Set(filtered.map(c => c.paperSize)));
      case 'quality': return Array.from(new Set(filtered.map(c => c.paperQuality)));
      case 'side': return Array.from(new Set(filtered.map(c => c.printOption)));
      default: return [];
    }
  }

  // Add this helper function
  async function prepareFileForUpload(file) {
    if (file.uri && file.uri.startsWith('content://')) {
      try {
        const destPath = RNBlobUtil.fs.dirs.CacheDir + '/' + (file.name || `upload_${Date.now()}.tmp`);
        await RNBlobUtil.fs.cp(file.uri, destPath);
        const newFile = { ...file, uri: 'file://' + destPath };
        console.log('[LOG] Converted content:// to file://', newFile);
        return newFile;
      } catch (e) {
        console.log('[LOG] Failed to copy content:// file:', e);
        return file;
      }
    }
    return file;
  }

  // File pickers
  const pickAndPrompt = async () => {
    console.log('[LOG] User tapped Choose Files');
    try {
      const res = await pick({ type: [types.allFiles], multiple: false });
      if (res) {
        const pickedFile = Array.isArray(res) ? res[0] : res;
        console.log('[LOG] Picked file:', pickedFile);
        setCurrentFile(pickedFile);
        setCurrentPrintOptions(lastPrintOptions || {
          color: uniqueColors[0],
          paper: uniquePapers[0],
          quality: uniqueQualities[0],
          side: uniqueSides[0],
          binding: 'None',
        });
        setShowPrintOptionsModal(true);
      }
    } catch (err) {
      if (!isCancel(err)) showCustomAlert('File Picker Error', 'Could not pick file.', 'error');
      console.log('[LOG] File picker error:', err);
    }
  };
  const pickFromCamera = async () => {
    console.log('[LOG] User tapped Camera');
    try {
      const image = await ImagePicker.openCamera({ cropping: false, mediaType: 'photo' });
      if (image) {
        const file = {
          uri: image.path,
          name: image.filename || `photo_${Date.now()}.jpg`,
          type: image.mime,
        };
        console.log('[LOG] Picked from camera:', file);
        setCurrentFile(file);
        setCurrentPrintOptions(lastPrintOptions || {
          color: uniqueColors[0],
          paper: uniquePapers[0],
          quality: uniqueQualities[0],
          side: uniqueSides[0],
          binding: 'None',
        });
        setShowPrintOptionsModal(true);
      }
    } catch (err) {
      if (err.code !== 'E_PICKER_CANCELLED') showCustomAlert('Camera Error', 'Could not take photo.', 'error');
      console.log('[LOG] Camera error:', err);
    }
  };
  const pickFromGallery = async () => {
    console.log('[LOG] User tapped Gallery');
    try {
      const image = await ImagePicker.openPicker({ multiple: false, cropping: false, mediaType: 'photo' });
      if (image) {
        const file = {
          uri: image.path,
          name: image.filename || `gallery_${Date.now()}.jpg`,
          type: image.mime,
        };
        console.log('[LOG] Picked from gallery:', file);
        setCurrentFile(file);
        setCurrentPrintOptions(lastPrintOptions || {
          color: uniqueColors[0],
          paper: uniquePapers[0],
          quality: uniqueQualities[0],
          side: uniqueSides[0],
          binding: 'None',
        });
        setShowPrintOptionsModal(true);
      }
    } catch (err) {
      if (err.code !== 'E_PICKER_CANCELLED') showCustomAlert('Gallery Error', 'Could not pick image.', 'error');
      console.log('[LOG] Gallery error:', err);
    }
  };

  // Save print options and upload file
  const handleSavePrintOptions = async (options) => {
    console.log('[UPLOAD DEBUG] handleSavePrintOptions called');
    setShowPrintOptionsModal(false);
    setIsUploading(true);
    // Prepare file for upload
    const fileToUpload = await prepareFileForUpload(currentFile);
    const tempId = `temp_${Date.now()}`;
    const printOptions = buildPrintOptions(options);
    // Add placeholder to uploadedFiles
    setUploadedFiles(prev => [
      ...prev,
      {
        file: {
          id: tempId,
          name: fileToUpload.name,
          type: fileToUpload.type,
          size: fileToUpload.size,
          pages: 1, // or null if unknown
        },
        printOptions,
        isUploading: true,
      }
    ]);
    setUploadingFileId(tempId);
    console.log('[LOG] Saving print options:', options);
    // File validation before upload
    if (!fileToUpload) {
      console.log('[UPLOAD VALIDATION] No file to upload.');
      setIsUploading(false);
      setUploadingFileId(null);
      showCustomAlert('File Error', 'No file selected.', 'error');
      // Remove temp file
      setUploadedFiles(prev => prev.filter(item => item.file.id !== tempId));
      return;
    }
    const allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'];
    const ext = fileToUpload.name ? fileToUpload.name.split('.').pop().toLowerCase() : '';
    if (!allowedTypes.includes(ext)) {
      console.log('[UPLOAD VALIDATION] File extension not allowed:', ext);
      setIsUploading(false);
      setUploadingFileId(null);
      showCustomAlert('File Error', `File type not allowed. Allowed: ${allowedTypes.join(', ')}`, 'error');
      setUploadedFiles(prev => prev.filter(item => item.file.id !== tempId));
      return;
    }
    if (fileToUpload.size && fileToUpload.size > maxSize) {
      console.log('[UPLOAD VALIDATION] File size too large:', fileToUpload.size, 'maxSize:', maxSize);
      setIsUploading(false);
      setUploadingFileId(null);
      showCustomAlert('File Error', `File size exceeds ${(maxSize / (1024 * 1024)).toFixed(0)}MB limit.`, 'error');
      setUploadedFiles(prev => prev.filter(item => item.file.id !== tempId));
      return;
    }
    try {
      // Upload file with options
      const formData = new FormData();
      const fileObj = {
        uri: fileToUpload.uri,
        name: fileToUpload.name || `upload_${Date.now()}.${ext}`,
        type: fileToUpload.type || 'application/octet-stream',
      };
      console.log('[UPLOAD DEBUG] fileObj:', fileObj);
      formData.append('file', fileObj);
      if (printOptions.color) formData.append('color', printOptions.color);
      if (printOptions.paper) formData.append('paper', printOptions.paper);
      if (printOptions.quality) formData.append('quality', printOptions.quality);
      if (printOptions.side) formData.append('side', printOptions.side);
      if (printOptions.binding) formData.append('binding', printOptions.binding);
      // React Native FormData does not support .entries(), so we cannot log FormData contents here.
      console.log('[UPLOAD DEBUG] Calling ApiService.uploadFile...');
      const response = await ApiService.uploadFile(formData);
      console.log('[UPLOAD DEBUG] uploadFile response:', response);
      if (response && response.id) {
        setUploadedFiles(prev =>
          prev.map(item =>
            item.file.id === tempId
              ? { file: response, printOptions, isUploading: false }
              : item
          )
        );
        setLastPrintOptions(printOptions);
      } else {
        setUploadedFiles(prev => prev.filter(item => item.file.id !== tempId));
        showCustomAlert('Upload Error', 'File upload failed. Please try again.', 'error');
      }
      setIsUploading(false);
      setUploadingFileId(null);
    } catch (e) {
      setIsUploading(false);
      setUploadingFileId(null);
      setUploadedFiles(prev => prev.filter(item => item.file.id !== tempId));
      console.log('[UPLOAD DEBUG] Error during upload:', e);
      showCustomAlert('Upload Error', e.message || 'Failed to upload file.', 'error');
    }
  };

  // Upload more prompt
  const handleUploadMore = (usePrevious) => {
    setShowUploadMorePrompt(false);
    setTimeout(() => {
      if (usePrevious && lastPrintOptions) {
        pickAndPromptWithPrevious();
      } else {
        pickAndPrompt();
      }
    }, 300);
  };
  const pickAndPromptWithPrevious = async () => {
    try {
      const res = await pick({ type: [types.allFiles], multiple: false });
      if (res) {
        const pickedFile = Array.isArray(res) ? res[0] : res;
        setCurrentFile(pickedFile);
        setCurrentPrintOptions(lastPrintOptions);
        setShowPrintOptionsModal(true);
        console.log('[LOG] Picked file (use previous options):', pickedFile);
      }
    } catch (err) {
      if (!isCancel(err)) showCustomAlert('File Picker Error', 'Could not pick file.', 'error');
      console.log('[LOG] File picker error:', err);
    }
  };

  // Calculate price after each upload or when uploadedFiles changes
  useEffect(() => {
    if (uploadedFiles.length === 0) return;
    const filesPayload = uploadedFiles.map(item => ({
      color: item.printOptions.color,
      paper: item.printOptions.paper,
      quality: item.printOptions.quality,
      side: item.printOptions.side,
      binding: item.printOptions.binding,
      numPages: item.file.pages || 1,
      fileName: item.file.originalFilename || item.file.name,
    }));
    ApiService.calculatePrintJobsCost({ files: filesPayload })
      .then(res => {
        setTotalPrice(res.grandTotal);
        setBackendSubtotal(res.subtotal); // before discount
        setBackendDiscountedSubtotal(res.discountedSubtotal); // after discount, before GST
        setBackendGst(res.gst);
        setBackendDiscount(res.discount);
        setPriceBreakdown(res.breakdown || []);
      })
      .catch(e => {
        setTotalPrice(null);
        setBackendSubtotal(null);
        setBackendGst(null);
        setBackendDiscount(null);
        setPriceBreakdown([]);
      });
  }, [uploadedFiles]);

  // Add a helper to check if any file is uploading
  const anyUploading = uploadedFiles.some(item => item.isUploading);

  // Proceed to checkout (stub)
const handleProceedToCheckout = async () => {
  setShowUploadMorePrompt(false);
  // Build printJobs payload from uploadedFiles
  const printJobs = uploadedFiles.map(item => ({
    file: { id: item.file.id },
    options: JSON.stringify(item.printOptions),
    status: 'QUEUED',
  }));

  navigation.navigate('DeliveryOptions', {
    printJobs,
    total: totalPrice, // Pass total for order summary
    totalPrice,
    priceBreakdown,
    files: uploadedFiles, // Pass files with pages
    subtotal: backendSubtotal,
    gst: backendGst,
    discount: backendDiscount,
    // Add any other order-related data here if needed
  });
};

  // Add remove file handler
  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(item => item.file.id !== fileId));
    console.log('[LOG] Removed file with id:', fileId);
  };

  // Print options modal validation
  const isOptionValid = (key, value, sel) => {
    const testSel = { ...sel, [key]: value };
    // Must be at least one combination with all selected values
    return combinations.some(c =>
      (!testSel.color || c.color === testSel.color) &&
      (!testSel.paper || c.paperSize === testSel.paper) &&
      (!testSel.quality || c.paperQuality === testSel.quality) &&
      (!testSel.side || c.printOption === testSel.side)
    );
  };

  // When building print options for upload, only include binding if not 'None'
  const buildPrintOptions = (options) => {
    const { color, paper, quality, side, binding } = options;
    const opts = { color, paper, quality, side };
    if (binding && binding !== 'None') {
      opts.binding = binding;
    }
    return opts;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
        <Heading title="Upload Files" subtitle="Select files to print" variant="primary" />
      </LinearGradient>
      <View style={styles.content}>
        {/* Always show upload area and quick upload buttons */}
        <TouchableOpacity style={styles.uploadArea} onPress={pickAndPrompt} disabled={loadingCombos}>
          <Icon name="cloud" size={48} color="#667eea" style={styles.uploadIcon} />
          <Text style={styles.uploadTitle}>Choose Files</Text>
          <Text style={styles.uploadSubtitle}>Supported: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG</Text>
        </TouchableOpacity>
        <View style={styles.quickUploadGrid}>
          <TouchableOpacity style={styles.quickUploadBtn} onPress={pickFromCamera} disabled={loadingCombos}>
            <Icon name="photo-camera" size={28} color="#fff" />
            <Text style={styles.quickUploadText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickUploadBtn} onPress={pickFromGallery} disabled={loadingCombos}>
            <Icon name="photo-library" size={28} color="#fff" />
            <Text style={styles.quickUploadText}>Gallery</Text>
          </TouchableOpacity>
        </View>
        {/* Only show file list, price summary, and checkout if files are uploaded */}
        {uploadedFiles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Files to Print</Text>
            {uploadedFiles.map((item, idx) => (
              <View key={item.file.id || item.file.name || idx} style={styles.fileCardModern}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Icon name="description" size={28} color="#667eea" style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileName}>{item.file.originalFilename || item.file.name}</Text>
                    <Text style={styles.fileMeta}>{item.file.size ? (typeof item.file.size === 'number' ? `${(item.file.size / (1024 * 1024)).toFixed(2)} MB` : item.file.size) : ''} • {item.file.pages} pages • {item.file.contentType || item.file.type}</Text>
                    <Text style={styles.printOptions}>{Object.entries(item.printOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}</Text>
                  </View>
                </View>
                {item.isUploading ? (
                  <View style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                    <LottieView
                      source={require('../../assets/animations/Uploading-to-cloud.json')}
                      autoPlay
                      loop
                      style={{ width: 46, height: 46 }}
                      speed={1.5}
                    />
                  </View>
                ) : (
                <TouchableOpacity onPress={() => handleRemoveFile(item.file.id)} style={styles.removeBtn}>
                  <Icon name="delete" size={22} color="#ff4757" />
                </TouchableOpacity>
                )}
              </View>
            ))}
            {totalPrice !== null && (
              <View style={styles.priceSummaryModern}>
                <Text style={styles.priceTotalModern}>Total Price: <Text style={{ color: '#22194f' }}>₹{totalPrice}</Text></Text>
                {Array.isArray(priceBreakdown) && priceBreakdown.length > 0 && priceBreakdown.map((b, i) => (
                  b.fileName && b.totalCost != null ? (
                    <Text key={i} style={styles.priceBreakdownModern}>{b.fileName}: ₹{b.totalCost}</Text>
                  ) : null
                ))}
                {backendSubtotal !== null && (
                  <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: '#888' }}>Subtotal (Before Discount):</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#22194f' }}>₹{backendSubtotal}</Text>
                  </View>
                )}
                {backendDiscountedSubtotal !== null && (
                  <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: '#888' }}>Subtotal (After Discount):</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#22194f' }}>₹{backendDiscountedSubtotal}</Text>
                  </View>
                )}
                {backendGst !== null && (
                  <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: '#888' }}>GST:</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#22194f' }}>₹{backendGst}</Text>
                  </View>
                )}
                {backendDiscount !== null && (
                  <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: '#888' }}>Discount:</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#22194f' }}>₹{!isNaN(Number(backendDiscount)) && backendDiscount !== null && backendDiscount !== undefined ? Number(backendDiscount).toFixed(2) : '0.00'}</Text>
                  </View>
                )}
              </View>
            )}
            <TouchableOpacity 
              style={[styles.checkoutBtn, (totalPrice === null || anyUploading) && { opacity: 0.5 }]}
              onPress={handleProceedToCheckout}
              disabled={totalPrice === null || anyUploading}
            >
              <Text style={styles.checkoutBtnText}>Choose Delivery Options</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.orderNoteSectionModern}>
        <Text style={styles.orderNoteLabelModern}>Remarks:</Text>
        <TextInput
          style={styles.orderNoteInputModern}
          value={orderNote}
          onChangeText={setOrderNote}
          placeholder="Leave a note for the admin..."
          placeholderTextColor="#aaa"
          multiline
          maxLength={300}
        />
        <Text style={styles.orderNoteCharCount}>{orderNote.length}/300</Text>
      </View>
      {/* Print Options Modal */}
      <Modal visible={showPrintOptionsModal} transparent animationType="slide" onRequestClose={() => setShowPrintOptionsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Print Options</Text>
            {loadingCombos ? (
              <ActivityIndicator size="large" color="#667eea" />
            ) : (
              ['color', 'paper', 'quality', 'side'].map(key => (
                <View key={key} style={{ marginBottom: 10 }}>
                  <Text style={styles.modalLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {getAvailableOptions(key, currentPrintOptions).map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.optionBtn,
                          currentPrintOptions[key] === opt && styles.optionBtnActive,
                          !isOptionValid(key, opt, currentPrintOptions) && { opacity: 0.4 },
                        ]}
                        disabled={!isOptionValid(key, opt, currentPrintOptions)}
                        onPress={() => setCurrentPrintOptions(prev => ({ ...prev, [key]: opt }))}
                      >
                        <Text style={{ color: currentPrintOptions[key] === opt ? 'white' : '#222' }}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            )}
            {lastPrintOptions && (
              <TouchableOpacity style={{ marginTop: 10, marginBottom: 8, alignSelf: 'flex-start' }} onPress={() => { setCurrentPrintOptions(lastPrintOptions); }}>
                <Text style={{ color: '#667eea', fontWeight: 'bold' }}>Use previous print options</Text>
              </TouchableOpacity>
            )}
            {loadingBindings && (
              <ActivityIndicator size="small" color="#667eea" style={{ marginBottom: 10 }} />
            )}
            {!loadingBindings && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.modalLabel}>Binding</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {bindingOptions.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.optionBtn,
                        currentPrintOptions.binding === opt && styles.optionBtnActive,
                      ]}
                      onPress={() => setCurrentPrintOptions(prev => ({ ...prev, binding: opt }))}
                    >
                      <Text style={{ color: currentPrintOptions.binding === opt ? 'white' : '#222' }}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={() => handleSavePrintOptions(currentPrintOptions)} style={styles.saveBtn}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Upload More Prompt */}
      <Modal visible={showUploadMorePrompt} transparent animationType="fade" onRequestClose={() => setShowUploadMorePrompt(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload more files?</Text>
            <View style={{ flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <TouchableOpacity onPress={() => handleUploadMore(false)} style={styles.uploadMoreBtn}>
                <Text style={styles.uploadMoreBtnText}>Upload Another File</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleProceedToCheckout} style={styles.uploadMoreBtnAlt}>
                <Text style={styles.uploadMoreBtnText}>Proceed to Checkout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Custom Alert Modal */}
      <Modal visible={alertVisible} transparent animationType="fade" onRequestClose={() => setAlertVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center' }]}>
            <Text style={[styles.modalTitle, { color: alertType === 'error' ? '#ff4757' : alertType === 'success' ? '#43B581' : '#22194f' }]}>{alertTitle}</Text>
            <Text style={{ fontSize: 16, color: '#444', marginVertical: 12, textAlign: 'center' }}>{alertMessage}</Text>
            <TouchableOpacity onPress={() => setAlertVisible(false)} style={[styles.saveBtn, { backgroundColor: alertType === 'error' ? '#ff4757' : alertType === 'success' ? '#43B581' : '#667eea' }]}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerGradient: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 },
  content: { padding: 20 },
  uploadArea: { backgroundColor: '#f25f73ff', borderRadius: 16, alignItems: 'center', padding: 32, marginBottom: 24, elevation: 2 },
  uploadIcon: { marginBottom: 16 },
  uploadTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  uploadSubtitle: { fontSize: 14, color: '#fff', textAlign: 'center', marginBottom: 20 },
  quickUploadGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  quickUploadBtn: { backgroundColor: '#22194f', borderRadius: 12, padding: 18, alignItems: 'center', flex: 1, marginHorizontal: 6 },
  quickUploadText: { color: '#fff', fontWeight: 'bold', marginTop: 6 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, elevation: 1 },
  fileCardModern: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 },
  fileName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  fileMeta: { fontSize: 13, color: '#666' },
  printOptions: { fontSize: 12, color: '#888', marginTop: 2 },
  checkoutBtn: { backgroundColor: '#667eea', padding: 14, borderRadius: 10, marginTop: 16, alignItems: 'center' },
  checkoutBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  removeBtn: { marginLeft: 10, padding: 6, borderRadius: 20, backgroundColor: '#fdecea' },
  priceSummaryModern: { marginTop: 8, marginBottom: 4, backgroundColor: '#f8f9fa', borderRadius: 8, padding: 10 },
  priceTotalModern: { fontWeight: 'bold', fontSize: 17, marginBottom: 2 },
  priceBreakdownModern: { fontSize: 13, color: '#888' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 24, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  modalLabel: { fontWeight: '600', marginBottom: 2 },
  optionBtn: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, marginBottom: 4 },
  optionBtnActive: { backgroundColor: '#667eea' },
  saveBtn: { backgroundColor: '#667eea', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  uploadMoreBtn: { backgroundColor: '#43B581', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  uploadMoreBtnAlt: { backgroundColor: '#ff512f', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  uploadMoreBtnText: { color: 'white', fontWeight: 'bold' },
  orderNoteSection: { marginVertical: 16 },
  orderNoteLabel: { fontWeight: 'bold', color: '#764ba2', marginBottom: 4 },
  orderNoteInput: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 8, minHeight: 40, color: '#333' },
  lottieCardModern: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
    minWidth: 280,
    maxWidth: 340,
    marginHorizontal: 16,
  },
  lottieTitle: {
    color: '#22194f',
    fontWeight: 'bold',
    fontSize: 24,
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
  lottieSubtitle: {
    color: '#555',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  orderNoteSectionModern: {
    marginVertical: 24,
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  orderNoteLabelModern: {
    fontWeight: 'bold',
    color: '#764ba2',
    marginBottom: 8,
    fontSize: 16,
  },
  orderNoteInputModern: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    minHeight: 60,
    color: '#333',
    fontSize: 15,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  orderNoteCharCount: {
    alignSelf: 'flex-end',
    color: '#aaa',
    fontSize: 12,
    marginTop: -4,
  },
});