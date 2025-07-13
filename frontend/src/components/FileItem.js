import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function FileItem({ file, onDelete, canDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Icon name="insert-drive-file" size={32} color="#667eea" />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.filename} numberOfLines={1}>{file.originalFilename || file.filename}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{file.pages || 0} pages</Text>
          <Text style={styles.meta}>• {formatSize(file.size)}</Text>
          {file.createdAt && <Text style={styles.meta}>• {formatDate(file.createdAt)}</Text>}
        </View>
      </View>
      {canDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Icon name="delete" size={24} color="#F44336" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function formatSize(size) {
  if (!size) return '0 MB';
  if (typeof size === 'string') return size.includes('MB') ? size : `${(parseFloat(size) / (1024 * 1024)).toFixed(2)} MB`;
  if (typeof size === 'number') return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return '0 MB';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 16,
    backgroundColor: '#e3e8fd',
    borderRadius: 8,
    padding: 8,
  },
  infoContainer: {
    flex: 1,
  },
  filename: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  meta: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  deleteBtn: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#fdecea',
  },
});
