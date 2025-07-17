import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import ApiService from '../../services/api';
import FileItem from '../../components/FileItem';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import CustomAlert from '../../components/CustomAlert';
import Heading from '../../components/Heading';

export default function FilesScreen({ navigation }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [alertConfirm, setAlertConfirm] = useState(null);
  const [alertShowCancel, setAlertShowCancel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const showAlert = (title, message, type = 'info', onConfirm = null, showCancel = false) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertConfirm(() => onConfirm);
    setAlertShowCancel(showCancel);
    setAlertVisible(true);
  };

  const loadFiles = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const filesData = await ApiService.getFiles();
      setFiles(filesData);
    } catch (e) {
      setError('Could not load your uploaded files. Please check your connection and try again.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFiles(false);
    setRefreshing(false);
  };

  const canDeleteFile = (file) => {
    if (!file.orders || file.orders.length === 0) return true;
    return file.orders.every(order => order.status === 'DELIVERED' || order.status === 'COMPLETED');
  };

  const handleDelete = (file) => {
    if (!canDeleteFile(file)) {
      showAlert(
        'Cannot Delete File',
        'This file is still linked to an order that is not yet delivered or completed. You can only delete files that are not in use or have been fully processed.',
        'warning'
      );
      return;
    }
    showAlert(
      'Delete File',
      `Are you sure you want to delete "${file.originalFilename || file.filename}"? This action cannot be undone.`,
      'error',
      () => deleteFile(file.id),
      true
    );
  };

  const deleteFile = async (fileId) => {
    setAlertVisible(false);
    try {
      await ApiService.deleteFile(fileId);
      setFiles(files.filter(f => f.id !== fileId));
      showAlert('File Deleted', 'The file has been deleted successfully.', 'success');
    } catch (e) {
      showAlert('Delete Failed', 'Could not delete the file. It may be in use or there was a server error.', 'error');
    }
  };

  if (loading) return <View style={styles.center}><Text>Loading files...</Text></View>;
  if (error) return <View style={styles.center}><Text>{error}</Text></View>;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#22194f', '#22194f']}
        style={styles.headerGradient}
      >
        <Heading
          title="My Uploaded Files"
          variant="primary"
        />
      </LinearGradient>
      <View style={styles.listArea}>
        <FlatList
          data={files}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <FileItem
              file={item}
              onDelete={() => handleDelete(item)}
              canDelete={canDeleteFile(item)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No files uploaded yet.</Text>}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      </View>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertConfirm}
        showCancel={alertShowCancel}
        confirmText={alertShowCancel ? 'Delete' : 'OK'}
        cancelText="Cancel"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.5,
  },
  headerRefreshBtn: {
    position: 'absolute',
    right: 0,
    top: 2,
    padding: 6,
  },
  listArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#888', marginTop: 32 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginTop: 16 },
  refreshText: { color: '#667eea', marginLeft: 8, fontWeight: 'bold' },
}); 