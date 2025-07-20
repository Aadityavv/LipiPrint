import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import ApiService from '../../services/api';

export default function AdminDiscountScreen({ navigation }) {
  const [discounts, setDiscounts] = useState([]);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [discountForm, setDiscountForm] = useState({ color: '', paperSize: '', paperQuality: '', printOption: '', minPages: '', amountOff: '' });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchDiscounts(); }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      setDiscounts(await ApiService.request('/admin/discount-rules'));
    } catch {
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscountFormChange = (key, value) => setDiscountForm(prev => ({ ...prev, [key]: value }));

  const handleSaveDiscount = async () => {
    setActionLoading(true);
    const payload = { ...discountForm, minPages: parseInt(discountForm.minPages), amountOff: parseFloat(discountForm.amountOff) };
    try {
      if (editingDiscount) await ApiService.request(`/admin/discount-rules/${editingDiscount.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await ApiService.request('/admin/discount-rules', { method: 'POST', body: JSON.stringify(payload) });
      setDiscountForm({ color: '', paperSize: '', paperQuality: '', printOption: '', minPages: '', amountOff: '' });
      setEditingDiscount(null);
      setShowAddForm(false);
      await fetchDiscounts();
    } catch {
      Alert.alert('Error', 'Failed to save discount rule.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditDiscount = (rule) => {
    setEditingDiscount(rule);
    setDiscountForm({
      color: rule.color || '',
      paperSize: rule.paperSize || '',
      paperQuality: rule.paperQuality || '',
      printOption: rule.printOption || '',
      minPages: String(rule.minPages || ''),
      amountOff: String(rule.amountOff || ''),
    });
    setShowAddForm(true);
  };

  const handleDeleteDiscount = async (id) => {
    setActionLoading(true);
    try {
      await ApiService.request(`/admin/discount-rules/${id}`, { method: 'DELETE' });
      await fetchDiscounts();
    } catch {
      Alert.alert('Error', 'Failed to delete discount rule.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingDiscount(null);
    setDiscountForm({ color: '', paperSize: '', paperQuality: '', printOption: '', minPages: '', amountOff: '' });
    setShowAddForm(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#764ba2" />
          <Text style={{ color: '#764ba2', marginTop: 10, fontWeight: 'bold' }}>Saving changes...</Text>
        </View>
      )}
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.headerGradient}>
          <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' }]}> 
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { flex: 1, textAlign: 'center', zIndex: 1 }]}>Manage Discounts</Text>
          </View>
        </LinearGradient>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Discount Rules</Text>
          <TouchableOpacity style={[styles.saveButton, { marginBottom: 10, alignSelf: 'flex-end', backgroundColor: showAddForm ? '#bbb' : '#0058A3' }]} onPress={() => { setShowAddForm(v => !v); if (showAddForm) handleCancel(); }} disabled={actionLoading}>
            <Text style={{ color: 'white' }}>{showAddForm ? 'Cancel' : 'Add Discount'}</Text>
          </TouchableOpacity>
          {showAddForm && (
            <View style={[styles.optionRow, { backgroundColor: '#f7f7fa', borderRadius: 10, marginBottom: 12, padding: 12, flexDirection: 'column', alignItems: 'flex-start' }]}> 
              <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>{editingDiscount ? 'Edit Discount Rule' : 'Add Discount Rule'}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' }}>
                <TextInput placeholder="Color" value={discountForm.color} onChangeText={v => handleDiscountFormChange('color', v)} style={[styles.priceInput, { flex: 1, minWidth: 80 }]} placeholderTextColor="#000" editable={!actionLoading} />
                <TextInput placeholder="Paper Size" value={discountForm.paperSize} onChangeText={v => handleDiscountFormChange('paperSize', v)} style={[styles.priceInput, { flex: 1, minWidth: 80 }]} placeholderTextColor="#000" editable={!actionLoading} />
                <TextInput placeholder="Paper Quality" value={discountForm.paperQuality} onChangeText={v => handleDiscountFormChange('paperQuality', v)} style={[styles.priceInput, { flex: 1, minWidth: 80 }]} placeholderTextColor="#000" editable={!actionLoading} />
                <TextInput placeholder="Print Option" value={discountForm.printOption} onChangeText={v => handleDiscountFormChange('printOption', v)} style={[styles.priceInput, { flex: 1, minWidth: 80 }]} placeholderTextColor="#000" editable={!actionLoading} />
                <TextInput placeholder="Min Pages" value={discountForm.minPages} onChangeText={v => handleDiscountFormChange('minPages', v)} keyboardType="numeric" style={[styles.priceInput, { flex: 1, minWidth: 80 }]} placeholderTextColor="#000" editable={!actionLoading} />
                <TextInput placeholder="Amount Off" value={discountForm.amountOff} onChangeText={v => handleDiscountFormChange('amountOff', v)} keyboardType="numeric" style={[styles.priceInput, { flex: 1, minWidth: 80 }]} placeholderTextColor="#000" editable={!actionLoading} />
              </View>
              <TouchableOpacity style={[styles.saveButton, { marginTop: 8, alignSelf: 'flex-end', opacity: actionLoading ? 0.7 : 1 }]} onPress={handleSaveDiscount} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" size={18} /> : <Text style={{ color: 'white' }}>{editingDiscount ? 'Update Discount' : 'Add Discount'}</Text>}
              </TouchableOpacity>
            </View>
          )}
          {loading ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <ActivityIndicator size="large" color="#764ba2" />
              <Text style={{ color: '#888', marginTop: 10 }}>Loading discount rules...</Text>
            </View>
          ) : discounts.length === 0 ? (
            <Text style={{ color: '#888', marginTop: 20, textAlign: 'center' }}>No discount rules found.</Text>
          ) : discounts.map(rule => (
            <View key={rule.id} style={styles.optionRow}>
              <View style={{ flex: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: 'bold' }}>{rule.color}, {rule.paperSize}, {rule.paperQuality}, {rule.printOption}</Text>
                <Text style={{ color: '#888', fontSize: 13 }}>Min Pages: {rule.minPages} | Amount Off: ₹{rule.amountOff}</Text>
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={() => handleEditDiscount(rule)} disabled={actionLoading}>
                <Text style={{ color: 'white' }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#E53935', marginLeft: 8 }]} onPress={() => handleDeleteDiscount(rule.id)} disabled={actionLoading}>
                <Text style={{ color: 'white' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerGradient: { paddingTop: 36, paddingBottom: 18, paddingHorizontal: 0, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  header: { minHeight: 44, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'absolute', left: 0, zIndex: 2 },
  headerTitle: { fontSize: 22, color: '#fff', fontWeight: 'bold', letterSpacing: 0.5 },
  content: { padding: 18 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#764ba2', marginBottom: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  priceInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, marginRight: 8, backgroundColor: '#f7f7fa', minWidth: 80 },
  saveButton: { backgroundColor: '#0058A3', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 16, marginLeft: 8 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 100, justifyContent: 'center', alignItems: 'center' },
}); 