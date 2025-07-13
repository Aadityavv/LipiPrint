import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { validateName, validateEmail, validateAddress, validatePincode, validateGSTIN } from '../../utils/security';
import CustomAlert from '../../components/CustomAlert';
import { useTheme } from '../../theme/ThemeContext';

export default function ProfileCompletionScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    pincode: '',
    gstin: '',
    companyName: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState({});
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [alertOnConfirm, setAlertOnConfirm] = useState(null);
  const [alertShowCancel, setAlertShowCancel] = useState(false);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate first name
    const firstNameValidation = validateName(formData.firstName, 'First Name');
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.error;
    }

    // Validate last name
    const lastNameValidation = validateName(formData.lastName, 'Last Name');
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.error;
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }

    // Validate address
    const addressValidation = validateAddress(formData.address);
    if (!addressValidation.isValid) {
      newErrors.address = addressValidation.error;
    }

    // Validate pincode
    const pincodeValidation = validatePincode(formData.pincode);
    if (!pincodeValidation.isValid) {
      newErrors.pincode = pincodeValidation.error;
    }

    // Validate GSTIN (optional)
    if (formData.gstin) {
      const gstinValidation = validateGSTIN(formData.gstin);
      if (!gstinValidation.isValid) {
        newErrors.gstin = gstinValidation.error;
      }
    }

    // Validate company name (optional)
    if (formData.companyName) {
      const companyValidation = validateName(formData.companyName, 'Company Name');
      if (!companyValidation.isValid) {
        newErrors.companyName = companyValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showAlert('Validation Error', 'Please fix the errors in the form.', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      // Here you would typically make an API call to update the user profile
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store user data in AsyncStorage or your preferred storage
      // await AsyncStorage.setItem('userProfile', JSON.stringify(formData));
      
      showAlert(
        'Profile Updated',
        'Your profile has been successfully updated!',
        'success',
        () => {
          // Navigate to main app based on user role
          // You can determine role from route params or stored data
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }
      );
    } catch (error) {
      showAlert('Error', 'Failed to update profile. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (title, message, type = 'info', onConfirm = null, showCancel = false) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertOnConfirm(() => onConfirm);
    setAlertShowCancel(showCancel);
    setAlertVisible(true);
  };

  const renderInput = (field, label, placeholder, keyboardType = 'default', maxLength = null) => (
    <Animatable.View animation="fadeInUp" delay={100} duration={350} style={{ width: '100%' }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          inputFocused[field] && styles.inputFocused,
          errors[field] && styles.inputError
        ]}
        placeholder={placeholder}
        value={formData[field]}
        onChangeText={(value) => updateFormData(field, value)}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onFocus={() => setInputFocused(prev => ({ ...prev, [field]: true }))}
        onBlur={() => setInputFocused(prev => ({ ...prev, [field]: false }))}
      />
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </Animatable.View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <Animatable.View animation="fadeInDown" delay={100} duration={500} style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          Please provide your details to complete your account setup
        </Text>
      </Animatable.View>

      <View style={styles.formContainer}>
        {renderInput('firstName', 'First Name', 'Enter your first name', 'default', 50)}
        {renderInput('lastName', 'Last Name', 'Enter your last name', 'default', 50)}
        {renderInput('email', 'Email Address', 'Enter your email address', 'email-address', 100)}
        {renderInput('address', 'Address', 'Enter your complete address', 'default', 200)}
        {renderInput('pincode', 'Pincode', 'Enter 6-digit pincode', 'numeric', 6)}
        {renderInput('companyName', 'Company Name (Optional)', 'Enter your company name', 'default', 100)}
        {renderInput('gstin', 'GSTIN (Optional)', 'Enter 15-character GSTIN', 'default', 15)}

        <Animatable.View animation="fadeInUp" delay={800} duration={350} style={{ width: '100%' }}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Updating Profile...' : 'Complete Profile'}
            </Text>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={900} duration={350} style={styles.skipContainer}>
          <TouchableOpacity
            onPress={() => {
              showAlert(
                'Skip Profile',
                'You can complete your profile later from settings. Continue to app?',
                'info',
                () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                  });
                },
                true
              );
            }}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertOnConfirm}
        showCancel={alertShowCancel}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A232E',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    color: '#222',
    backgroundColor: '#fff',
  },
  inputFocused: {
    borderColor: '#00C6FB',
    shadowColor: '#00C6FB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: -16,
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 20,
    backgroundColor: '#0058A3',
    shadowColor: '#0058A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  skipContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  skipText: {
    color: '#666',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
}); 