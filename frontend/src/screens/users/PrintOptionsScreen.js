import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import DocumentPicker from '@react-native-documents/picker';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';

const { width } = Dimensions.get('window');

export default function PrintOptionsScreen({ navigation, route }) {
  const { theme } = useTheme();
  const files = route?.params?.files ?? [];
  
  const [combinations, setCombinations] = useState([]);
  const [options, setOptions] = useState([]); // Only for binding
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({}); // { type: optionId }
  const [total, setTotal] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [costDetails, setCostDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]); // [{ name, size, pages, ... }]
  const [bindingOptions, setBindingOptions] = useState([]);

  // Fetch all combinations and binding options once
  useEffect(() => {
    Promise.all([
      api.request('/print-jobs/combinations'),
      api.request('/print-jobs/binding-options'),
      api.request('/services/active')
    ]).then(([combos, bindingOpts, allOpts]) => {
      setCombinations(combos);
      setBindingOptions(bindingOpts);
      setOptions(allOpts.filter(opt => opt.name.split('_')[0] === 'binding'));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (files && files.length > 0) {
      setUploadedFiles(files);
    }
  }, [files]);

  // Build unique selectors from combinations
  const uniqueColors = Array.from(new Set(combinations.map(c => c.color)));
  const uniquePapers = Array.from(new Set(combinations.map(c => c.paperSize)));
  const uniqueQualities = Array.from(new Set(combinations.map(c => c.paperQuality)));
  const uniqueSides = Array.from(new Set(combinations.map(c => c.printOption)));

  // Helper: filter available options based on current selection
  function getAvailableOptions(type) {
    // Filter combinations based on current selection except for the current type
    let filtered = combinations;
    if (type !== 'color' && selected.color) filtered = filtered.filter(c => c.color === selected.color);
    if (type !== 'paper' && selected.paper) filtered = filtered.filter(c => c.paperSize === selected.paper);
    if (type !== 'quality' && selected.quality) filtered = filtered.filter(c => c.paperQuality === selected.quality);
    if (type !== 'side' && selected.side) filtered = filtered.filter(c => c.printOption === selected.side);
    // Return available values for the current type
    switch (type) {
      case 'color': return Array.from(new Set(filtered.map(c => c.color)));
      case 'paper': return Array.from(new Set(filtered.map(c => c.paperSize)));
      case 'quality': return Array.from(new Set(filtered.map(c => c.paperQuality)));
      case 'side': return Array.from(new Set(filtered.map(c => c.printOption)));
      default: return [];
    }
  }

  // Helper to get selected value for binding
  const getSelectedBindingValue = () => {
    const id = selected.binding;
    const opt = options.find(o => o.id === id);
    if (!opt) return undefined;
    return opt.name || opt.type || opt.displayName;
  };

  // Call backend to calculate total cost (keep this for price calculation only)
  useEffect(() => {
    const numPages = uploadedFiles.reduce((sum, f) => sum + (f.pages || 0), 0);
    if (!selected.color || !selected.paper || !selected.quality || !selected.side || numPages === 0) {
      setTotal(0);
      setCostDetails(null);
      return;
    }
    setErrorMsg("");
    const fetchCost = async () => {
      setCalculating(true);
      const payload = {
        color: selected.color,
        paperSize: selected.paper,
        paperQuality: selected.quality,
        printOption: selected.side,
        numPages,
        bindingType: selected.binding,
        bindingPages: numPages
      };
      try {
        const res = await api.calculatePrintCost(payload);
        setTotal(res.totalCost);
        setCostDetails(res);
        setErrorMsg("");
      } catch (e) {
        setTotal(0);
        setCostDetails(null);
        setErrorMsg("Could not calculate price. Please check your selections and try again.");
      } finally {
        setCalculating(false);
      }
    };
    fetchCost();
  }, [selected.color, selected.paper, selected.quality, selected.side, selected.binding, uploadedFiles]);

  // Show modal when errorMsg is set
  useEffect(() => {
    if (errorMsg) setShowErrorModal(true);
    else setShowErrorModal(false);
  }, [errorMsg]);

  const handleSelect = (type, optionValue) => {
    setSelected(prev => ({ ...prev, [type]: optionValue }));
  };

  const proceedToDelivery = () => {
    if (uploadedFiles.length === 0) {
      setErrorMsg("Please upload at least one file before proceeding to delivery.");
      return;
    }
    if (!selected.color || !selected.paper || !selected.quality || !selected.side) {
      setErrorMsg("Please select all print options.");
      return;
    }
    navigation.navigate('DeliveryOptions', {
      files: uploadedFiles,
      selectedOptions: { ...selected },
      total
    });
  };

  // Add Reset button handler
  const handleReset = () => {
    setSelected({});
    setTotal(0);
    setCostDetails(null);
  };

  // Helper to shorten file names
  const shortenFileName = (name, maxLength = 20) => {
    if (!name) return '';
    if (name.length <= maxLength) return name;
    const ext = name.lastIndexOf('.') !== -1 ? name.substring(name.lastIndexOf('.')) : '';
    return name.substring(0, maxLength - ext.length - 3) + '...' + ext;
  };

  // File picker and upload
  const pickAndUploadFile = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.plainText, DocumentPicker.types.docx],
      });
      const fileSizeMB = (res.size / (1024 * 1024)).toFixed(2) + ' MB';
      const fileData = {
        uri: res.uri,
        name: res.name,
        type: res.type,
      };
      const response = await api.uploadFile(fileData);
      setUploadedFiles(prev => [...prev, {
        name: response.name || res.name,
        size: response.size ? (response.size / (1024 * 1024)).toFixed(2) + ' MB' : fileSizeMB,
        pages: response.pages || response.pageCount || '?',
        id: response.id || Date.now(),
      }]);
      setErrorMsg("");
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
      } else {
        setErrorMsg('File upload failed. Please try again.');
      }
    }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading options...</Text></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#22194f', '#22194f']}
        style={styles.headerGradient}
      >
        <Heading
          title="Print Options"
          subtitle={`${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''} • ${uploadedFiles.reduce((sum, file) => sum + (file.pages || 0), 0)} pages`}
          variant="primary"
        />
      </LinearGradient>

      <View style={styles.content}>
        {/* Error Modal */}
        <Modal
          visible={showErrorModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowErrorModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Error</Text>
              <Text style={styles.modalMsg}>{errorMsg}</Text>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setShowErrorModal(false)}>
                <Text style={styles.modalBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* File Upload */}
        {/* <TouchableOpacity style={styles.uploadBtn} onPress={pickAndUploadFile}>
          <Text style={styles.uploadBtnText}>Upload File</Text>
        </TouchableOpacity> */}
        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <View style={styles.filesList}>
            {uploadedFiles.map((file, idx) => (
              <View key={file.id} style={styles.fileItem}>
                <Text style={styles.fileName}>{shortenFileName(file.name)}</Text>
                <Text style={styles.fileMeta}>{file.pages} pages • {file.size}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Dynamic Option Groups */}
        <Animatable.View animation="fadeInUp" delay={200} duration={500}>
          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.paperGrid}>
            {getAvailableOptions('color').map(color => (
              <TouchableOpacity
                key={color}
                style={[styles.paperCard, selected.color === color && styles.selectedCard]}
                onPress={() => handleSelect('color', color)}
                activeOpacity={0.85}
              >
                <Text style={styles.paperTitle}>{color}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>
        <Animatable.View animation="fadeInUp" delay={400} duration={500}>
          <Text style={styles.sectionTitle}>Paper Size</Text>
          <View style={styles.paperGrid}>
            {getAvailableOptions('paper').map(paper => (
              <TouchableOpacity
                key={paper}
                style={[styles.paperCard, selected.paper === paper && styles.selectedCard]}
                onPress={() => handleSelect('paper', paper)}
                activeOpacity={0.85}
              >
                <Text style={styles.paperTitle}>{paper}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>
        <Animatable.View animation="fadeInUp" delay={600} duration={500}>
          <Text style={styles.sectionTitle}>Paper Quality</Text>
          <View style={styles.paperGrid}>
            {getAvailableOptions('quality').map(quality => (
              <TouchableOpacity
                key={quality}
                style={[styles.paperCard, selected.quality === quality && styles.selectedCard]}
                onPress={() => handleSelect('quality', quality)}
                activeOpacity={0.85}
              >
                <Text style={styles.paperTitle}>{quality}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>
        <Animatable.View animation="fadeInUp" delay={800} duration={500}>
          <Text style={styles.sectionTitle}>Print Option</Text>
          <View style={styles.paperGrid}>
            {getAvailableOptions('side').map(side => (
              <TouchableOpacity
                key={side}
                style={[styles.paperCard, selected.side === side && styles.selectedCard]}
                onPress={() => handleSelect('side', side)}
                activeOpacity={0.85}
              >
                <Text style={styles.paperTitle}>{side}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>
        <Animatable.View animation="fadeInUp" delay={1000} duration={500}>
          <Text style={styles.sectionTitle}>Binding</Text>
          <View style={[styles.paperGrid, { flexWrap: 'wrap' }]}> 
            {bindingOptions.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.paperCard, selected.binding === opt.type && styles.selectedCard]}
                onPress={() => handleSelect('binding', opt.type)}
                activeOpacity={0.85}
              >
                <Text style={styles.paperTitle}>{opt.type.charAt(0).toUpperCase() + opt.type.slice(1)}</Text>
                <Text style={styles.paperPrice}>Min ₹{opt.minPrice}, ₹{opt.perPagePrice}/page</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>

        {/* File Summary */}
        <Animatable.View animation="fadeInUp" delay={600} duration={500}>
          <Text style={styles.sectionTitle}>Files to Print</Text>
          {uploadedFiles.map((file, index) => (
            <Animatable.View
              key={file.id}
              animation="fadeInUp"
              delay={700 + index * 100}
              duration={400}
            >
              <View style={styles.fileSummaryCard}>
                <View style={styles.fileSummaryInfo}>
                  <Text style={styles.fileSummaryName}>{shortenFileName(file.name)}</Text>
                  <Text style={styles.fileSummaryMeta}>
                    {file.pages} pages • {file.size}
                  </Text>
                </View>
                <View style={styles.fileSummaryPrice}>
                  <Text style={styles.filePriceText}>₹{/* Show per-file price if needed */}</Text>
                </View>
              </View>
            </Animatable.View>
          ))}
        </Animatable.View>

        {/* Total and Proceed */}
        <Animatable.View animation="fadeInUp" delay={800} duration={500}>
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>{calculating ? '' : `₹${total}`}</Text>
            </View>
            {costDetails && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: '#888', fontSize: 13 }}>Print: ₹{costDetails.printCost}  Binding: ₹{costDetails.bindingCost}</Text>
              </View>
            )}
          </View>
        </Animatable.View>
      </View>
      {/* Bottom Button: Show Continue to Delivery if files uploaded, else Upload File */}
      <View style={{ padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee' }}>
        {uploadedFiles.length > 0 ? (
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={proceedToDelivery}
            activeOpacity={0.9}
            disabled={calculating || !selected.color || !selected.paper || !selected.quality || !selected.side || uploadedFiles.length === 0}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.proceedGradient}
            >
              <Text style={styles.proceedText}>Continue to Delivery</Text>
              <Text style={styles.proceedSubtext}>Review your order</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.uploadBtn, { marginTop: 0 }]}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Upload' })}
            activeOpacity={0.9}
          >
            <Text style={styles.uploadBtnText}>Upload File</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const CARD_WIDTH = (width - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  paperGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  paperCard: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#667eea',
    backgroundColor: '#f0f8ff',
  },
  paperIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  paperTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  paperDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  paperPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#667eea',
  },
  printGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  printCard: {
    width: CARD_WIDTH,
    minHeight: 160,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 8,
    marginBottom: 16,
    opacity: 0.92,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedPrintCard: {
    borderWidth: 2,
    borderColor: '#fff',
    opacity: 1,
    transform: [{ scale: 1.04 }],
  },
  printIcon: {
    fontSize: 38,
    marginBottom: 10,
  },
  printTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  printDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginBottom: 8,
  },
  printPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 2,
  },
  fileSummaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileSummaryInfo: {
    flex: 1,
  },
  fileSummaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  fileSummaryMeta: {
    fontSize: 14,
    color: '#666',
  },
  fileSummaryPrice: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filePriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  totalSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  proceedButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  proceedGradient: {
    padding: 20,
    alignItems: 'center',
  },
  proceedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  proceedSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 260,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  modalMsg: {
    fontSize: 15,
    color: '#333',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalBtn: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  modalBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  uploadBtn: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginBottom: 18,
  },
  uploadBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  filesList: {
    marginBottom: 18,
  },
  fileItem: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileName: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 15,
  },
  fileMeta: {
    color: '#666',
    fontSize: 13,
  },
});
