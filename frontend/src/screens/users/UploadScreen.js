import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Modal,
  Image,
  Dimensions,
  ActivityIndicator,
  Switch,
  TextInput,
  PermissionsAndroid,
  Platform
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ApiService from '../../services/api';
import { pick, types, isCancel } from '@react-native-documents/picker';
import ImagePicker from 'react-native-image-crop-picker';
import CustomAlert from '../../components/CustomAlert';
import Heading from '../../components/Heading';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

// Banner component
function StoreClosedBanner() {
  return (
    <View style={{ backgroundColor: '#F44336', padding: 10, alignItems: 'center' }}>
      <Text style={{ color: 'white', fontWeight: 'bold' }}>Store is not accepting orders</Text>
    </View>
  );
}

export default function UploadScreen({ navigation }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);
  const [enhanceFile, setEnhanceFile] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [enableCompression, setEnableCompression] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [acceptingOrders, setAcceptingOrders] = useState(true);

  // Remove auto-fetch of uploaded files for new orders
  // Only use files selected in the current session for the order
  useEffect(() => {
    // Do not fetch previously uploaded files for new order
    setUploadedFiles([]);
  }, []);

  useEffect(() => {
    calculateTotalSize();
    calculateEstimatedCost();
  }, [uploadedFiles, totalSize]);

  useEffect(() => {
    ApiService.request('/settings/accepting-orders')
      .then(res => setAcceptingOrders(res.acceptingOrders))
      .catch(() => setAcceptingOrders(true));
  }, []);

  const calculateTotalSize = () => {
    const total = uploadedFiles.reduce((sum, file) => {
      let sizeInMB = 0;
      if (typeof file.size === 'string') {
        sizeInMB = parseFloat(file.size.replace(' MB', ''));
      } else if (typeof file.size === 'number') {
        // If size is in bytes, convert to MB
        sizeInMB = file.size / (1024 * 1024);
      } else {
        sizeInMB = 0;
      }
      return sum + (isNaN(sizeInMB) ? 0 : sizeInMB);
    }, 0);
    setTotalSize(total);
  };

  const calculateEstimatedCost = () => {
    // Mock cost calculation: ₹5 per page + ₹2 per MB
    const totalPages = uploadedFiles.reduce((sum, file) => sum + file.pages, 0);
    const cost = (totalPages * 5) + (totalSize * 2);
    setEstimatedCost(cost);
  };

  // Replace handleFileUpload with progress-enabled upload
  const handleFileUpload = async (file) => {
    if (!acceptingOrders) {
      showAlert('Store Closed', 'Store is not accepting orders at the moment. Please try again later.');
      return;
    }
    // Add file to UI with uploading status and 0% progress
    const tempId = Date.now() + Math.random();
    const uploadingFile = {
      ...file,
      id: tempId,
      status: 'uploading',
      progress: 0,
    };
    setUploadedFiles(prev => [...prev, uploadingFile]);

    // Prepare FormData
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    });

    // Use XMLHttpRequest for progress
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://192.168.1.11:8082/api/files/upload');
    xhr.setRequestHeader('Accept', 'application/json');
    // Add auth token if needed
    const token = await ApiService.getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        let percent = Math.round((event.loaded / event.total) * 100);
        if (percent > 100) percent = 100;
        setUploadedFiles(prev => prev.map(f => f.id === tempId ? { ...f, progress: percent } : f));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let response = {};
        try { response = JSON.parse(xhr.responseText); } catch {}
        // Replace temp uploading file with real uploaded file
        setUploadedFiles(prev => prev.map(f =>
          f.id === tempId
            ? {
                ...response,
                id: response.id || tempId,
                status: 'done',
                progress: 100,
                name: response.name || file.name,
                size: response.size || file.size,
                pages: response.pages || 1,
                originalFilename: response.originalFilename || file.name,
              }
            : f
        ));
        setTimeout(() => {
          calculateTotalSize();
          calculateEstimatedCost();
        }, 0);
      } else {
        setUploadedFiles(prev => prev.filter(f => f.id !== tempId));
        showAlert('Upload Failed', 'Could not upload file.');
      }
    };

    xhr.onerror = () => {
      setUploadedFiles(prev => prev.filter(f => f.id !== tempId));
      showAlert('Upload Failed', 'Could not upload file.');
    };

    xhr.send(formData);
  };

  const removeFile = async (fileId) => {
    try {
      await ApiService.deleteFile(fileId);
      setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
    } catch (e) {
      let errorMsg = 'Could not delete file from server.';
      if (e.message && e.message.includes('409')) {
        errorMsg = 'Cannot delete file: it is used in a print job.';
      } else if (e.message) {
        errorMsg = e.message;
      }
      showAlert('Delete Failed', errorMsg);
    }
  };

  const openFilePreview = (file) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  const openEnhanceModal = (file) => {
    setEnhanceFile(file);
    setShowEnhanceModal(true);
  };

  const proceedToPrint = () => {
    const readyFiles = uploadedFiles.filter(file => file.status === 'done' && typeof file.id === 'number' && file.id > 0);
    if (readyFiles.length === 0) {
      showAlert('No Files', 'Please upload at least one file to continue.');
      return;
    }
    // Defensive: check for any file without a valid backend id
    const invalidFiles = uploadedFiles.filter(file => file.status === 'done' && (typeof file.id !== 'number' || file.id <= 0));
    if (invalidFiles.length > 0) {
      showAlert('File Upload Error', 'One or more files did not upload correctly. Please re-upload those files.');
      return;
    }
    const filesWithOptions = readyFiles.map(file => ({
      ...file,
      enableCompression,
    }));
    navigation.navigate('PrintOptions', {
      files: filesWithOptions,
      totalSize,
      estimatedCost
    });
  };

  const validateFile = (file) => {
    const maxSize = 50; // 50MB limit
    const allowedTypes = ['PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'JPG', 'PNG'];
    
    const sizeInMB = parseFloat(file.size.replace(' MB', ''));
    if (sizeInMB > maxSize) {
      showAlert('File Too Large', `File size must be less than ${maxSize}MB`);
      return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
      showAlert('Unsupported Format', 'Please upload a supported file format');
      return false;
    }
    
    return true;
  };

  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
      ]);
      if (
        granted['android.permission.READ_EXTERNAL_STORAGE'] === 'granted' ||
        granted['android.permission.READ_MEDIA_IMAGES'] === 'granted' ||
        granted['android.permission.READ_MEDIA_VIDEO'] === 'granted' ||
        granted['android.permission.READ_MEDIA_AUDIO'] === 'granted'
      ) {
        return true;
      } else {
        showAlert('Permission Denied', 'Storage permission is required to select files.');
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const pickAndUploadFile = async () => {
    if (!acceptingOrders) {
      showAlert('Store Closed', 'Store is not accepting orders at the moment. Please try again later.');
      return;
    }
    console.log('Button pressed!');
    if (Platform.OS === 'android') {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;
    }
    try {
      const res = await pick({
        type: [types.allFiles],
        multiple: true,
      });
      if (Array.isArray(res)) {
        for (const file of res) {
          await handleFileUpload({
            uri: file.uri,
            name: file.name,
            type: file.type,
          });
        }
      } else if (res) {
        await handleFileUpload({
          uri: res.uri,
          name: res.name,
          type: res.type,
        });
      }
    } catch (err) {
      if (isCancel(err)) {
        console.log('User canceled the picker');
      } else {
        showAlert('File Picker Error', 'Could not pick file.');
      }
    }
  };

  // Quick action: pick from camera
  const pickFromCamera = async () => {
    try {
      const image = await ImagePicker.openCamera({
        cropping: false,
        mediaType: 'photo',
      });
      await handleFileUpload({
        uri: image.path,
        name: image.filename || `photo_${Date.now()}.jpg`,
        type: image.mime,
        size: image.size,
        pages: 1,
      });
    } catch (err) {
      if (err.code !== 'E_PICKER_CANCELLED') {
        showAlert('Camera Error', 'Could not take photo.');
      }
    }
  };

  // Quick action: pick from gallery (multi-select)
  const pickFromGallery = async () => {
    try {
      const images = await ImagePicker.openPicker({
        multiple: true,
        maxFiles: 20,
        cropping: false,
        mediaType: 'photo',
      });
      if (Array.isArray(images)) {
        for (const image of images) {
          await handleFileUpload({
            uri: image.path,
            name: image.filename || `gallery_${Date.now()}.jpg`,
            type: image.mime,
            size: image.size,
            pages: 1,
          });
        }
      } else if (images) {
        await handleFileUpload({
          uri: images.path,
          name: images.filename || `gallery_${Date.now()}.jpg`,
          type: images.mime,
          size: images.size,
          pages: 1,
        });
      }
    } catch (err) {
      if (err.code !== 'E_PICKER_CANCELLED') {
        showAlert('Gallery Error', 'Could not pick image.');
      }
    }
  };

  // Remove sliding animation from file cards and improve progress bar
  const renderFileCard = (file, index) => (
    <View key={file.id} style={styles.fileCard}>
      <TouchableOpacity
        style={styles.fileInfo}
        onPress={() => openFilePreview(file)}
      >
        <View style={styles.fileIconContainer}>
          <Icon name="description" size={24} color="#667eea" />
          {file.source && (
            <View style={styles.sourceBadge}>
              <Icon name="cloud" size={12} color="white" />
            </View>
          )}
        </View>
        <View style={styles.fileDetails}>
          <Text style={styles.fileName}>{file.originalFilename || file.name}</Text>
          <Text style={styles.fileMeta}>
            {file.size ? (typeof file.size === 'number' ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : file.size) : ''}
            {file.pages ? ` • ${file.pages} pages` : ''} • {file.type || file.contentType}
          </Text>
          {file.status === 'uploading' && (
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 100, height: 100 }}>
              <LottieView
                source={require('../../assets/animations/Uploading-to-cloud.json')}
                autoPlay
                loop
                style={{ width: 80, height: 80 }}
              />
              <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{file.progress}%</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.fileActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => removeFile(file.id)}
        >
          <Icon name="close" size={16} color="#22194f" />
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEnhanceModal(file)}
        >
          <Icon name="auto-fix-high" size={20} color="#667eea" />
        </TouchableOpacity> */}
      </View>
    </View>
  );

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Helper to check if any file is uploading
  const isUploading = uploadedFiles.some(f => f.status === 'uploading');
  const uploadingCount = uploadedFiles.filter(f => f.status === 'uploading').length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#22194f', '#22194f']}
        style={styles.headerGradient}
      >
        <Heading
          title="Upload Files"
          subtitle="Select files to print"
          variant="primary"
        />
      </LinearGradient>

      <View style={styles.content}>
        {/* Stats Bar */}
        <Animatable.View animation="fadeInUp" delay={150} duration={500}>
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Icon name="description" size={20} color="#667eea" />
              <Text style={styles.statText}>{uploadedFiles.length} Files</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="storage" size={20} color="#667eea" />
              <Text style={styles.statText}>{totalSize.toFixed(1)} MB</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="wallet" size={20} color="#667eea" />
              <Text style={styles.statText}>₹{estimatedCost.toFixed(0)}</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Upload Area */}
        <Animatable.View animation="fadeInUp" delay={175} duration={500}>
          <TouchableOpacity
            style={styles.uploadArea}
            onPress={pickAndUploadFile}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#f8f9fa', '#e9ecef']}
              style={styles.uploadGradient}
            >
              <Icon name="folder" size={48} color="#667eea" style={styles.uploadIcon} />
              <Text style={styles.uploadTitle}>Tap to Upload Files</Text>
              <Text style={styles.uploadSubtitle}>
                Supported formats: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG
              </Text>
              <View style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>Choose Files</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <Animatable.View animation="fadeInUp" delay={200} duration={500}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Uploaded Files ({uploadedFiles.length})</Text>
            </View>
            
            {uploadedFiles.map((file, index) => renderFileCard(file, index))}
          </Animatable.View>
        )}

        {/* Quick Upload Options */}
        <Animatable.View animation="fadeInUp" delay={225} duration={500}>
          <Text style={styles.sectionTitle}>Quick Upload</Text>
          <View style={styles.quickUploadGrid}>
            <TouchableOpacity style={styles.quickUploadBtn} onPress={pickFromCamera}>
              <Icon name="photo-camera" size={28} color="#fff" />
              <Text style={styles.quickUploadText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickUploadBtn} onPress={pickFromGallery}>
              <Icon name="photo-library" size={28} color="#fff" />
              <Text style={styles.quickUploadText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Advanced Options */}
        {/* <Animatable.View animation="fadeInUp" delay={250} duration={500}>
          <Text style={styles.sectionTitle}>Advanced Options</Text>
          <View style={styles.optionsContainer}>
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Icon name="compress" size={20} color="#667eea" />
                <Text style={styles.optionText}>Compress Files</Text>
                <Text style={styles.optionSubtext}>Reduce file size</Text>
              </View>
              <Switch
                value={enableCompression}
                onValueChange={setEnableCompression}
                trackColor={{ false: '#e9ecef', true: '#667eea' }}
                thumbColor={enableCompression ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </Animatable.View> */}

        {/* Proceed Button */}
        {uploadedFiles.length > 0 && (
          <Animatable.View animation="fadeInUp" delay={275} duration={500}>
            <TouchableOpacity
              style={[
                styles.proceedButton,
                isUploading && { backgroundColor: '#43B581', opacity: 0.7 }
              ]}
              onPress={proceedToPrint}
              activeOpacity={0.9}
              disabled={isUploading}
            >
              <LinearGradient
                colors={isUploading ? ['#43B581', '#43B581'] : ['#FF6B6B', '#FF8E53']}
                style={styles.proceedGradient}
              >
                <Text style={styles.proceedText}>
                  {isUploading ? 'File is getting uploaded' : 'Continue to Print Options'}
                </Text>
                <Text style={styles.proceedSubtext}>
                  {isUploading
                    ? 'Please wait for upload to finish'
                    : `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} ready `}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        )}
      </View>

      {/* File Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>File Preview</Text>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {previewFile && (
                <View style={styles.previewContainer}>
                  <View style={styles.previewHeader}>
                    <Icon name="description" size={48} color="#667eea" />
                    <Text style={styles.previewFileName}>{previewFile.name}</Text>
                    <Text style={styles.previewFileMeta}>
                      {previewFile.size} • {previewFile.pages} pages • {previewFile.type}
                    </Text>
                  </View>
                  <View style={styles.previewPlaceholder}>
                    <Icon name="visibility" size={64} color="#ccc" />
                    <Text style={styles.previewPlaceholderText}>File Preview</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Document Enhancement Modal */}
      <Modal
        visible={showEnhanceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEnhanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enhance Document</Text>
              <TouchableOpacity onPress={() => setShowEnhanceModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {enhanceFile && (
                <View style={styles.enhanceContainer}>
                  <Text style={styles.enhanceFileName}>{enhanceFile.name}</Text>
                  <View style={styles.enhanceOptions}>
                    <TouchableOpacity style={styles.enhanceOption}>
                      <Icon name="auto-fix-high" size={24} color="#667eea" />
                      <Text style={styles.enhanceOptionText}>Auto Enhance</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.enhanceOption}>
                      <Icon name="crop" size={24} color="#667eea" />
                      <Text style={styles.enhanceOptionText}>Crop</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.enhanceOption}>
                      <Icon name="brightness-6" size={24} color="#667eea" />
                      <Text style={styles.enhanceOptionText}>Brightness</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.enhanceOption}>
                      <Icon name="contrast" size={24} color="#667eea" />
                      <Text style={styles.enhanceOptionText}>Contrast</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
      <Modal
        visible={isUploading}
        transparent
        animationType="slide"
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ width: '100%', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, alignItems: 'center', padding: 32, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 }}>
            <LottieView
              source={require('../../assets/animations/Uploading-to-cloud.json')}
              autoPlay
              loop
              style={{ width: 120, height: 120 }}
            />
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>
              Uploading {uploadingCount} file{uploadingCount > 1 ? 's' : ''}...
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

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
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 4,
  },
  uploadArea: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
  },
  uploadGradient: {
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  uploadIcon: {
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  fileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  sourceBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#667eea',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    marginTop: 8,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  progressText: {
    position: 'absolute',
    right: 0,
    top: -18,
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickUploadGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  quickUploadBtn: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#22194f',
    borderRadius: 20,
    width: 150,
  },
  quickUploadText: {
    marginTop: 6,
    color: '#fff',
    fontWeight: 'bold',
  },
  optionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  optionSubtext: {
    fontSize: 12,
    color: '#666',
    marginLeft: 12,
  },
  proceedButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalBody: {
    padding: 20,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewFileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  previewFileMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  previewPlaceholder: {
    width: width - 80,
    height: 300,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  previewPlaceholderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  enhanceContainer: {
    alignItems: 'center',
  },
  enhanceFileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  enhanceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  enhanceOption: {
    width: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  enhanceOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 8,
  },
  progressBarWrap: {
    height: 18,
    backgroundColor: '#e3e8fd',
    borderRadius: 9,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 2,
    justifyContent: 'center',
  },
  progressBarDynamic: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'linear-gradient(90deg, #667eea 0%, #42e695 100%)', // fallback for RN, use solid color
    backgroundColor: '#667eea',
    borderRadius: 9,
    height: 18,
  },
  progressPercent: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    zIndex: 2,
  },
});