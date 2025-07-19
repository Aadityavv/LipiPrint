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

export default function UploadScreen({ navigation }) {
  const [uploadedFiles, setUploadedFiles] = useState([]); // [{file, printOptions}]
  const [showPrintOptionsModal, setShowPrintOptionsModal] = useState(false);
  const [showUploadMorePrompt, setShowUploadMorePrompt] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [currentPrintOptions, setCurrentPrintOptions] = useState({});
  const [lastPrintOptions, setLastPrintOptions] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
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

  // Add state for binding groups and order note
  const [bindingGroups, setBindingGroups] = useState([]); // Array of arrays of file indices
  const [selectedFiles, setSelectedFiles] = useState([]); // For current group selection
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
        console.log('[LOG] Picked file:', res);
        setCurrentFile(res);
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
    setShowPrintOptionsModal(false);
    setIsUploading(true);
    console.log('[LOG] Saving print options:', options);
    // File validation before upload
    if (!currentFile) {
      setIsUploading(false);
      showCustomAlert('File Error', 'No file selected.', 'error');
      return;
    }
    const allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png']; // Example allowed types
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    const ext = currentFile.name ? currentFile.name.split('.').pop().toLowerCase() : '';
    if (!allowedTypes.includes(ext)) {
      setIsUploading(false);
      showCustomAlert('File Error', `File type not allowed. Allowed: ${allowedTypes.join(', ')}`, 'error');
      return;
    }
    if (currentFile.size && currentFile.size > maxSize) {
      setIsUploading(false);
      showCustomAlert('File Error', `File size exceeds ${(maxSize / (1024 * 1024)).toFixed(0)}MB limit.`, 'error');
      return;
    }
    try {
      // Upload file with options
      const formData = new FormData();
      formData.append('file', currentFile);
      const printOptions = buildPrintOptions(options);
      if (printOptions.color) formData.append('color', printOptions.color);
      if (printOptions.paper) formData.append('paper', printOptions.paper);
      if (printOptions.quality) formData.append('quality', printOptions.quality);
      if (printOptions.side) formData.append('side', printOptions.side);
      if (printOptions.binding) formData.append('binding', printOptions.binding);
      const response = await ApiService.uploadFile(formData);
      if (response && response.id) {
        setUploadedFiles(prev => [...prev, { file: response, printOptions }]);
        setLastPrintOptions(printOptions);
      } else {
        showCustomAlert('Upload Error', 'File upload failed. Please try again.', 'error');
      }
      setIsUploading(false);
    } catch (e) {
      setIsUploading(false);
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
        setCurrentFile(res);
        setCurrentPrintOptions(lastPrintOptions);
        setShowPrintOptionsModal(true);
        console.log('[LOG] Picked file (use previous options):', res);
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
        setTotalPrice(res.total);
        setPriceBreakdown(res.breakdown || []);
        console.log('[LOG] Calculated price:', res);
      })
      .catch(e => {
        setTotalPrice(null);
        setPriceBreakdown([]);
        console.log('[LOG] Price calculation error:', e);
      });
  }, [uploadedFiles]);

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

  // Helper to add a new binding group
  const addBindingGroup = () => {
    if (selectedFiles.length < 2) {
      Alert.alert('Select at least 2 files to bind together.');
      return;
    }
    setBindingGroups([...bindingGroups, selectedFiles]);
    setSelectedFiles([]);
  };

  // Helper to remove a file from all groups
  const removeFileFromGroups = (fileIdx) => {
    setBindingGroups(bindingGroups.map(group => group.filter(idx => idx !== fileIdx)).filter(g => g.length > 0));
  };

  // UI for selecting files to bind together
  const renderFileSelector = () => (
    <View style={styles.bindingSection}>
      <Text style={styles.bindingTitle}>Group Binding</Text>
      <Text style={styles.bindingDesc}>Select files to bind together, then tap 'Add Group'.</Text>
      <FlatList
        data={uploadedFiles}
        keyExtractor={(_, idx) => idx.toString()}
        horizontal
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.fileChip, selectedFiles.includes(index) && styles.fileChipSelected]}
            onPress={() => {
              setSelectedFiles(selectedFiles.includes(index)
                ? selectedFiles.filter(i => i !== index)
                : [...selectedFiles, index]);
            }}
          >
            <Text style={styles.fileChipText}>{item.file.originalFilename || item.file.name}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.addGroupBtn} onPress={addBindingGroup}>
        <Text style={styles.addGroupBtnText}>Add Group</Text>
      </TouchableOpacity>
      <View style={styles.groupsList}>
        {bindingGroups.map((group, gidx) => (
          <View key={gidx} style={styles.groupRow}>
            <Text style={styles.groupLabel}>Group {gidx + 1}:</Text>
            {group.map(idx => (
              <View key={idx} style={styles.groupFileChip}>
                <Text style={styles.groupFileChipText}>{uploadedFiles[idx]?.file.originalFilename || uploadedFiles[idx]?.file.name}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {isUploading && (
        <View style={{
          position: 'absolute', left: 0, top: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', zIndex: 10
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 32,
            padding: 36,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 12,
            minWidth: 260,
            maxWidth: 320
          }}>
            <LottieView
              source={require('../../assets/animations/Man-using-printing-machine.json')}
              autoPlay
              loop
              style={{ width: 180, height: 180, marginBottom: 10 }}
              speed={2}
            />
            <Text style={{ color: '#22194f', fontWeight: 'bold', fontSize: 22, marginTop: 10, marginBottom: 10, textAlign: 'center' }}>Uploading your file...</Text>
            <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 8 }} />
          </View>
        </View>
      )}
      <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
        <Heading title="Upload Files" subtitle="Select files to print" variant="primary" />
      </LinearGradient>
      <View style={styles.content}>
        <TouchableOpacity style={styles.uploadArea} onPress={pickAndPrompt} disabled={isUploading || loadingCombos}>
          <Icon name="folder" size={48} color="#667eea" style={styles.uploadIcon} />
          <Text style={styles.uploadTitle}>Choose Files</Text>
          <Text style={styles.uploadSubtitle}>Supported: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG</Text>
        </TouchableOpacity>
        <View style={styles.quickUploadGrid}>
          <TouchableOpacity style={styles.quickUploadBtn} onPress={pickFromCamera} disabled={isUploading || loadingCombos}>
            <Icon name="photo-camera" size={28} color="#fff" />
            <Text style={styles.quickUploadText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickUploadBtn} onPress={pickFromGallery} disabled={isUploading || loadingCombos}>
            <Icon name="photo-library" size={28} color="#fff" />
            <Text style={styles.quickUploadText}>Gallery</Text>
          </TouchableOpacity>
        </View>
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
                <TouchableOpacity onPress={() => handleRemoveFile(item.file.id)} style={styles.removeBtn}>
                  <Icon name="delete" size={22} color="#ff4757" />
                </TouchableOpacity>
              </View>
            ))}
            {totalPrice !== null && (
              <View style={styles.priceSummaryModern}>
                <Text style={styles.priceTotalModern}>Total Price: <Text style={{ color: '#22194f' }}>₹{totalPrice}</Text></Text>
                {priceBreakdown.length > 0 && priceBreakdown.map((b, i) => (
                  <Text key={i} style={styles.priceBreakdownModern}>{b.fileName}: ₹{b.totalCost}</Text>
                ))}
              </View>
            )}
            <TouchableOpacity 
              style={[styles.checkoutBtn, totalPrice === null && { opacity: 0.5 }]}
              onPress={handleProceedToCheckout}
              disabled={totalPrice === null}
            >
              <Text style={styles.checkoutBtnText}>Choose Delivery Options</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {renderFileSelector()}
      <View style={styles.orderNoteSection}>
        <Text style={styles.orderNoteLabel}>Order Note (optional):</Text>
        <TextInput
          style={styles.orderNoteInput}
          value={orderNote}
          onChangeText={setOrderNote}
          placeholder="Leave a note for the admin..."
          multiline
        />
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
  uploadArea: { backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', padding: 32, marginBottom: 24, elevation: 2 },
  uploadIcon: { marginBottom: 16 },
  uploadTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  uploadSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
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
  bindingSection: { marginVertical: 16, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 10 },
  bindingTitle: { fontWeight: 'bold', fontSize: 16, color: '#764ba2', marginBottom: 4 },
  bindingDesc: { color: '#888', fontSize: 13, marginBottom: 8 },
  fileChip: { padding: 8, borderRadius: 8, backgroundColor: '#e0e0e0', marginRight: 8 },
  fileChipSelected: { backgroundColor: '#667eea' },
  fileChipText: { color: '#333' },
  addGroupBtn: { marginTop: 8, backgroundColor: '#667eea', borderRadius: 8, padding: 8, alignItems: 'center' },
  addGroupBtnText: { color: '#fff', fontWeight: 'bold' },
  groupsList: { marginTop: 8 },
  groupRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  groupLabel: { color: '#764ba2', fontWeight: 'bold', marginRight: 4 },
  groupFileChip: { backgroundColor: '#e0e0e0', borderRadius: 6, paddingHorizontal: 6, marginRight: 4 },
  groupFileChipText: { color: '#333' },
  orderNoteSection: { marginVertical: 16 },
  orderNoteLabel: { fontWeight: 'bold', color: '#764ba2', marginBottom: 4 },
  orderNoteInput: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 8, minHeight: 40, color: '#333' },
});