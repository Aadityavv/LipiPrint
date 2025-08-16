import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ApiService from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';
import LottieView from 'lottie-react-native';
import LoadingWorld from '../../assets/animations/loading-world.json';

const { width } = Dimensions.get('window');

export default function DeliveryOptionsScreen({ navigation, route }) {
  const { files, selectedOptions, selectedPaper, selectedPrint, total, totalPrice, priceBreakdown, subtotal, gst, discount } = route.params || {};
  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressLine3, setAddressLine3] = useState('');
  const [phone, setPhone] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddress, setShowNewAddress] = useState(true);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState(null);
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [pincode, setPincode] = useState('');
const [city, setCity] = useState('');
const [state, setState] = useState('');

  const { theme } = useTheme();

  // Enhanced delivery options with NimbusPost integration
  useEffect(() => {
    setLoadingOptions(true);
    setOptionsError(null);
    
    api.getSettings()
      .then(settings => {
        const deliverySetting = settings.find(s => s.key === 'delivery_options');
        let options = [
          { 
            id: 'pickup', 
            title: 'Store Pickup', 
            description: 'Collect from our store in Saharanpur', 
            price: 0, 
            icon: '🏪', 
            color: '#4ECDC4',
            estimatedTime: 'Ready in 2-4 hours',
            features: ['No delivery charges', 'Fastest option', 'Quality check before pickup']
          },
          { 
            id: 'delivery', 
            title: 'NimbusPost Delivery', 
            description: 'Delivered to your address via courier', 
            price: 30, 
            icon: '🚚', 
            color: '#FF6B6B',
            estimatedTime: 'Delivered in 1-3 days',
            features: ['Door-to-door delivery', 'Real-time tracking', '25+ courier partners']
          },
        ];
        
        if (deliverySetting && deliverySetting.value) {
          try {
            const parsedOptions = JSON.parse(deliverySetting.value);
            options = parsedOptions.map(option => ({
              ...option,
              estimatedTime: option.estimatedTime || (option.id === 'pickup' ? 'Ready in 2-4 hours' : 'Delivered in 1-3 days'),
              features: option.features || (option.id === 'pickup' 
                ? ['No delivery charges', 'Fastest option', 'Quality check before pickup']
                : ['Door-to-door delivery', 'Real-time tracking', '25+ courier partners']
              )
            }));
          } catch (e) {
            console.error('Error parsing delivery options:', e);
          }
        }
        setDeliveryOptions(options);
      })
      .catch(() => setOptionsError('Failed to load delivery options.'))
      .finally(() => setLoadingOptions(false));
  }, []);

  useEffect(() => {
    api.request('/pickup-locations')
      .then(data => {
        console.log('Pickup locations data:', data);
        setPickupLocations(data);
      })
      .catch(err => {
        console.error('Failed to fetch pickup locations:', err);
        setPickupLocations([]);
      });
  }, []);

const fetchCityState = async (pin) => {
  console.log('fetchCityState called with pin:', pin);

  if (pin.length !== 6) {
      setCity('Enter a Valid Pincode');
      setState('Enter a Valid Pincode');
    return;
  }

  try {
    console.log('Fetching from postalpincode.in for:', pin);
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log('Postalpincode.in response:', data);

    console.log('data[0]:', data[0].PostOffice[0]);

    if (
      data[0].PostOffice.length > 0
    ) {
      const postOffice = data[0].PostOffice[0];
      console.log('✅ Post office found:', postOffice);
      console.log('✅ Setting city/state:', postOffice.District, postOffice.State);
      
      setCity(postOffice.District || 'Invalid Pincode');
      setState(postOffice.State || 'Invalid Pincode');
    } else {
      console.log('❌ No valid postal data found for pincode:', pin);
      setCity('Enter a Valid Pincode');
      setState('Enter a Valid Pincode');
    }
  } catch (e) {
    console.error('❌ Fetch failed:', e);
    setCity('Enter a Valid Pincode');
    setState('Enter a Valid Pincode');
  }
};



// Remove the standalone console.log and put it inside useEffect:
useEffect(() => {
  console.log('Pincode state changed to:', pincode); // Move logging here
  if (pincode.length === 6) {
    fetchCityState(pincode);
  } else {
    setCity('Enter a Valid Pincode');
      setState('Enter a Valid Pincode');
  }
}, [pincode]);



  useEffect(() => {
    ApiService.getUserAddresses()
      .then(setSavedAddresses)
      .catch(() => setSavedAddresses([]));
  }, []);

  useEffect(() => {
    if (deliveryMethod === 'pickup' && pickupLocations.length > 0) {
      setSelectedLocation(pickupLocations[0].id);
    }
    if (deliveryMethod === 'delivery') {
      setShowNewAddress(savedAddresses.length === 0);
      setSelectedAddressId(null);
    }
  }, [deliveryMethod, pickupLocations, savedAddresses]);

  // Get delivery estimate when address changes (for NimbusPost integration)
  useEffect(() => {
    if (deliveryMethod === 'delivery' && addressLine3) {
      const pincode = extractPincode(addressLine3);
      if (pincode) {
        getDeliveryEstimate(pincode);
      }
    }
  }, [addressLine3, deliveryMethod]);

  const extractPincode = (addressLine) => {
    const pincodeMatch = addressLine.match(/\b\d{6}\b/);
    return pincodeMatch ? pincodeMatch[0] : null;
  };

  const getDeliveryEstimate = async (pincode) => {
    if (!pincode || pincode.length !== 6) return;
    
    setLoadingEstimate(true);
    try {
      // This would call your backend which integrates with NimbusPost
      const estimate = await ApiService.request('/shipping/estimate-delivery', {
        method: 'POST',
        body: JSON.stringify({ pincode, weight: 0.2 }) // Approximate weight for documents
      });
      setDeliveryEstimate(estimate);
      
      // Update delivery options with real estimate
      setDeliveryOptions(prev => prev.map(option => 
        option.id === 'delivery' 
          ? { ...option, estimatedTime: estimate.estimatedDays ? `Delivered in ${estimate.estimatedDays} days` : option.estimatedTime }
          : option
      ));
    } catch (error) {
      console.error('Failed to get delivery estimate:', error);
      setDeliveryEstimate(null);
    } finally {
      setLoadingEstimate(false);
    }
  };

  const finalTotal = totalPrice !== undefined && totalPrice !== null ? totalPrice : (total || 0);

  const calculateFinalTotal = () => {
    const selectedDelivery = deliveryOptions.find(method => method.id === deliveryMethod);
    let deliveryPrice = selectedDelivery ? selectedDelivery.price : 0;
    
    // Use real-time delivery price if available from NimbusPost
    if (deliveryEstimate && deliveryEstimate.price) {
      deliveryPrice = deliveryEstimate.price;
    }
    
    return finalTotal + deliveryPrice;
  };

const proceedToPayment = () => {
  if (deliveryMethod === 'delivery') {
    if (showNewAddress) {
      if (!addressLine1.trim() || !addressLine2.trim() || !addressLine3.trim()) {
        Alert.alert('Address Required', 'Please enter your complete delivery address (all 3 lines).');
        return;
      }
      if (!phone.trim()) {
        Alert.alert('Phone Required', 'Please enter your phone number for delivery.');
        return;
      }
      
      // Validate pincode for NimbusPost delivery
      const pincode = extractPincode(addressLine3);
      if (!pincode) {
        Alert.alert('Invalid Address', 'Please include a valid 6-digit pincode in address line 3.');
        return;
      }
    } else {
      if (!selectedAddressId) {
        Alert.alert('Select Address', 'Please select a saved address or add a new one.');
        return;
      }
    }
  }

  let deliveryAddress = '';
  let deliveryPhone = '';
  
  if (deliveryMethod === 'pickup') {
    const location = pickupLocations.find(loc => loc.id === selectedLocation);
    deliveryAddress = location ? `${location.name}, ${location.address}` : 'Store Pickup - LipiPrint Bareilly';
    deliveryPhone = location ? location.phone : '';
  } else {
    if (showNewAddress) {
      deliveryAddress = [addressLine1, addressLine2, addressLine3].filter(Boolean).join(', ').trim();
      deliveryPhone = phone;
    } else {
      const selectedAddr = savedAddresses.find(a => a.id === selectedAddressId);
      deliveryAddress = [selectedAddr?.line1, selectedAddr?.line2, selectedAddr?.line3].filter(Boolean).join(', ').trim();
      deliveryPhone = selectedAddr?.phone || '';
    }
  }

  // ✅ FIXED: Calculate actual delivery cost
  const selectedDelivery = deliveryOptions.find(method => method.id === deliveryMethod);
  let actualDeliveryCost = selectedDelivery ? selectedDelivery.price : 0;
  
  // Use real-time delivery price if available from NimbusPost
  if (deliveryEstimate && deliveryEstimate.price) {
    actualDeliveryCost = deliveryEstimate.price;
  }

  navigation.navigate('Payment', {
    files,
    selectedOptions,
    selectedPaper,
    selectedPrint,
    deliveryType: deliveryMethod ? deliveryMethod.toUpperCase() : undefined,
    deliveryAddress,
    phone: deliveryPhone,
    total: calculateFinalTotal(),
    totalPrice: finalTotal,
    priceBreakdown,
    subtotal,
    gst,
    discount,
    deliveryEstimate, // Pass estimate for order creation
    deliveryCost: actualDeliveryCost, // ✅ FIXED: Pass actual delivery cost
  });
};


  const removeSavedAddress = async (id) => {
    try {
      await ApiService.deleteUserAddress(id);
      setSavedAddresses(prev => prev.filter(addr => addr.id !== id));
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
        setShowNewAddress(true);
      }
    } catch (e) {
      Alert.alert('Delete Failed', e.message || 'Could not delete address.');
    }
  };

  const startEditAddress = (id) => {
    const addr = savedAddresses.find(a => a.id === id);
    if (addr) {
      setEditingAddressId(id);
      setEditFields({
        line1: addr.line1,
        line2: addr.line2,
        line3: addr.line3,
        phone: addr.phone,
      });
    }
  };

  const cancelEditAddress = () => {
    setEditingAddressId(null);
    setEditFields({});
  };

  const saveEditAddress = async (id) => {
    try {
      const updated = await ApiService.updateUserAddress(id, editFields);
      setSavedAddresses(prev => prev.map(addr => addr.id === id ? updated : addr));
      setEditingAddressId(null);
      setEditFields({});
    } catch (e) {
      Alert.alert('Update Failed', e.message || 'Could not update address.');
    }
  };

  const addNewAddress = async () => {
    if (!addressLine1.trim() || !addressLine2.trim() || !addressLine3.trim() || !phone.trim()) {
      Alert.alert('Address Required', 'Please enter your complete delivery address and phone.');
      return;
    }
    
    // Validate pincode
if (!pincode || pincode.length !== 6) {
  Alert.alert('Invalid Address', 'Please enter a valid 6-digit pincode.');
  return;
}
if (!city || !state) {
  Alert.alert('Invalid Address', 'Could not fetch city/state from pincode. Please check the pincode.');
  return;
}

    
    try {
const newAddr = await ApiService.addUserAddress({
  line1: addressLine1,
  line2: addressLine2,
  line3: addressLine3,
  phone: phone,
  pincode: pincode,
  city: city,
  state: state,
  addressType: 'home',
});
      setSavedAddresses(prev => [...prev, newAddr]);
      setShowNewAddress(false);
      setSelectedAddressId(newAddr.id);
      setAddressLine1('');
      setAddressLine2('');
      setAddressLine3('');
      setPhone('');
      setPincode('');
      setCity('');
      setState('');
    } catch (e) {
      Alert.alert('Add Failed', e.message || 'Could not add address.');
    }
  };

  if (loadingOptions) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LottieView
            source={LoadingWorld}
            autoPlay
            loop
            speed={2}
            style={{ width: 180, height: 180 }}
          />
          <Text style={styles.loadingText}>Loading delivery options...</Text>
        </View>
      </View>
    );
  }

  if (optionsError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>{optionsError}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setLoadingOptions(true);
              setOptionsError(null);
              // Retry loading options
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#22194f', '#22194f']}
          style={styles.headerGradient}
        >
          <Heading
            title="Delivery Options"
            subtitle="Choose how you want to receive your prints"
            variant="primary"
          />
        </LinearGradient>

        <View style={styles.content}>
          {/* Delivery Methods */}
          <Animatable.View animation="fadeInUp" delay={200} duration={500}>
            <Text style={styles.sectionTitle}>Delivery Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deliveryScroll}>
              {deliveryOptions.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.deliveryCard,
                    deliveryMethod === method.id && styles.selectedDeliveryCard,
                  ]}
                  onPress={() => setDeliveryMethod(method.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.deliveryIcon}>{method.icon}</Text>
                  <Text style={styles.deliveryTitle}>{method.title}</Text>
                  <Text style={styles.deliveryDesc}>{method.description}</Text>
                  <Text style={styles.deliveryTime}>
                    {loadingEstimate && method.id === 'delivery' ? 'Calculating...' : method.estimatedTime}
                  </Text>
                  
                  {/* Features */}
                  {method.features && (
                    <View style={styles.featuresContainer}>
                      {method.features.slice(0, 2).map((feature, index) => (
                        <Text key={index} style={styles.featureText}>• {feature}</Text>
                      ))}
                    </View>
                  )}
                  
                  {method.price > 0 && (
                    <Text style={styles.deliveryPrice}>
                      +₹{deliveryEstimate && method.id === 'delivery' && deliveryEstimate.price 
                        ? deliveryEstimate.price 
                        : method.price}
                    </Text>
                  )}
                  {method.price === 0 && <Text style={styles.freeText}>FREE</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* NimbusPost Badge */}
            {deliveryMethod === 'delivery' && (
              <View style={styles.nimbusPostBadge}>
                <Icon name="local-shipping" size={16} color="#667eea" />
                <Text style={styles.badgeText}>Powered by NimbusPost - 25+ Courier Partners</Text>
              </View>
            )}
          </Animatable.View>

          {/* Pickup Locations */}
          {deliveryMethod === 'pickup' && pickupLocations.length > 0 && (
            <Animatable.View animation="fadeInUp" delay={400} duration={500}>
              <Text style={styles.sectionTitle}>Pickup Location</Text>
              <View style={styles.locationGrid}>
                {pickupLocations.map((location) => (
                  <TouchableOpacity
                    key={location.id}
                    style={[
                      styles.locationCard,
                      selectedLocation === location.id && styles.selectedLocationCard,
                    ]}
                    onPress={() => setSelectedLocation(location.id)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.locationHeader}>
                      <Icon name="store" size={20} color="#4ECDC4" />
                      <Text style={styles.locationName}>{location.name}</Text>
                    </View>
                    <Text style={styles.locationAddress}>{location.address}</Text>
                    <Text style={styles.locationDistance}>📍 {location.distance}</Text>
                    <Text style={styles.locationPhone}>📞 {location.phone}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animatable.View>
          )}

          {/* Delivery Address */}
          {deliveryMethod === 'delivery' && (
            <Animatable.View animation="fadeInUp" delay={400} duration={500}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              
              {/* Delivery Estimate Info */}
              {deliveryEstimate && (
                <View style={styles.estimateCard}>
                  <Icon name="schedule" size={18} color="#4CAF50" />
                  <Text style={styles.estimateText}>
                    Expected delivery in {deliveryEstimate.estimatedDays || '2-3'} days
                  </Text>
                  {deliveryEstimate.courierPartner && (
                    <Text style={styles.courierText}>via {deliveryEstimate.courierPartner}</Text>
                  )}
                </View>
              )}

              {/* Show summary if a saved address is selected */}
              {!showNewAddress && selectedAddressId && (
                <View style={styles.selectedAddressSummary}>
                  <Text style={styles.summaryLabel}>Selected Address:</Text>
                  <Text style={styles.summaryValue}>{savedAddresses.find(a => a.id === selectedAddressId)?.line1}</Text>
                  <Text style={styles.summaryValue}>{savedAddresses.find(a => a.id === selectedAddressId)?.line2}</Text>
                  <Text style={styles.summaryValue}>{savedAddresses.find(a => a.id === selectedAddressId)?.line3}</Text>
                  <Text style={styles.summaryValue}>📞 {savedAddresses.find(a => a.id === selectedAddressId)?.phone}</Text>
                </View>
              )}

              {/* Saved Addresses */}
              {savedAddresses.length > 0 && (
                <View style={styles.savedAddressesSection}>
                  {savedAddresses.map(addr => (
                    <View
                      key={addr.id}
                      style={[
                        styles.savedAddressCard,
                        selectedAddressId === addr.id && !showNewAddress && styles.selectedSavedAddressCard,
                        {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}
                      ]}
                    >
                      {editingAddressId === addr.id ? (
                        <View style={{flex: 1}}>
                          <TextInput
                            style={styles.addressInput}
                            value={editFields.line1}
                            onChangeText={text => setEditFields(fields => ({...fields, line1: text}))}
                            placeholder="Flat/House No., Building, Street"
                          />
                          <TextInput
                            style={styles.addressInput}
                            value={editFields.line2}
                            onChangeText={text => setEditFields(fields => ({...fields, line2: text}))}
                            placeholder="Area, Locality, Landmark"
                          />
                          <TextInput
                            style={styles.addressInput}
                            value={editFields.line3}
                            onChangeText={text => setEditFields(fields => ({...fields, line3: text}))}
                            placeholder="City, State, Pincode (Required)"
                          />
                          <TextInput
                            style={styles.phoneInput}
                            value={editFields.phone}
                            onChangeText={text => setEditFields(fields => ({...fields, phone: text}))}
                            placeholder="Phone Number"
                            keyboardType="phone-pad"
                          />
                          <View style={{flexDirection: 'row', marginTop: 6}}>
                            <TouchableOpacity onPress={() => saveEditAddress(addr.id)} style={{marginRight: 12, padding: 4}}>
                              <Icon name="check" size={20} color="#4ECDC4" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={cancelEditAddress} style={{padding: 4}}>
                              <Icon name="close" size={20} color="#FF6B6B" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={{flex: 1}}
                          onPress={() => {
                            setSelectedAddressId(addr.id);
                            setShowNewAddress(false);
                            setEditingAddressId(null);
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.savedAddressText}>{addr.line1}</Text>
                          <Text style={styles.savedAddressText}>{addr.line2}</Text>
                          <Text style={styles.savedAddressText}>{addr.line3}</Text>
                          <Text style={styles.savedAddressPhone}>📞 {addr.phone}</Text>
                        </TouchableOpacity>
                      )}
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        {editingAddressId !== addr.id && (
                          <TouchableOpacity onPress={() => startEditAddress(addr.id)} style={{marginLeft: 8, padding: 4}}>
                            <Icon name="edit" size={20} color="#667eea" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => removeSavedAddress(addr.id)} style={{marginLeft: 8, padding: 4}}>
                          <Icon name="delete" size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[styles.savedAddressCard, showNewAddress && styles.selectedSavedAddressCard, { borderStyle: 'dashed', borderColor: '#667eea', borderWidth: 2 }]}
                    onPress={() => {
                      setShowNewAddress(true);
                      setSelectedAddressId(null);
                      setEditingAddressId(null);
                      setAddressLine1('');
                      setAddressLine2('');
                      setAddressLine3('');
                      setPhone('');
                    }}
                    activeOpacity={0.85}
                  >
                    <Icon name="add" size={20} color="#667eea" style={{marginRight: 8}} />
                    <Text style={styles.addNewText}>Add New Address</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* New Address Fields */}
              {showNewAddress && !editingAddressId && (
                <>
                <View style={styles.inputContainer}>
  <Text style={styles.inputLabel}>Pincode *</Text>
  <TextInput
    style={styles.addressInput}
    placeholder="Enter 6-digit pincode"
    keyboardType="numeric"
    maxLength={6}
    value={pincode}
    onChangeText={setPincode}
  />
  {pincode && pincode.length !== 6 && (
    <Text style={styles.errorHint}>Pincode must be 6 digits</Text>
  )}
</View>

<View style={styles.inputContainer}>
  <Text style={styles.inputLabel}>City</Text>
  <TextInput
    style={styles.addressInput}
    value={city}
    editable={false}
    placeholder="Auto-filled city"
  />
</View>
<View style={styles.inputContainer}>
  <Text style={styles.inputLabel}>State</Text>
  <TextInput
    style={styles.addressInput}
    value={state}
    editable={false}
    placeholder="Auto-filled state"
  />
</View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Address Line 1 *</Text>
                    <TextInput
                      style={styles.addressInput}
                      placeholder="Flat/House No., Building, Street"
                      value={addressLine1}
                      onChangeText={setAddressLine1}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Address Line 2 *</Text>
                    <TextInput
                      style={styles.addressInput}
                      placeholder="Area, Locality, Landmark"
                      value={addressLine2}
                      onChangeText={setAddressLine2}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Address Line 3 (Include Pincode) *</Text>
                    <TextInput
                      style={styles.addressInput}
                      placeholder="City, State, Pincode (e.g., Saharanpur, UP 247001)"
                      value={addressLine3}
                      onChangeText={setAddressLine3}
                    />
                    {addressLine3 && !extractPincode(addressLine3) && (
                      <Text style={styles.errorHint}>Please include a valid 6-digit pincode</Text>
                    )}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Phone Number *</Text>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="Enter your phone number"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.continueButton, {marginTop: 10, backgroundColor: '#667eea'}]}
                    onPress={addNewAddress}
                  >
                    <Icon name="save" size={18} color="white" style={{marginRight: 8}} />
                    <Text style={styles.continueText}>Save Address</Text>
                  </TouchableOpacity>
                </>
              )}
            </Animatable.View>
          )}

          {/* Order Summary */}
          <Animatable.View animation="fadeInUp" delay={600} duration={500}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Printing Cost</Text>
                <Text style={styles.summaryValue}>₹{total}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                </Text>
                <Text style={styles.summaryValue}>
                  ₹{deliveryEstimate && deliveryMethod === 'delivery' && deliveryEstimate.price 
                    ? deliveryEstimate.price 
                    : (deliveryOptions.find(m => m.id === deliveryMethod)?.price || 0)}
                </Text>
              </View>
              {gst > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GST</Text>
                  <Text style={styles.summaryValue}>₹{gst}</Text>
                </View>
              )}
              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, {color: '#4CAF50'}]}>Discount</Text>
                  <Text style={[styles.summaryValue, {color: '#4CAF50'}]}>-₹{discount}</Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>₹{calculateFinalTotal()}</Text>
              </View>
            </View>
          </Animatable.View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <Animatable.View animation="fadeInUp" delay={800} duration={500} style={styles.buttonContainer}>
        <TouchableOpacity onPress={proceedToPayment} activeOpacity={0.85}>
          <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.continueButton}>
            <Icon name="arrow-forward" size={18} color="white" style={{marginRight: 8}} />
            <Text style={styles.continueText}>Continue to Payment</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
}

const CARD_WIDTH = (width - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#22194f',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  deliveryScroll: {
    paddingRight: 8,
    gap: 16,
  },
  deliveryCard: {
    width: CARD_WIDTH,
    marginRight: 16,
    backgroundColor: 'white',
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 220,
  },
  selectedDeliveryCard: {
    borderColor: '#667eea',
    backgroundColor: '#f0f8ff',
  },
  deliveryIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  deliveryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  deliveryDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  deliveryTime: {
    fontSize: 13,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 8,
  },
  featureText: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    lineHeight: 14,
  },
  deliveryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  freeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nimbusPostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  badgeText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginLeft: 6,
  },
  locationGrid: {
    marginBottom: 32,
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLocationCard: {
    borderColor: '#667eea',
    backgroundColor: '#f0f8ff',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  locationAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  locationDistance: {
    fontSize: 13,
    color: '#667eea',
    marginBottom: 2,
  },
  locationPhone: {
    fontSize: 13,
    color: '#4ECDC4',
  },
  estimateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  estimateText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  courierText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
    fontWeight: '600',
  },
  addressInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#222',
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: '#e0e7ef',
  },
  phoneInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#222',
    borderWidth: 1.5,
    borderColor: '#e0e7ef',
  },
  errorHint: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#333',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e7ef',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#667eea',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  continueButton: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  continueText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  savedAddressesSection: {
    marginBottom: 18,
  },
  savedAddressCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectedSavedAddressCard: {
    borderColor: '#667eea',
    backgroundColor: '#f0f8ff',
  },
  savedAddressText: {
    fontSize: 14,
    color: '#222',
    marginBottom: 2,
  },
  savedAddressPhone: {
    fontSize: 13,
    color: '#667eea',
    marginTop: 2,
  },
  addNewText: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectedAddressSummary: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 1,
  },
});
