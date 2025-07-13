import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Modal, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';

export default function SavedAddressesScreen({ navigation }) {
  const { theme } = useTheme();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formFields, setFormFields] = useState({ line1: '', line2: '', line3: '', phone: '' });
  const [editingId, setEditingId] = useState(null);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', onConfirm: null, showCancel: false });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUserAddresses();
      setAddresses(data || []);
    } catch (e) {
      setError('Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormFields({ line1: '', line2: '', line3: '', phone: '' });
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormFields({ line1: item.line1, line2: item.line2, line3: item.line3, phone: item.phone });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setFormFields({ line1: '', line2: '', line3: '', phone: '' });
  };

  const showAlert = (title, message, onConfirm = null, showCancel = false) => {
    setAlert({ visible: true, title, message, onConfirm, showCancel });
  };

  const hideAlert = () => setAlert({ ...alert, visible: false });

  const handleDelete = async (id) => {
    showAlert('Delete Address', 'Are you sure you want to delete this address?', async () => {
      hideAlert();
      try {
        await api.deleteUserAddress(id);
        setAddresses(addresses.filter(addr => addr.id !== id));
      } catch (e) {
        showAlert('Error', 'Failed to delete address.');
      }
    }, true);
  };

  const handleSave = async () => {
    if (!formFields.line1.trim() || !formFields.line2.trim() || !formFields.line3.trim() || !formFields.phone.trim()) {
      showAlert('All fields required', 'Please fill all address fields and phone.');
      return;
    }
    try {
      if (modalMode === 'add') {
        const added = await api.addUserAddress(formFields);
        setAddresses([...addresses, added]);
      } else if (modalMode === 'edit') {
        const updated = await api.updateUserAddress(editingId, formFields);
        setAddresses(addresses.map(addr => addr.id === editingId ? updated : addr));
      }
      closeModal();
    } catch (e) {
      showAlert('Error', 'Failed to save address.');
    }
  };

  const renderAddress = ({ item }) => (
    <Animatable.View animation="fadeInUp" duration={500} style={[styles.addressCard, { backgroundColor: theme.card }]}>
      <View style={[styles.cardRow, { borderBottomColor: theme.border }]}>
        <Icon name="location-on" size={28} color={theme.text} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.addressLabel, { color: theme.text }]}>Address</Text>
          <Text style={[styles.addressText, { color: theme.text }]}>{item.line1}</Text>
          <Text style={[styles.addressText, { color: theme.text }]}>{item.line2}</Text>
          <Text style={[styles.addressText, { color: theme.text }]}>{item.line3}</Text>
          <Text style={[styles.addressLabel, { color: theme.text }]}>Phone</Text>
          <Text style={[styles.addressPhone, { color: theme.text }]}>{item.phone}</Text>
        </View>
        <View style={[styles.cardActions, { borderTopColor: theme.border }]}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.background }]} onPress={() => openEditModal(item)} accessibilityLabel="Edit address">
            <Icon name="edit" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.background }]} onPress={() => handleDelete(item.id)} accessibilityLabel="Delete address">
            <Icon name="delete" size={22} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Animatable.View>
  );

  const CustomAlertModal = ({ visible, title, message, onConfirm, onCancel, showCancel }) => (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.alertOverlay, { backgroundColor: theme.background }]}>
        <View style={[styles.alertBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.alertTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.alertMessage, { color: theme.text }]}>{message}</Text>
          <View style={[styles.alertBtnRow, { borderTopColor: theme.border }]}>
            {showCancel && (
              <TouchableOpacity style={[styles.alertCancelBtn, { backgroundColor: theme.background }]} onPress={onCancel}><Text style={[styles.alertCancelText, { color: theme.text }]}>Cancel</Text></TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.alertConfirmBtn, { backgroundColor: theme.primary }]} onPress={onConfirm}><Text style={[styles.alertConfirmText, { color: theme.text }]}>OK</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={[styles.headerGradient, { backgroundColor: theme.header }]}>
        <Animatable.View animation="fadeInDown" delay={100} duration={500} style={styles.header}>
          <Text style={[styles.headerTitle, { color: 'white', textAlign: 'center', flex: 1 }]}>Saved Addresses</Text>
        </Animatable.View>
      </LinearGradient>
      <Animatable.View animation="fadeInUp" delay={200} duration={500} style={[styles.content, { backgroundColor: theme.background }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Addresses</Text>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : error ? (
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        ) : addresses.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
            <Icon name="location-off" size={64} color={theme.text} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No saved addresses yet.</Text>
            <TouchableOpacity style={[styles.emptyAddBtn, { backgroundColor: theme.primary }]} onPress={openAddModal}>
              <LinearGradient colors={["#667eea", "#764ba2"]} style={[styles.emptyAddBtnGradient, { backgroundColor: theme.primary }]}>
                <Icon name="add-location-alt" size={22} color={theme.text} />
                <Text style={[styles.addBtnText, { color: theme.text }]}>Add Address</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={item => item.id?.toString()}
            renderItem={renderAddress}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
        {/* Floating Action Button */}
        <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={openAddModal} accessibilityLabel="Add new address">
          <LinearGradient colors={["#667eea", "#764ba2"]} style={[styles.fabGradient, { backgroundColor: theme.primary }]}>
            <Icon name="add" size={28} color={theme.text} />
          </LinearGradient>
        </TouchableOpacity>
        {/* Modal for Add/Edit */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeModal}
        >
          <View style={[styles.modalOverlay, { backgroundColor: theme.background }]}>
            <Animatable.View animation="fadeInUp" duration={400} style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{modalMode === 'add' ? 'Add New Address' : 'Edit Address'}</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.background }]} placeholder="Line 1" value={formFields.line1} onChangeText={t => setFormFields({ ...formFields, line1: t })} />
              <TextInput style={[styles.input, { backgroundColor: theme.background }]} placeholder="Line 2" value={formFields.line2} onChangeText={t => setFormFields({ ...formFields, line2: t })} />
              <TextInput style={[styles.input, { backgroundColor: theme.background }]} placeholder="Line 3" value={formFields.line3} onChangeText={t => setFormFields({ ...formFields, line3: t })} />
              <TextInput style={[styles.input, { backgroundColor: theme.background }]} placeholder="Phone" value={formFields.phone} onChangeText={t => setFormFields({ ...formFields, phone: t })} keyboardType="phone-pad" />
              <View style={[styles.modalBtnRow, { borderTopColor: theme.border }]}>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}><Text style={[styles.saveBtnText, { color: theme.text }]}>{modalMode === 'add' ? 'Add' : 'Save'}</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.background }]} onPress={closeModal}><Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancel</Text></TouchableOpacity>
              </View>
            </Animatable.View>
          </View>
        </Modal>
        <CustomAlertModal
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          onConfirm={() => {
            hideAlert();
            if (alert.onConfirm) alert.onConfirm();
          }}
          onCancel={hideAlert}
          showCancel={alert.showCancel}
        />
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  headerGradient: { paddingTop: 60, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white', // Always white
    marginLeft: 8,
  },
  content: { flex: 1, backgroundColor: '#fff', margin: 20, borderRadius: 18, padding: 16, elevation: 4, shadowColor: '#667eea', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#667eea', marginBottom: 12, marginTop: 8 },
  errorText: { color: '#ff6b6b', textAlign: 'center', marginTop: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 12, fontSize: 17, marginBottom: 16 },
  emptyAddBtn: { borderRadius: 8, overflow: 'hidden' },
  emptyAddBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 8, paddingHorizontal: 24 },
  addBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  addressCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 18, elevation: 3, shadowColor: '#667eea', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  addressLabel: { fontSize: 13, color: '#667eea', fontWeight: 'bold', marginTop: 4 },
  addressText: { fontSize: 15, color: '#222', marginBottom: 2 },
  addressPhone: { fontSize: 15, color: '#222', marginBottom: 2, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: '#f0f8ff', marginLeft: 4 },
  fab: { position: 'absolute', right: 30, bottom: 30, zIndex: 10, elevation: 6 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#667eea', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 24, elevation: 8, shadowColor: '#667eea', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  modalTitle: { fontSize: 19, fontWeight: 'bold', color: '#667eea', marginBottom: 18, textAlign: 'center' },
  input: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e0e7ef', fontSize: 15 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  saveBtn: { backgroundColor: '#667eea', padding: 12, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { backgroundColor: '#eee', padding: 12, borderRadius: 8, flex: 1, marginLeft: 8, alignItems: 'center' },
  cancelBtnText: { color: '#555', fontSize: 16 },
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: '#fff', borderRadius: 16, padding: 28, width: 300, alignItems: 'center', elevation: 8 },
  alertTitle: { fontSize: 18, fontWeight: 'bold', color: '#667eea', marginBottom: 10 },
  alertMessage: { fontSize: 15, color: '#333', marginBottom: 18, textAlign: 'center' },
  alertBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%' },
  alertConfirmBtn: { backgroundColor: '#667eea', paddingVertical: 10, paddingHorizontal: 22, borderRadius: 8, marginLeft: 8 },
  alertConfirmText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  alertCancelBtn: { backgroundColor: '#eee', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  alertCancelText: { color: '#555', fontSize: 15 },
}); 