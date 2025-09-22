import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';

export default function AddEmployeeScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');

  const handleAddEmployee = async () => {
    // Validate inputs
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      // Create user with API call
      const response = await api.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role
        })
      });

      Alert.alert('Success', 'Employee added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding employee:', error);
      Alert.alert('Error', error?.message || 'Failed to add employee');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.headerGradient}>
        <Animatable.View animation="fadeInDown" delay={100} duration={500} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Employee</Text>
          <View style={{ width: 44 }} />
        </Animatable.View>
      </LinearGradient>

      <View style={styles.content}>
        <Animatable.View animation="fadeInUp" delay={200} duration={500}>
          <Text style={styles.sectionTitle}>Employee Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'USER' && styles.roleButtonActive]}
                onPress={() => setRole('USER')}
              >
                <Icon name="person" size={20} color={role === 'USER' ? 'white' : '#667eea'} />
                <Text style={[styles.roleText, role === 'USER' && styles.roleTextActive]}>User</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'ADMIN' && styles.roleButtonActive]}
                onPress={() => setRole('ADMIN')}
              >
                <Icon name="admin-panel-settings" size={20} color={role === 'ADMIN' ? 'white' : '#667eea'} />
                <Text style={[styles.roleText, role === 'ADMIN' && styles.roleTextActive]}>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddEmployee}>
            <Text style={styles.addButtonText}>Add Employee</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerGradient: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 20 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  roleContainer: { flexDirection: 'row', gap: 12 },
  roleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e0e0e0', gap: 8 },
  roleButtonActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  roleText: { fontSize: 16, color: '#667eea', fontWeight: '600' },
  roleTextActive: { color: 'white' },
  addButton: { backgroundColor: '#667eea', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  addButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});