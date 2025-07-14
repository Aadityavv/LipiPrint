import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
import LinearGradient from 'react-native-linear-gradient';
import Heading from '../../components/Heading';

export default function AdminFileManagerScreen({ navigation }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.request('/files');
      setFiles(res);
    } catch (e) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleDelete = async (id) => {
    Alert.alert('Delete File', 'Are you sure you want to delete this file from Firebase and the database?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeletingId(id);
        try {
          await api.request(`/files/${id}`, { method: 'DELETE' });
          setFiles(files => files.filter(f => f.id !== id));
        } catch (e) {
          Alert.alert('Delete Failed', e.message || 'Could not delete file.');
        } finally {
          setDeletingId(null);
        }
      }}
    ]);
  };

  // Filter and sort files
  const filteredFiles = files
    .filter(f => (f.originalFilename || f.filename || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') return (b.createdAt || '').localeCompare(a.createdAt || '');
      if (sortBy === 'name') return (a.originalFilename || a.filename || '').localeCompare(b.originalFilename || b.filename || '');
      return 0;
    });

  const renderFile = ({ item }) => (
    <View style={styles.fileRow}>
      <TouchableOpacity onPress={() => setSelectedFiles(sel => sel.includes(item.id) ? sel.filter(id => id !== item.id) : [...sel, item.id])} style={{ marginRight: 8 }}>
        <Icon name={selectedFiles.includes(item.id) ? 'check-box' : 'check-box-outline-blank'} size={22} color="#667eea" />
      </TouchableOpacity>
      <Icon name="insert-drive-file" size={22} color="#667eea" style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.fileName}>{item.originalFilename || item.filename}</Text>
        <Text style={styles.fileMeta}>Size: {item.size ? `${(item.size / (1024*1024)).toFixed(2)} MB` : '?'} | Uploaded: {item.createdAt?.slice(0, 10) || '-'}{item.uploadedBy ? ` | By: ${item.uploadedBy.name || item.uploadedBy.email || ''}` : ''}</Text>
      </View>
      <TouchableOpacity style={styles.actionBtn} onPress={() => {/* TODO: Preview/download logic */}}>
        <Icon name="remove-red-eye" size={20} color="#667eea" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)} disabled={deletingId === item.id}>
        {deletingId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="delete" size={20} color="#fff" />}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.headerGradient}>
        <Heading
          title="File Manager"
          left={
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          }
          variant="primary"
        />
      </LinearGradient>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Files</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setSortBy('date')} style={[styles.sortBtn, sortBy === 'date' && styles.sortBtnActive]}><Text style={styles.sortBtnText}>Date</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setSortBy('name')} style={[styles.sortBtn, sortBy === 'name' && styles.sortBtnActive]}><Text style={styles.sortBtnText}>Name</Text></TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={styles.searchBar}
        placeholder="Search files by name..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#888"
      />
      {selectedFiles.length > 0 && (
        <View style={styles.batchBar}>
          <Text style={{ color: '#333' }}>{selectedFiles.length} selected</Text>
          <TouchableOpacity style={styles.batchDeleteBtn} onPress={() => {/* TODO: Batch delete logic */}}>
            <Icon name="delete" size={18} color="#fff" />
            <Text style={{ color: '#fff', marginLeft: 4 }}>Delete Selected</Text>
          </TouchableOpacity>
        </View>
      )}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#667eea" /></View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#e53935' }}>{error}</Text></View>
      ) : filteredFiles.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="cloud-off" size={60} color="#bbb" style={{ marginBottom: 10 }} />
          <Text style={{ color: '#888', fontSize: 16, textAlign: 'center' }}>No files found. Try uploading or check your search/filter.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          renderItem={renderFile}
          keyExtractor={item => item.id?.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerGradient: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  list: { padding: 20 },
  fileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  fileName: { fontWeight: 'bold', fontSize: 15, color: '#333' },
  fileMeta: { fontSize: 12, color: '#888' },
  deleteBtn: { marginLeft: 10, backgroundColor: '#e53935', borderRadius: 16, padding: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  sortBtn: { marginLeft: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#eee' },
  sortBtnActive: { backgroundColor: '#667eea' },
  sortBtnText: { color: '#333', fontWeight: 'bold' },
  searchBar: { marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, color: '#333', borderWidth: 1, borderColor: '#eee' },
  batchBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f1f3f6', padding: 10, marginHorizontal: 20, borderRadius: 8, marginBottom: 10 },
  batchDeleteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e53935', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  actionBtn: { marginLeft: 6, backgroundColor: '#f1f3f6', borderRadius: 16, padding: 8 },
}); 