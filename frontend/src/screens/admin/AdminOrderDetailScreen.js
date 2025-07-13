import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import CustomAlert from '../../components/CustomAlert';
import api from '../../services/api';
import RNFS from 'react-native-fs';
import RNPrint from 'react-native-print';

export default function AdminOrderDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' });

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.request(`/orders/${orderId}`);
        setOrder(res);
      } catch (e) {
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#667eea" /><Text>Loading order...</Text></View>;
  if (error) return <View style={styles.center}><Text>{error}</Text></View>;
  if (!order) return <View style={styles.center}><Text>No order data</Text></View>;

  const { user, status, totalAmount, createdAt } = order;
  const printJobs = order.printJobs || [];
  const files = printJobs.map(pj => pj.file);

  // Helper to get parsed specs for a printJob
  const getSpecs = (options) => {
    if (!options) return null;
    if (typeof options === 'string') {
    try {
        return JSON.parse(options);
    } catch (e) {
        return null;
      }
    } else if (typeof options === 'object') {
      return options;
    }
    return null;
  };

  // Status badge color and icon
  const statusColors = {
    PENDING: '#FF9800',
    PROCESSING: '#42A5F5',
    COMPLETED: '#4CAF50',
    CANCELLED: '#F44336',
    DELIVERED: '#66BB6A',
  };
  const statusIcons = {
    PENDING: 'hourglass-empty',
    PROCESSING: 'autorenew',
    COMPLETED: 'check-circle',
    CANCELLED: 'cancel',
    DELIVERED: 'local-shipping',
  };
  const statusLabel = (status || '').toUpperCase();

  // File type icon helper
  const getFileIcon = (filename) => {
    if (!filename) return 'insert-drive-file';
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'picture-as-pdf';
    if (['doc', 'docx'].includes(ext)) return 'description';
    if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image';
    return 'insert-drive-file';
  };

  const handleDownloadFile = async (file) => {
    if (!file?.url) return;
    try {
      const dest = RNFS.DocumentDirectoryPath + '/' + (file.originalFilename || 'downloaded_file.pdf');
      await RNFS.downloadFile({ fromUrl: file.url, toFile: dest }).promise;
      setAlert({ visible: true, title: 'Download Complete', message: 'File saved to: ' + dest, type: 'success' });
    } catch (e) {
      setAlert({ visible: true, title: 'Download Failed', message: e.message, type: 'error' });
    }
  };

  const handlePrintFile = async (file) => {
    if (!file?.url) return;
    try {
      await RNPrint.print({ filePath: file.url });
    } catch (e) {
      setAlert({ visible: true, title: 'Print Failed', message: e.message, type: 'error' });
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f6fa' }} contentContainerStyle={{ padding: 0 }}>
      {/* HEADER */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradientHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrder}>
            <Icon name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      {/* SUMMARY CARD */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryOrderId}>Order #{order.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[statusLabel] || '#aaa' }]}> 
            <Icon name={statusIcons[statusLabel] || 'info'} size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryDate}><Icon name="event" size={15} color="#764ba2" /> {createdAt?.split('T')[0]}</Text>
          <Text style={styles.summaryAmount}>₹{totalAmount}</Text>
        </View>
      </View>
      {/* USER INFO */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Icon name="person" size={20} color="#667eea" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>User Info</Text>
        </View>
        <View style={styles.userInfoRow}>
          <Icon name="account-circle" size={36} color="#bbb" style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.userName}>{user?.name || '-'}</Text>
            <Text style={styles.userContact}>Phone: {user?.phone || '-'}</Text>
            <Text style={styles.userContact}>Email: {user?.email || '-'}</Text>
          </View>
        </View>
      </View>
      {/* FILES */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Icon name="description" size={20} color="#667eea" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Files</Text>
          </View>
        {files.length === 0 ? <Text style={styles.emptyText}>No files</Text> : files.map((file, idx) => (
          <View key={file.id || idx} style={styles.fileRow}>
            <Icon name={getFileIcon(file.originalFilename)} size={22} color="#667eea" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName}>{file.originalFilename || '-'}</Text>
              <Text style={styles.fileMeta}>Pages: {file.pages || '-'} | Uploaded: {file.createdAt?.split('T')[0] || '-'}</Text>
            </View>
              {file.url && (
              <View style={styles.fileActions}>
                <TouchableOpacity style={styles.fileActionBtn} onPress={() => handleDownloadFile(file)}>
                  <Icon name="file-download" size={20} color="#42A5F5" />
                  </TouchableOpacity>
                <TouchableOpacity style={styles.fileActionBtn} onPress={() => handlePrintFile(file)}>
                  <Icon name="print" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      {/* PRINTING SPECS */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Icon name="settings" size={20} color="#667eea" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Printing Specifications</Text>
        </View>
        {printJobs.length === 0 ? (
          <Text style={styles.emptyText}>No specifications</Text>
        ) : (
          printJobs.map((pj, idx) => {
            const specs = getSpecs(pj.options);
            return (
              <View key={pj.id || idx} style={{ marginBottom: 10 }}>
                <Text style={{ fontWeight: 'bold', color: '#333', marginBottom: 2 }}>{pj.file?.originalFilename || `File #${idx + 1}`}</Text>
                {specs ? (
                  Object.entries(specs).map(([key, value]) => (
                    <Text style={styles.specText} key={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {value}</Text>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No specifications</Text>
                )}
              </View>
            );
          })
        )}
      </View>
      {/* ORDER STATUS */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Icon name="info" size={20} color="#667eea" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Order Status</Text>
        </View>
        <Text style={styles.statusText}>Status: {status}</Text>
        <Text style={styles.statusText}>Total Amount: ₹{totalAmount}</Text>
      </View>
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(a => ({ ...a, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f6fa' },
  gradientHeader: {
    paddingTop: 32,
    paddingBottom: 18,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  refreshBtn: {
    padding: 8,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 14,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryOrderId: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#222',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#667eea',
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  summaryDate: {
    fontSize: 13,
    color: '#888',
  },
  summaryAmount: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#667eea',
  },
  sectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#667eea',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  userContact: {
    fontSize: 13,
    color: '#555',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f7f8fa',
    borderRadius: 8,
    padding: 10,
  },
  fileName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  fileMeta: {
    fontSize: 12,
    color: '#888',
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  fileActionBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#e3e9fa',
    marginLeft: 4,
  },
  emptyText: {
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 4,
  },
  specText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
}); 