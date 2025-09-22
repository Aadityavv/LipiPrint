import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
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
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const response = await api.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role,
          userType: 'professional' // Required field in the backend
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
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with gradient background */}
        <LinearGradient 
          colors={['#667eea', '#764ba2']} 
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animatable.View 
            animation="fadeInDown" 
            delay={100} 
            duration={800} 
            style={styles.header}
          >
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
            >
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Employee</Text>
            <View style={styles.headerIcon}>
              <Icon name="person-add" size={24} color="white" />
            </View>
          </Animatable.View>
          
          <Animatable.View 
            animation="fadeInUp" 
            delay={300} 
            duration={800}
            style={styles.headerSubtext}
          >
            <Text style={styles.subtitle}>Create a new account for your team member</Text>
          </Animatable.View>
        </LinearGradient>

        {/* Main content card */}
        <Animatable.View 
          animation="fadeInUp" 
          delay={500} 
          duration={800}
          style={styles.cardContainer}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Employee Details</Text>
              <View style={styles.cardIcon}>
                <Icon name="badge" size={24} color="#667eea" />
              </View>
            </View>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <Icon name="person" size={18} color="#667eea" />
                <Text style={styles.inputLabel}>Full Name</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                placeholderTextColor="#aaa"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <Icon name="email" size={18} color="#667eea" />
                <Text style={styles.inputLabel}>Email Address</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                placeholderTextColor="#aaa"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <Icon name="phone" size={18} color="#667eea" />
                <Text style={styles.inputLabel}>Phone Number</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#aaa"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <Icon name="lock" size={18} color="#667eea" />
                <Text style={styles.inputLabel}>Password</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
            </View>

            {/* Role Selection */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <Icon name="assignment-ind" size={18} color="#667eea" />
                <Text style={styles.inputLabel}>Role</Text>
              </View>
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
          </View>
        </Animatable.View>

        {/* Submit Button */}
        <Animatable.View 
          animation="fadeInUp" 
          delay={700} 
          duration={800}
          style={styles.buttonContainer}
        >
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddEmployee}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="check-circle" size={20} color="white" />
              <Text style={styles.addButtonText}>Create Account</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f7fa' 
  },
  headerGradient: { 
    paddingTop: 50, 
    paddingBottom: 40, 
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 15
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  headerIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  headerTitle: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  headerSubtext: {
    alignItems: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500'
  },
  cardContainer: {
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 20
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333'
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  inputGroup: {
    marginBottom: 25
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  inputLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#444',
    marginLeft: 8
  },
  input: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: '#e9ecef',
    color: '#333',
    paddingLeft: 50
  },
  roleContainer: { 
    flexDirection: 'row', 
    gap: 12,
    marginTop: 5
  },
  roleButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#f8f9fa', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#e9ecef',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2
  },
  roleButtonActive: { 
    backgroundColor: '#667eea', 
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  roleText: { 
    fontSize: 16, 
    color: '#667eea', 
    fontWeight: '600' 
  },
  roleTextActive: { 
    color: 'white' 
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 30
  },
  addButton: { 
    borderRadius: 16, 
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20
  },
  addButtonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold',
    marginLeft: 10
  }
});