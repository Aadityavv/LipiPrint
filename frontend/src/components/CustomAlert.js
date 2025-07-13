import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const typeConfig = {
  info:   { color: '#667eea', icon: 'info' },
  error:  { color: '#ff4757', icon: 'error-outline' },
  success:{ color: '#2ecc71', icon: 'check-circle' },
  warning:{ color: '#f1c40f', icon: 'warning-amber' },
};

export default function CustomAlert({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
  type = 'info',
  loading = false,
  progress = null,
}) {
  const { color, icon } = typeConfig[type] || typeConfig.info;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={styles.cardWrap}>
          <View style={[styles.topBar, { backgroundColor: color }]} />
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={loading}>
            <Icon name="close" size={22} color="#888" />
          </TouchableOpacity>
          <View style={styles.iconCircle}>
            <Icon name={icon} size={36} color={color} />
          </View>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <Text style={styles.message}>{message}</Text>
          {loading ? (
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <ActivityIndicator size="large" color={color} />
              {progress !== null && (
                <Text style={{ marginTop: 10, fontSize: 16, color: color }}>
                  {typeof progress === 'number' ? `Deleting... ${progress}%` : progress}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.buttonRow}>
              {showCancel && (
                <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={onClose}>
                  <Text style={styles.cancelText}>{cancelText}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={onConfirm || onClose}>
                <Text style={styles.confirmText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrap: {
    // height: 240,
    width: 240,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingTop: 0,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12,
    position: 'relative',
  },
  topBar: {
  //  width: 40, 
    height: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    padding: 6,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 10,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
    marginTop: 2,
  },
  message: {
    fontSize: 16,
    color: '#444',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginLeft: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#eee',
  },
  cancelText: {
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 