import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Platform, Alert, Linking, Share } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import CustomAlert from '../../components/CustomAlert';
import api from '../../services/api';
import RNFS from 'react-native-fs';
import Heading from '../../components/Heading';

export default function AdminOrderDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' });
  const [printedFiles, setPrintedFiles] = useState([]);
  const [printingFileIdx, setPrintingFileIdx] = useState(null);
  const [downloadingFile, setDownloadingFile] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.request(`/orders/${orderId}`);
      setOrder(res);
      setPrintedFiles(res.printJobs ? res.printJobs.filter(pj => pj.status === 'COMPLETED').map(pj => pj.file?.id) : []);
    } catch (e) {
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // Helper to truncate long filenames
  const truncateFilename = (filename, maxLength = 25) => {
    if (!filename) return '';
    if (filename.length <= maxLength) return filename;
    
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    
    if (nameWithoutExt.length <= maxLength - extension.length - 5) {
      return filename;
    }
    
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 5);
    return `${truncatedName}...${extension}`;
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={styles.loadingText}>Loading order details...</Text>
    </View>
  );
  
  if (error) return (
    <View style={styles.errorContainer}>
      <Icon name="error-outline" size={48} color="#EF4444" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchOrder}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
  
  if (!order) return (
    <View style={styles.errorContainer}>
      <Icon name="inbox" size={48} color="#9CA3AF" />
      <Text style={styles.errorText}>No order data available</Text>
    </View>
  );

  const { user, status, totalAmount, createdAt } = order;
  const printJobs = order.printJobs || [];
  const files = printJobs.map(pj => pj.file);

  // Status badge color and icon
  const statusConfig = {
    PENDING: { color: '#F59E0B', icon: 'hourglass-empty', label: 'Pending' },
    PROCESSING: { color: '#3B82F6', icon: 'autorenew', label: 'Processing' },
    COMPLETED: { color: '#10B981', icon: 'check-circle', label: 'Completed' },
    CANCELLED: { color: '#EF4444', icon: 'cancel', label: 'Cancelled' },
    DELIVERED: { color: '#66BB6A', icon: 'local-shipping', label: 'Delivered' },
  };
  
  const currentStatus = statusConfig[status] || { color: '#9CA3AF', icon: 'help', label: status };

  // File type icon helper
  const getFileIcon = (filename) => {
    if (!filename) return 'insert-drive-file';
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'picture-as-pdf';
    if (['doc', 'docx'].includes(ext)) return 'description';
    if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image';
    return 'insert-drive-file';
  };

  // Helper to get absolute URL
  const getAbsoluteUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Replace with your actual API base URL
    return `https://lipiprint-freelance.onrender.com${url.startsWith('/') ? url : '/' + url}`;
  };

  // Toggle tick (printed) state
  const handleToggleTick = async (file, idx, printJobId) => {
    if (printedFiles.includes(file.id)) {
      // Remove tick
      setPrintedFiles(prev => prev.filter(id => id !== file.id));
      // Update print job status to PRINTING
      await api.request(`/print-jobs/${printJobId}/status?status=PRINTING`, { method: 'PUT' });
      // If no files are ticked, set order to PENDING; else PRINTING
      if (printedFiles.length - 1 === 0) {
        await api.request(`/orders/${orderId}/status?status=PENDING`, { method: 'PUT' });
      } else {
        await api.request(`/orders/${orderId}/status?status=PRINTING`, { method: 'PUT' });
      }
    }
    fetchOrder();
  };

  // Print workflow - using native capabilities without RNPrint
  const handlePrintFile = async (file, idx, printJobId) => {
    if (!file?.url) {
      Alert.alert('No File', 'No file available to print.');
      return;
    }
    
    try {
      // 1. Update print job status to PRINTING
      await api.request(`/print-jobs/${printJobId}/status?status=PRINTING`, { method: 'PUT' });
      
      // 2. Get the absolute URL
      const fileUrl = getAbsoluteUrl(file.url);
      
      // 3. Check file type
      const isPdf = file.originalFilename?.toLowerCase().endsWith('.pdf');
      
      if (isPdf) {
        // For PDF files, open in Google Docs Viewer which has a print option
        const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}`;
        await Linking.openURL(googleDocsUrl);
      } else {
        // For other files, download and share to let user choose a printing app
        setDownloadingFile(true);
        const fileName = file.originalFilename || `file_${idx}`;
        const tempPath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;
        
        // Download the file
        await RNFS.downloadFile({
          fromUrl: fileUrl,
          toFile: tempPath,
          progress: (res) => {
            console.log(`Download progress: ${Math.round((res.bytesWritten / res.contentLength) * 100)}%`);
          },
        }).promise;
        
        setDownloadingFile(false);
        
        // Share the file so user can choose an app to print with
        await Share.open({
          url: `file://${tempPath}`,
          title: 'Print File',
          subject: 'Print this file',
          message: 'Choose an app to print this file',
        });
        
        // Clean up temporary file
        await RNFS.unlink(tempPath);
      }
      
      // 4. Show modal to confirm printing
      setPrintingFileIdx(idx);
      setShowPrintModal(true);
    } catch (e) {
      console.error('Print error:', e);
      setDownloadingFile(false);
      
      // Fallback to opening in browser
      Alert.alert(
        'Print Option',
        'Unable to open print dialog. Would you like to open the file in a browser where you can print it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open in Browser', 
            onPress: async () => {
              await Linking.openURL(getAbsoluteUrl(file.url));
              setPrintingFileIdx(idx);
              setShowPrintModal(true);
            }
          }
        ]
      );
    }
  };

  // Called when admin confirms printing is complete
  const confirmPrintingComplete = async () => {
    setShowPrintModal(false);
    if (printingFileIdx == null) return;
    const file = files[printingFileIdx];
    const printJob = printJobs[printingFileIdx];
    
    // 1. Mark file as printed (tick)
    setPrintedFiles(prev => [...prev, file.id]);
    // 2. Update print job status to COMPLETED
    await api.request(`/print-jobs/${printJob.id}/status?status=COMPLETED`, { method: 'PUT' });
    // 3. If all files printed, update order status to COMPLETED
    if (printedFiles.length + 1 === files.length) {
      await api.request(`/orders/${orderId}/status?status=COMPLETED`, { method: 'PUT' });
      Alert.alert('Order Completed', 'All files printed. Order marked as completed.');
      fetchOrder();
    }
    setPrintingFileIdx(null);
  };

  // Download logic
  const handleDownloadFile = async (file) => {
    if (!file?.url) {
      Alert.alert('No File', 'No file available to download.');
      return;
    }
    
    try {
      const fileUrl = getAbsoluteUrl(file.url);
      // Open the URL for download
      await Linking.openURL(fileUrl);
    } catch (e) {
      console.error('Download error:', e);
      Alert.alert('Download Failed', 'Failed to download the file. Please try again.');
    }
  };

  // Group print jobs by bindingGroups if present, else by print options
  function groupPrintJobsByBindingOrOptions(printJobs, bindingGroups) {
    if (bindingGroups && Array.isArray(bindingGroups) && bindingGroups.length > 0) {
      // Group by bindingGroups (array of arrays of file IDs)
      return bindingGroups.map((group, idx) => {
        const jobs = printJobs.filter(pj => group.includes(pj.file?.id));
        return { groupLabel: `Binding Group ${idx + 1}`, jobs, options: jobs[0]?.options };
      });
    } else {
      // Fallback: group by print options
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
          seen.set(optionsKey, { options: pj.options, jobs: [pj] });
        } else {
          seen.get(optionsKey).jobs.push(pj);
        }
      });
      return Array.from(seen.values()).map((g, idx) => ({ groupLabel: `Print Group ${idx + 1}`, jobs: g.jobs, options: g.options }));
    }
  }

  // Parse bindingGroups from order (may be stringified JSON)
  let bindingGroups = order.bindingGroups;
  if (typeof bindingGroups === 'string') {
    try { bindingGroups = JSON.parse(bindingGroups); } catch { bindingGroups = []; }
  }
  const printJobGroups = groupPrintJobsByBindingOrOptions(printJobs, bindingGroups);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <TouchableOpacity onPress={fetchOrder} style={styles.refreshButton}>
            <Icon name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SUMMARY CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderId}>Order #{order.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: currentStatus.color }]}>
              <Icon name={currentStatus.icon} size={14} color="white" />
              <Text style={styles.statusText}>{currentStatus.label}</Text>
            </View>
          </View>
          
          <View style={styles.cardRow}>
            <View style={styles.dateContainer}>
              <Icon name="event" size={16} color="#6B7280" />
              <Text style={styles.dateText}>{createdAt?.split('T')[0]}</Text>
            </View>
            <Text style={styles.amount}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* USER INFO */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Icon name="person" size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Customer Information</Text>
          </View>
          
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Icon name="account-circle" size={40} color="#D1D5DB" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || '-'}</Text>
              <Text style={styles.userDetail}>
                <Icon name="phone" size={14} color="#6B7280" /> {user?.phone || '-'}
              </Text>
              <Text style={styles.userDetail}>
                <Icon name="email" size={14} color="#6B7280" /> {user?.email || '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* FILES */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Icon name="description" size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Files</Text>
          </View>
          
          {files.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="folder-open" size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>No files available</Text>
            </View>
          ) : (
            files.map((file, idx) => (
              <View key={file.id || idx} style={styles.fileItem}>
                <View style={styles.fileInfo}>
                  <Icon name={getFileIcon(file.originalFilename)} size={24} color="#4F46E5" />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{truncateFilename(file.originalFilename)}</Text>
                    <Text style={styles.fileMeta}>
                      {file.pages || '-'} pages • {file.createdAt?.split('T')[0] || '-'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.fileActions}>
                  {printedFiles.includes(file.id) && (
                    <TouchableOpacity 
                      style={styles.printedBadge} 
                      onPress={() => handleToggleTick(file, idx, printJobs[idx]?.id)}
                    >
                      <Icon name="check-circle" size={20} color="#10B981" />
                    </TouchableOpacity>
                  )}
                  
                  {file.url && (
                    <>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.downloadButton]}
                        onPress={() => handleDownloadFile(file)}
                      >
                        <Icon name="file-download" size={18} color="#4F46E5" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.printButton]}
                        onPress={() => handlePrintFile(file, idx, printJobs[idx]?.id)}
                        disabled={downloadingFile}
                      >
                        {downloadingFile ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Icon name="print" size={18} color="white" />
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* PRINT JOB GROUPS */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Icon name="layers" size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Print Job Groups</Text>
          </View>
          
          {printJobGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="print-disabled" size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>No print jobs available</Text>
            </View>
          ) : (
            printJobGroups.map((group, gidx) => {
              let specs = {};
              try {
                specs = typeof group.options === 'string' ? JSON.parse(group.options) : group.options;
              } catch { specs = {}; }
              
              return (
                <View key={gidx} style={styles.printGroup}>
                  <Text style={styles.groupLabel}>{group.groupLabel}</Text>
                  
                  <View style={styles.optionsSection}>
                    <Text style={styles.optionsTitle}>Print Options</Text>
                    {Object.entries(specs).map(([key, value]) => (
                      <Text key={key} style={styles.optionItem}>
                        {key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())}: {String(value)}
                      </Text>
                    ))}
                  </View>
                  
                  <View style={styles.filesSection}>
                    <Text style={styles.filesTitle}>Files</Text>
                    {group.jobs.map((pj, fidx) => (
                      <View key={fidx} style={styles.groupFileItem}>
                        <Text style={styles.groupFileName}>{truncateFilename(pj.file?.originalFilename || pj.file?.name)}</Text>
                        <Text style={styles.groupFileMeta}>
                          {pj.file?.pages || '-'} pages • {pj.file?.createdAt?.split('T')[0] || '-'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ORDER NOTE */}
        {order.orderNote && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Icon name="sticky-note-2" size={20} color="#4F46E5" />
              <Text style={styles.sectionTitle}>Order Note</Text>
            </View>
            <Text style={styles.noteText}>{order.orderNote}</Text>
          </View>
        )}

        {/* ORDER STATUS */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Icon name="info" size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Order Status</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Current Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: currentStatus.color }]}>
                <Icon name={currentStatus.icon} size={14} color="white" />
                <Text style={styles.statusText}>{currentStatus.label}</Text>
              </View>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Total Amount:</Text>
              <Text style={styles.statusValue}>₹{totalAmount}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* PRINT CONFIRMATION MODAL */}
      <CustomAlert
        visible={showPrintModal}
        title="Printing Complete?"
        message="Did the file print successfully?"
        type="info"
        onClose={() => { setShowPrintModal(false); setPrintingFileIdx(null); }}
        onConfirm={confirmPrintingComplete}
        confirmText="Yes"
        cancelText="No"
        showCancel={true}
      />

      {/* GENERAL ALERT */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(a => ({ ...a, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  printedBadge: {
    padding: 6,
    marginRight: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  downloadButton: {
    backgroundColor: '#EEF2FF',
  },
  printButton: {
    backgroundColor: '#4F46E5',
  },
  printGroup: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  optionsSection: {
    marginBottom: 12,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 4,
  },
  optionItem: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 2,
    marginLeft: 8,
  },
  filesSection: {
    marginBottom: 4,
  },
  filesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 4,
  },
  groupFileItem: {
    marginLeft: 8,
    marginBottom: 8,
  },
  groupFileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  groupFileMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  noteText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  statusContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4B5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});