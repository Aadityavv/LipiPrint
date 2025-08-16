import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';

const PRIMARY = '#1e3a8a';
const WHITE = '#fff';
const CARD = '#f5f7fa';
const TEXT = '#212121';
const SUBTEXT = '#637381';
const BORDER = '#e3e8ee';
const ERROR = '#d90429';
const SUCCESS = '#03c988';

export default function SavedAddressesScreen() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formFields, setFormFields] = useState({ line1: '', line2: '', line3: '', phone: '', city: '', state: '', pincode: '' });
  const [editingId, setEditingId] = useState(null);
  const [alert, setAlert] = useState({ visible: false, message: '' });

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
    setFormFields({ line1: '', line2: '', line3: '', phone: '', city: '', state: '', pincode: '' });
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormFields({
      line1: item.line1 || '',
      line2: item.line2 || '',
      line3: item.line3 || '',
      phone: item.phone || '',
      city: item.city || '',
      state: item.state || '',
      pincode: item.pincode || ''
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setFormFields({ line1: '', line2: '', line3: '', phone: '', city: '', state: '', pincode: '' });
  };

  const showAlert = (message) => setAlert({ visible: true, message });
  const hideAlert = () => setAlert({ visible: false, message: '' });

  const handleDelete = async (id) => {
    showAlert('Deleting address...');
    try {
      await api.deleteUserAddress(id);
      setAddresses(addresses.filter(addr => addr.id !== id));
      hideAlert();
    } catch (e) {
      showAlert('Failed to delete address.');
    }
  };

  // Autofill city/state when pincode changes
  useEffect(() => {
    if (formFields.pincode.length === 6) {
      fetchCityState(formFields.pincode);
    } else if (formFields.pincode !== '' && formFields.pincode.length < 6) {
      setFormFields(prev => ({ ...prev, city: '', state: '' }));
    }
  }, [formFields.pincode]);

  const fetchCityState = async (pin) => {
    if (pin.length !== 6) {
      setFormFields(prev => ({
        ...prev, city: '', state: ''
      }));
      return;
    }
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        setFormFields(prev => ({
          ...prev,
          city: postOffice.District || '',
          state: postOffice.State || ''
        }));
      } else {
        setFormFields(prev => ({
          ...prev,
          city: '',
          state: ''
        }));
      }
    } catch (e) {
      setFormFields(prev => ({
        ...prev,
        city: '',
        state: ''
      }));
    }
  };

  const handleSave = async () => {
    const { line1, line2, line3, phone, city, state, pincode } = formFields;
    if (!line1.trim() || !line2.trim() || !line3.trim() || !phone.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      showAlert('Please fill all fields.');
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      showAlert('Invalid pincode. Pincode should be 6 digits.');
      return;
    }
    if (city === '' || state === '') {
      showAlert('Please provide a valid 6-digit pincode to autofill city and state.');
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
      showAlert('Failed to save address.');
    }
  };

  const renderAddress = ({ item }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressTop}>
        <View style={styles.addressIconContainer}>
          <Icon name="home" size={25} color={PRIMARY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.addressLine}>{item.line1}</Text>
          <Text style={styles.addressLine}>{item.line2}</Text>
          <Text style={styles.addressLine}>{item.line3}</Text>
          <Text style={styles.addressDetails}>{`${item.city}, ${item.state} - ${item.pincode}`}</Text>
          <Text style={styles.addressPhone}>{item.phone}</Text>
        </View>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
          <Icon name="edit" size={20} color={PRIMARY} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
          <Icon name="delete" size={20} color={ERROR} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <LinearGradient colors={[PRIMARY, '#4F8EF7']} style={styles.headerGradient}>
        <Text style={styles.headerTitle}>My Saved Addresses</Text>
      </LinearGradient>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 50 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="location-off" size={60} color={PRIMARY} />
            <Text style={styles.emptyText}>No addresses saved yet.</Text>
          </View>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={item => `${item.id}`}
            renderItem={renderAddress}
            contentContainerStyle={{ paddingVertical: 16 }}
          />
        )}
        <TouchableOpacity style={styles.fab} onPress={openAddModal}>
          <Icon name="add" size={28} color={WHITE} />
        </TouchableOpacity>
      </View>
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {modalMode === 'add' ? 'Add New Address' : 'Edit Address'}
            </Text>
            <TextInput style={styles.input} placeholder="Pincode *" value={formFields.pincode} onChangeText={t => setFormFields({ ...formFields, pincode: t })} keyboardType="numeric" maxLength={6} placeholderTextColor="#8a97a9"/>
            <TextInput style={[styles.input, { backgroundColor: '#f4f8fd' }]} placeholder="City (Autofilled)" value={formFields.city} editable={false} placeholderTextColor="#8a97a9"/>
            <TextInput style={[styles.input, { backgroundColor: '#f4f8fd' }]} placeholder="State (Autofilled)" value={formFields.state} editable={false} placeholderTextColor="#8a97a9"/>
            <TextInput style={styles.input} placeholder="Address Line 1 *" value={formFields.line1} onChangeText={t => setFormFields({ ...formFields, line1: t })} placeholderTextColor="#8a97a9"/>
            <TextInput style={styles.input} placeholder="Address Line 2 *" value={formFields.line2} onChangeText={t => setFormFields({ ...formFields, line2: t })} placeholderTextColor="#8a97a9"/>
            <TextInput style={styles.input} placeholder="Address Line 3 *" value={formFields.line3} onChangeText={t => setFormFields({ ...formFields, line3: t })} placeholderTextColor="#8a97a9"/>
            <TextInput style={styles.input} placeholder="Phone Number *" value={formFields.phone} onChangeText={t => setFormFields({ ...formFields, phone: t })} keyboardType="phone-pad" maxLength={10} placeholderTextColor="#8a97a9"/>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave}>
                <Text style={styles.modalSaveTxt}>{modalMode === 'add' ? 'Add' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeModal}>
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={alert.visible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>{alert.message}</Text>
            <TouchableOpacity style={styles.alertBtn} onPress={hideAlert}>
              <Text style={styles.alertBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: WHITE },
  headerGradient: { paddingTop: 52, paddingBottom: 28, alignItems: 'center', borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerTitle: { color: WHITE, fontSize: 22, fontWeight: 'bold', letterSpacing: 1 },
  content: { flex: 1, padding: 18 },
  addressCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
  },
  addressTop: { flexDirection: 'row', alignItems: 'center' },
  addressIconContainer: { backgroundColor: '#e9efff', borderRadius: 14, padding: 7, marginRight: 14 },
  addressLine: { fontSize: 15, color: TEXT, marginBottom: 1 },
  addressDetails: { fontSize: 14, color: SUBTEXT, fontWeight: 'bold', marginTop: 2 },
  addressPhone: { color: PRIMARY, marginTop: 7, fontWeight: 'bold', fontSize: 14 },
  iconBtn: { backgroundColor: '#f0f6ff', borderRadius: 10, marginLeft: 8, padding: 6 },
  fab: { position: 'absolute', right: 22, bottom: 24, backgroundColor: PRIMARY, borderRadius: 34, width: 56, height: 56, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: SUBTEXT, marginTop: 15, fontSize: 16, fontWeight: '600' },
  errorText: { color: ERROR, textAlign: 'center', marginTop: 30, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(54,61,77,0.16)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: WHITE, borderRadius: 22, padding: 28, minWidth: '86%', elevation: 8, alignItems: 'stretch' },
  modalTitle: { fontSize: 19, color: PRIMARY, fontWeight: '700', textAlign: 'center', marginBottom: 13, letterSpacing: 0.5 },
  input: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 13, marginBottom: 13, borderWidth: 1, borderColor: BORDER, fontSize: 15, color: TEXT },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalSaveBtn: { backgroundColor: PRIMARY, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 5 },
  modalSaveTxt: { color: WHITE, fontWeight: 'bold', fontSize: 16 },
  modalCancelBtn: { backgroundColor: BORDER, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8, flex: 1, alignItems: 'center', marginLeft: 5 },
  modalCancelTxt: { color: TEXT, fontSize: 16 },
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: WHITE, borderRadius: 16, padding: 30, width: 300, alignItems: 'center' },
  alertText: { color: ERROR, fontSize: 16, marginBottom: 18, textAlign: 'center', fontWeight: '600' },
  alertBtn: { backgroundColor: PRIMARY, paddingVertical: 10, paddingHorizontal: 32, borderRadius: 8 },
  alertBtnText: { color: WHITE, fontWeight: 'bold', fontSize: 15 },
});
