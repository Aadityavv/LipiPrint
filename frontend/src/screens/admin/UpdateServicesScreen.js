import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';

export default function UpdateServicesScreen({ navigation }) {
  const [combinations, setCombinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editPrices, setEditPrices] = useState({}); // { [id]: value }
  const [bindingOptions, setBindingOptions] = useState([]);
  const [editBinding, setEditBinding] = useState({}); // { [id]: { minPrice, perPagePrice } }

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
    } catch (e) {
      console.error(e);
    }
  };

  const updateBindingOption = async (id, data) => {
    try {
      const updated = await api.request(`/admin/binding-options/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      setBindingOptions(opts => opts.map(o => o.id === id ? updated : o));
    } catch (e) {
      console.error(e);
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
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Binding Options</Text>
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
              </View>
            );
          })}
        </View>
      </ScrollView>
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