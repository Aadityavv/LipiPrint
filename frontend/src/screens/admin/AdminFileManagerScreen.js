import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
import LinearGradient from 'react-native-linear-gradient';

export default function AdminFileManagerScreen({ navigation }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

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

  const renderFile = ({ item }) => (
    <View style={styles.fileRow}>
      <Icon name="insert-drive-file" size={22} color="#667eea" style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.fileName}>{item.originalFilename || item.filename}</Text>
        <Text style={styles.fileMeta}>Size: {item.size ? `${(item.size / (1024*1024)).toFixed(2)} MB` : '?'} | Uploaded: {item.createdAt?.slice(0, 10) || '-'}</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)} disabled={deletingId === item.id}>
        {deletingId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="delete" size={20} color="#fff" />}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>File Manager</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#667eea" /></View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#e53935' }}>{error}</Text></View>
      ) : (
        <FlatList
          data={files}
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
}); 