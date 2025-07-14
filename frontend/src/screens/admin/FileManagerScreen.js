import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, TextInput, Modal, Image, Dimensions, Linking, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Heading from '../../components/Heading';

const FileManagerScreen = ({ navigation }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [alertConfirm, setAlertConfirm] = useState(null);
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertProgress, setAlertProgress] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [previewFile, setPreviewFile] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertConfirm(() => onConfirm);
    setAlertVisible(true);
    setAlertLoading(false);
    setAlertProgress(null);
  };

  const fetchFiles = async () => {
    setLoading(true);
    console.log('Fetching delivered files using api.getAdminDeliveredFiles()...');
    try {
      const res = await api.getAdminDeliveredFiles();
      console.log('Delivered files fetched:', res);
      setFiles(res);
    } catch (e) {
      console.error('Failed to fetch files:', e);
      showAlert('Error', 'Failed to fetch files.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedFiles(new Set());
    }
  };

  const toggleFileSelection = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleDelete = (fileId) => {
    showAlert(
      'Delete File from Firebase',
      'Are you sure you want to delete this delivered file from Firebase Storage? The file will remain in the database for record keeping.',
      'warning',
      () => deleteFile(fileId)
    );
  };

  const handleBulkDelete = () => {
    if (selectedFiles.size === 0) {
      showAlert('No Files Selected', 'Please select files to delete.', 'info');
      return;
    }

    showAlert(
      'Delete Multiple Files',
      `Are you sure you want to delete ${selectedFiles.size} file(s) from Firebase Storage? The files will remain in the database for record keeping.`,
      'warning',
      () => deleteMultipleFiles()
    );
  };

  const deleteFile = async (fileId) => {
    setAlertLoading(true);
    setAlertProgress(null);
    setDeletingId(fileId);
    try {
      const result = await api.deleteAdminFile(fileId);
      setFiles(files.filter(f => f.id !== fileId));
      setAlertVisible(false);
      showAlert('Success', 'File deleted from Firebase successfully.', 'success');
    } catch (e) {
      setAlertVisible(false);
      showAlert('Error', `Failed to delete file from Firebase: ${e.message}`, 'error');
    } finally {
      setDeletingId(null);
      setAlertLoading(false);
      setAlertProgress(null);
    }
  };

  const deleteMultipleFiles = async () => {
    const filesToDelete = Array.from(selectedFiles);
    setAlertLoading(true);
    setAlertProgress(0);
    try {
      for (let i = 0; i < filesToDelete.length; i++) {
        await api.deleteAdminFile(filesToDelete[i]);
        setAlertProgress(Math.round(((i + 1) / filesToDelete.length) * 100));
      }
      setFiles(files.filter(f => !selectedFiles.has(f.id)));
      setSelectedFiles(new Set());
      setSelectionMode(false);
      setAlertVisible(false);
      showAlert('Success', `${filesToDelete.length} file(s) deleted from Firebase successfully.`, 'success');
    } catch (e) {
      setAlertVisible(false);
      showAlert('Error', 'Failed to delete some files from Firebase.', 'error');
    } finally {
      setAlertLoading(false);
      setAlertProgress(null);
    }
  };

  // Filter and sort files
  const filteredFiles = files
    .filter(f => (f.name || f.fileName || f.originalFilename || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') return (b.createdAt || '').localeCompare(a.createdAt || '');
      if (sortBy === 'name') return (a.name || a.fileName || a.originalFilename || '').localeCompare(b.name || b.fileName || b.originalFilename || '');
      return 0;
    });

  // Helper to get file URL
  const getFileUrl = (item) => item.url || item.fileUrl || item.downloadUrl || item.path || '';
  // Helper to get file extension
  const getFileExt = (item) => {
    const name = item.name || item.fileName || item.originalFilename || '';
    return name.split('.').pop().toLowerCase();
  };
  // Helper to check if image
  const isImage = (ext) => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
  // Helper to check if PDF
  const isPDF = (ext) => ext === 'pdf';

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.card, 
        selectedFiles.has(item.id) && styles.selectedCard
      ]}
      onPress={() => selectionMode ? toggleFileSelection(item.id) : handleDelete(item.id)}
      onLongPress={() => {
        if (!selectionMode) {
          setSelectionMode(true);
          setSelectedFiles(new Set([item.id]));
        }
      }}
    >
      {selectionMode && (
        <View style={styles.checkboxContainer}>
          <Icon 
            name={selectedFiles.has(item.id) ? "check-box" : "check-box-outline-blank"} 
            size={24} 
            color={selectedFiles.has(item.id) ? "#4CAF50" : "#ccc"} 
          />
        </View>
      )}
      <Icon name="insert-drive-file" size={22} color="#667eea" style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.fileName}>{(() => { try { return decodeURIComponent(item.name || item.fileName || item.originalFilename || 'Unnamed File'); } catch (e) { return (item.name || item.fileName || item.originalFilename || 'Unnamed File').replace(/%20/g, ' '); } })()}</Text>
        <Text style={styles.fileInfo}>ID: {item.id}</Text>
        {item.uploadedBy && (
          <Text style={styles.fileInfo}>
            Uploaded by: {item.uploadedBy.name || item.uploadedBy.phone || 'Unknown User'}
          </Text>
        )}
        {item.size && (
          <Text style={styles.fileInfo}>
            Size: {(item.size / 1024).toFixed(1)} KB
          </Text>
        )}
        {item.pages && (
          <Text style={styles.fileInfo}>
            Pages: {item.pages}
          </Text>
        )}
      </View>
      <TouchableOpacity style={styles.actionBtn} onPress={() => { setPreviewFile(item); setPreviewVisible(true); }}>
        <Icon name="remove-red-eye" size={20} color="#667eea" />
      </TouchableOpacity>
      {!selectionMode && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item.id)}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <ActivityIndicator color="red" size={20} />
          ) : (
            <Icon name="delete" size={28} color="red" />
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <Heading
          title="File Manager"
          left={
            <TouchableOpacity onPress={() => navigation?.goBack && navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          }
          right={
            <TouchableOpacity onPress={fetchFiles} style={styles.refreshButton}>
              <Icon name="refresh" size={24} color="white" />
            </TouchableOpacity>
          }
          variant="primary"
        />
      </LinearGradient>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>All Files</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setSortBy('date')} style={[{ marginLeft: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#eee' }, sortBy === 'date' && { backgroundColor: '#667eea' }]}><Text style={{ color: '#333', fontWeight: 'bold' }}>Date</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setSortBy('name')} style={[{ marginLeft: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#eee' }, sortBy === 'name' && { backgroundColor: '#667eea' }]}><Text style={{ color: '#333', fontWeight: 'bold' }}>Name</Text></TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={{ marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, color: '#333', borderWidth: 1, borderColor: '#eee' }}
        placeholder="Search files by name..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#888"
      />
      {selectionMode && selectedFiles.size > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.selectedCount}>{selectedFiles.size} file(s) selected</Text>
          <TouchableOpacity style={styles.bulkDeleteBtn} onPress={handleBulkDelete}>
            <Icon name="delete-sweep" size={20} color="#fff" />
            <Text style={styles.bulkDeleteText}>Delete Selected</Text>
          </TouchableOpacity>
        </View>
      )}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : filteredFiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="folder-open" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Delivered Files</Text>
          <Text style={styles.emptySubtitle}>
            Only files with delivered orders are shown here. Try searching or check your filters.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          keyExtractor={item => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => alertLoading ? null : setAlertVisible(false)}
        onConfirm={alertLoading ? null : alertConfirm}
        showCancel={alertType === 'warning' && !alertLoading}
        confirmText={alertType === 'warning' ? 'Delete' : 'OK'}
        cancelText="Cancel"
        loading={alertLoading}
        progress={alertProgress}
      />
      {/* Preview Modal */}
      <Modal
        visible={previewVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 40, right: 30, zIndex: 2 }} onPress={() => setPreviewVisible(false)}>
            <Icon name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {previewFile && (() => {
            const url = getFileUrl(previewFile);
            const ext = getFileExt(previewFile);
            console.log('Previewing:', url, ext, previewFile);
            if (isImage(ext)) {
              return <Image source={{ uri: url }} style={{ width: Dimensions.get('window').width * 0.85, height: Dimensions.get('window').height * 0.7, resizeMode: 'contain', borderRadius: 10 }} />;
            } else if (isPDF(ext)) {
              // Lazy load react-native-pdf
              const Pdf = require('react-native-pdf').default;
              return <Pdf source={{ uri: url }} style={{ width: Dimensions.get('window').width * 0.85, height: Dimensions.get('window').height * 0.7, borderRadius: 10 }} />;
            } else {
              return <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="insert-drive-file" size={60} color="#fff" style={{ marginBottom: 20 }} />
                <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10 }}>Preview not supported for this file type.</Text>
                <TouchableOpacity onPress={() => Linking.openURL(url)} style={{ backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 }}>
                  <Text style={{ color: '#0058A3', fontWeight: 'bold' }}>Download / Open</Text>
                </TouchableOpacity>
              </View>;
            }
          })()}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    // padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop:20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  modeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  activeModeButton: {
    backgroundColor: '#4CAF50',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  activeModeButtonText: {
    color: '#fff',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  selectedCount: {
    fontSize: 14,
    color: '#555',
  },
  bulkDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  bulkDeleteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  checkboxContainer: {
    marginRight: 16,
    padding: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  fileInfo: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  deleteBtn: {
    marginLeft: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fbe9e7',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  headerImproved: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    backgroundColor: '#e8f5e9',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  titleImproved: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  subtitleImproved: {
    fontSize: 13,
    color: '#4CAF50',
    marginBottom: 2,
  },
  countImproved: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e0f2f7',
  },
});

export default FileManagerScreen; 