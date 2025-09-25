import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';
import ApiService from '../../services/api';

export default function SavedAddressesScreen({ navigation }) {
  const { theme } = useTheme();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[SavedAddressesScreen] Fetching user addresses...');
      
      const addressesData = await ApiService.getUserAddresses();
      console.log('[SavedAddressesScreen] Addresses received:', addressesData);
      
      // Handle both array and object response formats
      const addressesList = Array.isArray(addressesData) ? addressesData : (addressesData?.content || []);
      setAddresses(addressesList);
      
      if (addressesList.length === 0) {
        console.log('[SavedAddressesScreen] No addresses found');
      }
    } catch (err) {
      console.error('[SavedAddressesScreen] Error loading addresses:', err);
      setError(`Failed to load addresses: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    try {
      const addressData = {
        ...formData,
        fullName: formData.name,
      };

      if (editingAddress) {
        // Update existing address
        console.log('[SavedAddressesScreen] Updating address:', editingAddress.id);
        await ApiService.request(`/user/addresses/${editingAddress.id}`, {
          method: 'PUT',
          body: JSON.stringify(addressData),
        });
        
        // Refresh the addresses list
        await loadAddresses();
        Alert.alert('Success', 'Address updated successfully');
      } else {
        // Add new address
        console.log('[SavedAddressesScreen] Adding new address');
        await ApiService.addUserAddress(addressData);
        
        // Refresh the addresses list
        await loadAddresses();
        Alert.alert('Success', 'Address added successfully');
      }

      setShowAddForm(false);
      setEditingAddress(null);
      setFormData({
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
      });
    } catch (err) {
      console.error('Error saving address:', err);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setFormData({
      name: address.fullName || address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark,
    });
    setShowAddForm(true);
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[SavedAddressesScreen] Deleting address:', addressId);
              await ApiService.request(`/user/addresses/${addressId}`, { method: 'DELETE' });
              
              // Refresh the addresses list
              await loadAddresses();
              Alert.alert('Success', 'Address deleted successfully');
            } catch (err) {
              console.error('[SavedAddressesScreen] Error deleting address:', err);
              Alert.alert('Error', `Failed to delete address: ${err.message}`);
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (addressId) => {
    try {
      // await ApiService.request(`/user/addresses/${addressId}/set-default`, { method: 'PUT' });
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      })));
      Alert.alert('Success', 'Default address updated');
    } catch (err) {
      console.error('Error setting default address:', err);
      Alert.alert('Error', 'Failed to update default address. Please try again.');
    }
  };

  const renderAddressCard = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={500}
      style={styles.addressCard}
    >
      <View style={styles.addressHeader}>
        <View style={styles.addressTitleRow}>
          <Icon name="location-on" size={20} color="#667eea" />
          <Text style={styles.addressTitle}>{item.name}</Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>DEFAULT</Text>
            </View>
          )}
        </View>
        <View style={styles.addressActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditAddress(item)}
          >
            <Icon name="edit" size={18} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteAddress(item.id)}
          >
            <Icon name="delete" size={18} color="#FF5722" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.addressDetails}>
        <Text style={styles.addressName}>{item.fullName || item.name}</Text>
        <Text style={styles.addressPhone}>{item.phone}</Text>
        <Text style={styles.addressText}>{item.address}</Text>
        <Text style={styles.addressText}>
          {item.city}, {item.state} - {item.pincode}
        </Text>
        {item.landmark && (
          <Text style={styles.landmarkText}>Landmark: {item.landmark}</Text>
        )}
      </View>
      
      {!item.isDefault && (
        <TouchableOpacity
          style={styles.setDefaultButton}
          onPress={() => handleSetDefault(item.id)}
        >
          <Text style={styles.setDefaultButtonText}>Set as Default</Text>
        </TouchableOpacity>
      )}
    </Animatable.View>
  );

  const renderAddForm = () => (
    <Animatable.View animation="fadeInUp" duration={500} style={styles.addFormCard}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          {editingAddress ? 'Edit Address' : 'Add New Address'}
        </Text>
        <TouchableOpacity onPress={() => {
          setShowAddForm(false);
          setEditingAddress(null);
          setFormData({
            name: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            landmark: '',
          });
        }}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.formContent}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          placeholderTextColor="#999"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={formData.phone}
          onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Address"
          value={formData.address}
          onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
        
        <View style={styles.rowInput}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="City"
            value={formData.city}
            onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
            placeholderTextColor="#999"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="State"
            value={formData.state}
            onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.rowInput}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Pincode"
            value={formData.pincode}
            onChangeText={(text) => setFormData(prev => ({ ...prev, pincode: text }))}
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Address Name (e.g., Home, Office)"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholderTextColor="#999"
          />
    </View>
        
        <TextInput
          style={styles.input}
          placeholder="Landmark (Optional)"
          value={formData.landmark}
          onChangeText={(text) => setFormData(prev => ({ ...prev, landmark: text }))}
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.saveButtonGradient}>
            <Text style={styles.saveButtonText}>
              {editingAddress ? 'Update Address' : 'Save Address'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </Animatable.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading addresses...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#22194f', '#22194f']}
        style={styles.headerGradient}
      >
        <Heading
          title="Saved Addresses"
          subtitle="Manage your delivery addresses"
          left={
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          }
          variant="primary"
        />
      </LinearGradient>

      <View style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="error" size={24} color="#FF5722" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadAddresses}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!showAddForm && (
          <>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.addButtonGradient}>
                <Icon name="add" size={20} color="white" />
                <Text style={styles.addButtonText}>Add New Address</Text>
              </LinearGradient>
                  </TouchableOpacity>

            {addresses.length > 0 ? (
              <FlatList
                data={addresses}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderAddressCard}
                contentContainerStyle={styles.addressesList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="location-off" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No saved addresses</Text>
                <Text style={styles.emptySubtext}>
                  Add your first address to get started
                </Text>
                </View>
            )}
          </>
        )}

        {showAddForm && renderAddForm()}
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF5722',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#667eea',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addressesList: {
    paddingBottom: 20,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addressActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  addressDetails: {
    marginBottom: 12,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    lineHeight: 20,
  },
  landmarkText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  setDefaultButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f4ff',
    borderRadius: 6,
  },
  setDefaultButtonText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  addFormCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  formContent: {
    maxHeight: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  rowInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});