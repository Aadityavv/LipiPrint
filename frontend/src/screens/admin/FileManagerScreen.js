import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
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
      <View style={{ flex: 1 }}>
        <Text style={styles.fileName}>{item.name || item.fileName || item.originalFilename || 'Unnamed File'}</Text>
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
      ) : files.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="folder-open" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Delivered Files</Text>
          <Text style={styles.emptySubtitle}>
            Only files with delivered orders are shown here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={files}
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
});

export default FileManagerScreen; 