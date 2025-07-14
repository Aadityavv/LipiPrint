import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import CustomAlert from '../../components/CustomAlert';

export default function UpdateServicesScreen({ navigation }) {
  const [combinations, setCombinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editPrices, setEditPrices] = useState({}); // { [id]: value }
  const [bindingOptions, setBindingOptions] = useState([]);
  const [editBinding, setEditBinding] = useState({}); // { [id]: { minPrice, perPagePrice } }
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'success' });

  // Add state for new service combination
  const [newCombo, setNewCombo] = useState({ color: '', paperSize: '', paperQuality: '', printOption: '', costPerPage: '' });
  // Add state for new binding option
  const [newBinding, setNewBinding] = useState({ type: '', minPrice: '', perPagePrice: '' });
  // Add state for showing add forms
  const [showAddCombo, setShowAddCombo] = useState(false);
  const [showAddBinding, setShowAddBinding] = useState(false);

  useEffect(() => {
    api.request('/print-jobs/combinations')
      .then(data => {
        setCombinations(data);
        // Initialize editPrices with current costPerPage
        const prices = {};
        data.forEach(combo => { prices[combo.id] = String(combo.costPerPage); });
        setEditPrices(prices);
      })
      .finally(() => setLoading(false));

    api.request('/print-jobs/binding-options')
      .then(data => {
        setBindingOptions(data);
        console.log('Fetched binding options:', data); // Debug log
        const edit = {};
        data.forEach(opt => { edit[opt.id] = { minPrice: String(opt.minPrice), perPagePrice: String(opt.perPagePrice) }; });
        setEditBinding(edit);
      });
  }, []);

  const updateCombination = async (id, data) => {
    try {
      const updated = await api.request(`/admin/service-combinations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      setCombinations(combos => combos.map(c => c.id === id ? updated : c));
      setAlert({ visible: true, title: 'Success', message: 'Service combination updated!', type: 'success' });
    } catch (e) {
      console.error(e);
      setAlert({ visible: true, title: 'Error', message: 'Failed to update service combination.', type: 'error' });
    }
  };

  const updateBindingOption = async (id, data) => {
    try {
      const updated = await api.request(`/admin/binding-options/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      setBindingOptions(opts => opts.map(o => o.id === id ? updated : o));
      setAlert({ visible: true, title: 'Success', message: 'Binding option updated!', type: 'success' });
    } catch (e) {
      console.error(e);
      setAlert({ visible: true, title: 'Error', message: 'Failed to update binding option.', type: 'error' });
    }
  };

  // Add service combination
  const addCombination = async () => {
    try {
      const payload = {
        color: newCombo.color,
        paperSize: newCombo.paperSize,
        paperQuality: newCombo.paperQuality,
        printOption: newCombo.printOption,
        costPerPage: parseFloat(newCombo.costPerPage)
      };
      const created = await api.request('/admin/service-combinations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setCombinations(prev => [...prev, created]);
      setNewCombo({ color: '', paperSize: '', paperQuality: '', printOption: '', costPerPage: '' });
      setAlert({ visible: true, title: 'Success', message: 'Service combination added!', type: 'success' });
    } catch (e) {
      setAlert({ visible: true, title: 'Error', message: 'Failed to add service combination.', type: 'error' });
    }
  };

  // Add binding option
  const addBindingOption = async () => {
    try {
      const payload = {
        type: newBinding.type,
        minPrice: parseFloat(newBinding.minPrice),
        perPagePrice: parseFloat(newBinding.perPagePrice)
      };
      const created = await api.request('/admin/binding-options', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setBindingOptions(prev => [...prev, created]);
      setNewBinding({ type: '', minPrice: '', perPagePrice: '' });
      setAlert({ visible: true, title: 'Success', message: 'Binding option added!', type: 'success' });
    } catch (e) {
      setAlert({ visible: true, title: 'Error', message: 'Failed to add binding option.', type: 'error' });
    }
  };

  // Delete service combination
  const deleteCombination = async (id) => {
    try {
      await api.request(`/admin/service-combinations/${id}`, { method: 'DELETE' });
      setCombinations(prev => prev.filter(c => c.id !== id));
      setAlert({ visible: true, title: 'Deleted', message: 'Service combination deleted!', type: 'success' });
    } catch (e) {
      setAlert({ visible: true, title: 'Error', message: 'Failed to delete service combination.', type: 'error' });
    }
  };

  // Delete binding option
  const deleteBindingOption = async (id) => {
    try {
      await api.request(`/admin/binding-options/${id}`, { method: 'DELETE' });
      setBindingOptions(prev => prev.filter(b => b.id !== id));
      setAlert({ visible: true, title: 'Deleted', message: 'Binding option deleted!', type: 'success' });
    } catch (e) {
      setAlert({ visible: true, title: 'Error', message: 'Failed to delete binding option.', type: 'error' });
    }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading options...</Text></View>;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.headerGradient}>
          <Animatable.View animation="fadeInDown" delay={100} duration={500} style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' }]}>
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(0,0,0,0.08)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
                position: 'absolute',
                left: 0,
                zIndex: 2,
              }}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { flex: 1, textAlign: 'center', zIndex: 1 }]}>Update Services</Text>
          </Animatable.View>
        </LinearGradient>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Service Combinations</Text>
          {/* Add Service Combination Button and Form */}
          <TouchableOpacity style={[styles.saveButton, { marginBottom: 10, alignSelf: 'flex-end', backgroundColor: showAddCombo ? '#bbb' : '#0058A3' }]} onPress={() => setShowAddCombo(v => !v)}>
            <Text style={{ color: 'white' }}>{showAddCombo ? 'Cancel' : 'Add New Combination'}</Text>
          </TouchableOpacity>
          {showAddCombo && (
            <View style={[styles.optionRow, { backgroundColor: '#f7f7fa', borderRadius: 10, marginBottom: 12, padding: 12, flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Add New Combination</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' }}>
                <TextInput placeholder="Color" value={newCombo.color} onChangeText={v => setNewCombo(c => ({ ...c, color: v }))} style={[styles.priceInput, { flex: 1, minWidth: 80 }]} placeholderTextColor="#000" />
                <TextInput placeholder="Paper Size" value={newCombo.paperSize} onChangeText={v => setNewCombo(c => ({ ...c, paperSize: v }))} style={[styles.priceInput, { flex: 1, minWidth: 80 }]} placeholderTextColor="#000" />
                <TextInput placeholder="Paper Quality" value={newCombo.paperQuality} onChangeText={v => setNewCombo(c => ({ ...c, paperQuality: v }))} style={[styles.priceInput, { flex: 1, minWidth: 80 }]} placeholderTextColor="#000" />
                <TextInput placeholder="Print Option" value={newCombo.printOption} onChangeText={v => setNewCombo(c => ({ ...c, printOption: v }))} style={[styles.priceInput, { flex: 1, minWidth: 80 }]} placeholderTextColor="#000" />
                <TextInput placeholder="Cost/Page" value={newCombo.costPerPage} onChangeText={v => setNewCombo(c => ({ ...c, costPerPage: v }))} keyboardType="numeric" style={[styles.priceInput, { flex: 1, minWidth: 80 }]} placeholderTextColor="#000" />
              </View>
              <TouchableOpacity style={[styles.saveButton, { marginTop: 8, alignSelf: 'flex-end' }]} onPress={addCombination}>
                <Text style={{ color: 'white' }}>Add Combination</Text>
              </TouchableOpacity>
            </View>
          )}
          {combinations.map(combo => (
            <View key={combo.id} style={styles.optionRow}>
              <View style={{ flex: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: 'bold' }}>{combo.color}, {combo.paperSize}, {combo.paperQuality}, {combo.printOption}</Text>
              </View>
              <Text style={{ marginLeft: 8 }}>₹</Text>
              <TextInput
                value={editPrices[combo.id]}
                keyboardType="numeric"
                onChangeText={val => setEditPrices(prices => ({ ...prices, [combo.id]: val }))}
                style={styles.priceInput}
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => updateCombination(combo.id, { ...combo, costPerPage: parseFloat(editPrices[combo.id]) })}
              >
                <Text style={{ color: 'white' }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: '#E53935', marginLeft: 8 }]}
                onPress={() => deleteCombination(combo.id)}
              >
                <Text style={{ color: 'white' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Binding Options</Text>
          {/* Add Binding Option Button and Form */}
          <TouchableOpacity style={[styles.saveButton, { marginBottom: 10, alignSelf: 'flex-end', backgroundColor: showAddBinding ? '#bbb' : '#0058A3' }]} onPress={() => setShowAddBinding(v => !v)}>
            <Text style={{ color: 'white' }}>{showAddBinding ? 'Cancel' : 'Add New Binding Option'}</Text>
          </TouchableOpacity>
          {showAddBinding && (
            <View style={[styles.optionRow, { backgroundColor: '#f7f7fa', borderRadius: 10, marginBottom: 12, padding: 12, flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Add New Binding Option</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' }}>
                <TextInput placeholder="Type (e.g. spiral)" value={newBinding.type} onChangeText={v => setNewBinding(b => ({ ...b, type: v }))} style={[styles.priceInput, { flex: 1, minWidth: 100 }]} placeholderTextColor="#000" />
                <TextInput placeholder="Min Price" value={newBinding.minPrice} onChangeText={v => setNewBinding(b => ({ ...b, minPrice: v }))} keyboardType="numeric" style={[styles.priceInput, { flex: 1, minWidth: 100 }]} placeholderTextColor="#000" />
                <TextInput placeholder="Per Page Price" value={newBinding.perPagePrice} onChangeText={v => setNewBinding(b => ({ ...b, perPagePrice: v }))} keyboardType="numeric" style={[styles.priceInput, { flex: 1, minWidth: 100 }]} placeholderTextColor="#000" />
              </View>
              <TouchableOpacity style={[styles.saveButton, { marginTop: 8, alignSelf: 'flex-end' }]} onPress={addBindingOption}>
                <Text style={{ color: 'white' }}>Add Binding Option</Text>
              </TouchableOpacity>
            </View>
          )}
          {bindingOptions.map(opt => {
            console.log('Binding option type:', opt.type, opt);
            return (
              <View key={opt.id} style={[styles.optionRow, {
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
                width: '100%',
                alignItems: 'flex-start',
                flexDirection: 'column',
              }]}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 10 }}>
                  {(opt.type ? opt.type.charAt(0).toUpperCase() + opt.type.slice(1) : JSON.stringify(opt))}
                </Text>
                <View style={{ marginBottom: 10, width: '100%' }}>
                  <Text style={{ fontSize: 14, color: '#0058A3', marginBottom: 4 }}>Minimum Price (₹)</Text>
                  <TextInput
                    value={editBinding[opt.id]?.minPrice}
                    keyboardType="numeric"
                    onChangeText={val => setEditBinding(edit => ({ ...edit, [opt.id]: { ...edit[opt.id], minPrice: val } }))}
                    style={{
                      borderWidth: 1,
                      borderColor: '#0058A3',
                      borderRadius: 6,
                      width: '100%',
                      padding: 8,
                      fontSize: 16,
                      backgroundColor: '#fff',
                      color: '#222',
                    }}
                  />
                </View>
                <View style={{ marginBottom: 14, width: '100%' }}>
                  <Text style={{ fontSize: 14, color: '#0058A3', marginBottom: 4 }}>Price Per Page (₹)</Text>
                  <TextInput
                    value={editBinding[opt.id]?.perPagePrice}
                    keyboardType="numeric"
                    onChangeText={val => setEditBinding(edit => ({ ...edit, [opt.id]: { ...edit[opt.id], perPagePrice: val } }))}
                    style={{
                      borderWidth: 1,
                      borderColor: '#0058A3',
                      borderRadius: 6,
                      width: '100%',
                      padding: 8,
                      fontSize: 16,
                      backgroundColor: '#fff',
                      color: '#222',
                    }}
                  />
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#0058A3',
                    borderRadius: 6,
                    paddingVertical: 10,
                    alignItems: 'center',
                    width: '100%',
                  }}
                  onPress={() => updateBindingOption(opt.id, { ...opt, minPrice: parseFloat(editBinding[opt.id]?.minPrice), perPagePrice: parseFloat(editBinding[opt.id]?.perPagePrice) })}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: '#E53935', marginTop: 8 }]}
                  onPress={() => deleteBindingOption(opt.id)}
                >
                  <Text style={{ color: 'white' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(a => ({ ...a, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerGradient: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  priceInput: { borderWidth: 1, borderColor: '#eee', borderRadius: 6, width: 60, marginLeft: 4, padding: 4, textAlign: 'center' },
  saveButton: { marginLeft: 8, backgroundColor: '#0058A3', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
}); 