import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Alert, StyleSheet } from 'react-native';
import api from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';

export default function AddressListScreen({ navigation }) {
  const { theme } = useTheme();
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ line1: '', line2: '', line3: '', phone: '', addressType: '' });

  useEffect(() => {
    api.get('/user/addresses').then(setAddresses);
  }, []);

  const saveAddress = () => {
    if (!form.line1 || !form.line2 || !form.line3 || !form.phone) {
      Alert.alert('All fields required');
      return;
    }
    api.post('/user/addresses', form).then(addr => {
      setAddresses([...addresses, addr]);
      setShowForm(false);
      setForm({ line1: '', line2: '', line3: '', phone: '', addressType: '' });
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>My Addresses</Text>
      <FlatList
        data={addresses}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.addressCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.addressText, { color: theme.text }]}>{item.line1}</Text>
            <Text style={[styles.addressText, { color: theme.text }]}>{item.line2}</Text>
            <Text style={[styles.addressText, { color: theme.text }]}>{item.line3}</Text>
            <Text style={[styles.addressText, { color: theme.text }]}>{item.phone}</Text>
            <TouchableOpacity onPress={() => api.delete(`/user/addresses/${item.id}`).then(() => setAddresses(addresses.filter(a => a.id !== item.id)))}>
              <Text style={[styles.deleteBtn, { color: theme.text }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      {showForm ? (
        <View style={[styles.form, { backgroundColor: theme.card }]}>
          <TextInput placeholder="Line 1" value={form.line1} onChangeText={t => setForm({ ...form, line1: t })} style={[styles.input, { borderColor: theme.border }]} />
          <TextInput placeholder="Line 2" value={form.line2} onChangeText={t => setForm({ ...form, line2: t })} style={[styles.input, { borderColor: theme.border }]} />
          <TextInput placeholder="Line 3" value={form.line3} onChangeText={t => setForm({ ...form, line3: t })} style={[styles.input, { borderColor: theme.border }]} />
          <TextInput placeholder="Phone" value={form.phone} onChangeText={t => setForm({ ...form, phone: t })} style={[styles.input, { borderColor: theme.border }, { keyboardType: 'phone-pad' }]} />
          <TextInput placeholder="Type (Home/Office)" value={form.addressType} onChangeText={t => setForm({ ...form, addressType: t })} style={[styles.input, { borderColor: theme.border }]} />
          <TouchableOpacity onPress={saveAddress}><Text style={[styles.saveBtn, { color: theme.text }]}>Save</Text></TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setShowForm(true)}><Text style={[styles.addBtn, { color: theme.text }]}>+ Add New Address</Text></TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  addressCard: { backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 10 },
  deleteBtn: { color: 'red', marginTop: 8 },
  addBtn: { color: '#667eea', fontWeight: 'bold', marginTop: 16 },
  form: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginTop: 16 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 10, padding: 6 },
  saveBtn: { color: 'green', fontWeight: 'bold', marginTop: 8 },
  addressText: { color: '#333' }
}); 