import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ApiService from '../../services/api';
import GoogleAuthService from '../../services/googleAuth';
import { useTheme } from '../../theme/ThemeContext';
import CustomAlert from '../../components/CustomAlert';
import { SecurityValidator } from '../../utils/security';

export default function SignUpScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'student', // 'student' or 'professional'
    gstin: '',
  });
  const [inputFocused, setInputFocused] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [isLoading, setIsLoading] = useState(false);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFocus = (field) => {
    setInputFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setInputFocused(prev => ({ ...prev, [field]: false }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setAlertTitle('Error');
      setAlertMessage('Please enter your full name');
      setAlertType('error');
      setAlertVisible(true);
      return false;
    }
    if (!formData.email.trim()) {
      setAlertTitle('Error');
      setAlertMessage('Please enter your email');
      setAlertType('error');
      setAlertVisible(true);
      return false;
    }
    
    // Validate email format
    const emailValidation = SecurityValidator.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setAlertTitle('Error');
      setAlertMessage(emailValidation.error);
      setAlertType('error');
      setAlertVisible(true);
      return false;
    }
    if (!formData.phone.trim()) {
      setAlertTitle('Error');
      setAlertMessage('Please enter your phone number');
      setAlertType('error');
      setAlertVisible(true);
      return false;
    }
    if (!formData.password.trim()) {
      setAlertTitle('Error');
      setAlertMessage('Please enter your 4-digit PIN');
      setAlertType('error');
      setAlertVisible(true);
      return false;
    }
    if (formData.password.length !== 4) {
      setAlertTitle('Error');
      setAlertMessage('PIN must be exactly 4 digits');
      setAlertType('error');
      setAlertVisible(true);
      return false;
    }
    if (!/^[0-9]{4}$/.test(formData.password)) {
      setAlertTitle('Error');
      setAlertMessage('PIN must contain only numbers');
      setAlertType('error');
      setAlertVisible(true);
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setAlertTitle('Error');
      setAlertMessage('PINs do not match');
      setAlertType('error');
      setAlertVisible(true);
      return false;
    }
    
    // GSTIN validation for professionals
    if (formData.userType === 'professional' && formData.gstin.trim()) {
      const gstin = formData.gstin.trim();
      if (gstin.length !== 15) {
        setAlertTitle('Error');
        setAlertMessage('GSTIN must be exactly 15 characters long');
        setAlertType('error');
        setAlertVisible(true);
        return false;
      }
      // Check if first 2 characters are numeric
      const firstTwoDigits = gstin.substring(0, 2);
      if (!/^[0-9]{2}$/.test(firstTwoDigits)) {
        setAlertTitle('Error');
        setAlertMessage('GSTIN must start with 2 numeric characters');
        setAlertType('error');
        setAlertVisible(true);
        return false;
      }
      // Additional validation - ensure it contains valid GSTIN format
      const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinPattern.test(gstin)) {
        setAlertTitle('Error');
        setAlertMessage('Please enter a valid GSTIN number');
        setAlertType('error');
        setAlertVisible(true);
        return false;
      }
    }
    
    return true;
  };

  const handleSignUp = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        const payload = {
          name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          userType: formData.userType,
        };
        if (formData.userType === 'professional' && formData.gstin.trim()) {
          payload.gstin = formData.gstin.trim();
        }
        
        const response = await ApiService.register(payload);
        
        if (response.accessToken || response.token) {
          await ApiService.setToken(response.accessToken || response.token);
        }
        
        setAlertTitle('Success!');
        setAlertMessage('Account created and logged in successfully.');
        setAlertType('success');
        setAlertVisible(true);
        
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }, 500);
      } catch (error) {
        setAlertTitle('Registration Failed');
        setAlertMessage(error.message || 'Registration failed. Please try again.');
        setAlertType('error');
        setAlertVisible(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const response = await GoogleAuthService.signInWithGoogle();
      console.log('✅ Google Sign-Up successful:', response);

      setAlertTitle('Success!');
      setAlertMessage('Account created and logged in successfully with Google.');
      setAlertType('success');
      setAlertVisible(true);
      
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }, 500);
    } catch (error) {
      console.error('❌ Google Sign-Up Error:', error);
      setAlertTitle('Google Sign-Up Failed');
      setAlertMessage(error.message || 'Google sign-up failed. Please try again.');
      setAlertType('error');
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <Animatable.View animation="fadeInDown" delay={100} duration={500} style={styles.header}>
          <Text style={[styles.headerTitle]}>Create Account</Text>
          <Text style={[styles.headerSubtitle, { color: theme.text }]}>Join LipiPrint for amazing printing services</Text>
        </Animatable.View>
      </LinearGradient>
      <View style={styles.content}>
        {isLoading && (
          <View style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        )}
        {/* Full Name Input */}
            <Animatable.View animation="fadeInUp" delay={200} duration={500}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, inputFocused.fullName && styles.inputFocused]}
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(value) => updateFormData('fullName', value)}
                onFocus={() => handleFocus('fullName')}
                onBlur={() => handleBlur('fullName')}
              />
            </Animatable.View>

            {/* Email Input */}
            <Animatable.View animation="fadeInUp" delay={250} duration={500}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Email Address</Text>
              <TextInput
                style={[styles.input, inputFocused.email && styles.inputFocused]}
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                onFocus={() => handleFocus('email')}
                onBlur={() => handleBlur('email')}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Animatable.View>

            {/* Phone Input */}
            <Animatable.View animation="fadeInUp" delay={300} duration={500}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Phone Number</Text>
              <View style={[styles.phoneInputContainer, inputFocused.phone && styles.inputFocused]}>
                <View style={styles.countryCode}>
                  <Text style={[styles.countryCodeText, { color: theme.text }]}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  onFocus={() => handleFocus('phone')}
                  onBlur={() => handleBlur('phone')}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </Animatable.View>

            {/* Password Input */}
            <Animatable.View animation="fadeInUp" delay={325} duration={500}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>4-Digit PIN</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, inputFocused.password && styles.inputFocused]}
                  placeholder="Enter your 4-digit PIN"
                  value={formData.password}
                  onChangeText={(value) => {
                    // Only allow numeric input and limit to 4 digits
                    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 4);
                    updateFormData('password', numericValue);
                  }}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
                  secureTextEntry={!showPassword}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={togglePasswordVisibility}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>

            {/* Confirm Password Input */}
            <Animatable.View animation="fadeInUp" delay={350} duration={500}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm 4-Digit PIN</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, inputFocused.confirmPassword && styles.inputFocused]}
                  placeholder="Confirm your 4-digit PIN"
                  value={formData.confirmPassword}
                  onChangeText={(value) => {
                    // Only allow numeric input and limit to 4 digits
                    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 4);
                    updateFormData('confirmPassword', numericValue);
                  }}
                  onFocus={() => handleFocus('confirmPassword')}
                  onBlur={() => handleBlur('confirmPassword')}
                  secureTextEntry={!showConfirmPassword}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={toggleConfirmPasswordVisibility}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>

            {/* User Type Selection */}
            <Animatable.View animation="fadeInUp" delay={375} duration={500}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>I am a</Text>
              <View style={styles.userTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    formData.userType === 'student' && styles.userTypeSelected
                  ]}
                  onPress={() => updateFormData('userType', 'student')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.userTypeIcon,
                    formData.userType === 'student' && styles.userTypeIconSelected
                  ]}>🎓</Text>
                  <Text style={[
                    styles.userTypeText,
                    formData.userType === 'student' && styles.userTypeTextSelected
                  ]}>Student</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    formData.userType === 'professional' && styles.userTypeSelected
                  ]}
                  onPress={() => updateFormData('userType', 'professional')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.userTypeIcon,
                    formData.userType === 'professional' && styles.userTypeIconSelected
                  ]}>💼</Text>
                  <Text style={[
                    styles.userTypeText,
                    formData.userType === 'professional' && styles.userTypeTextSelected
                  ]}>Professional</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>

            {/* GSTIN Input (only for professionals) */}
            {formData.userType === 'professional' && (
              <Animatable.View animation="fadeInUp" delay={400} duration={500}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>GSTIN Number (Optional)</Text>
                <TextInput
                  style={[styles.input, inputFocused.gstin && styles.inputFocused]}
                  placeholder="Enter your GSTIN number (15 characters)"
                  value={formData.gstin}
                  onChangeText={(value) => {
                    const uppercaseValue = value.toUpperCase();
                    // Limit to 15 characters
                    const limitedValue = uppercaseValue.slice(0, 15);
                    updateFormData('gstin', limitedValue);
                  }}
                  onFocus={() => handleFocus('gstin')}
                  onBlur={() => handleBlur('gstin')}
                  autoCapitalize="characters"
                  maxLength={15}
                />
                <Text style={styles.gstinNote}>
                  GSTIN helps you claim tax benefits on business orders.{'\n'}⚠️ You are responsible for ensuring the entered GSTIN number is correct.
                </Text>
              </Animatable.View>
            )}

            {/* Terms and Conditions */}
            <Animatable.View animation="fadeInUp" delay={formData.userType === 'professional' ? 450 : 425} duration={500}>
              <View style={styles.termsContainer}>
                <Text style={[styles.termsText, { color: theme.text }]}>
                  By signing up, you agree to our{' '}
                  <Text style={[styles.termsLink, { color: theme.text }]}>Terms of Service</Text> and{' '}
                  <Text style={[styles.termsLink, { color: theme.text }]}>Privacy Policy</Text>
                </Text>
              </View>
            </Animatable.View>

            {/* Sign Up Button */}
            <Animatable.View animation="fadeInUp" delay={formData.userType === 'professional' ? 475 : 450} duration={500}>
              <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} activeOpacity={0.9} disabled={isLoading}>
                <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.signUpGradient}>
                  <Text style={[styles.signUpText]}>Create Account</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animatable.View>

            {/* Login Link */}
            <Animatable.View animation="fadeInUp" delay={formData.userType === 'professional' ? 500 : 475} duration={500}>
              <View style={styles.loginContainer}>
                <Text style={[styles.loginText, { color: theme.text }]}>
                  Already have an account?{' '}
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={[styles.loginLink, { color: theme.text }]}>Sign In</Text>
                  </TouchableOpacity>
                </Text>
              </View>
            </Animatable.View>

            {/* Social Sign Up Options */}
            <Animatable.View animation="fadeInUp" delay={formData.userType === 'professional' ? 525 : 500} duration={500}>
              <View style={styles.socialContainer}>
                <Text style={[styles.socialText, { color: theme.text }]}>Or sign up with</Text>
                <View style={styles.socialButtons}>
                  <TouchableOpacity 
                    style={[styles.socialButton, styles.socialButtonDisabled]} 
                    activeOpacity={0.8} 
                    onPress={() => showAlert('Coming Soon', 'Google Sign-Up will be available soon. Please use email/password for now.', 'info')}
                    disabled={true}
                  >
                    <FontAwesome name="google" size={24} color="#999" style={styles.socialIcon} />
                    <Text style={[styles.socialLabel, styles.socialLabelDisabled, { color: theme.text }]}>Google (Coming Soon)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animatable.View>
        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          onConfirm={() => {
            setAlertVisible(false);
            if (alertType === 'success' && alertTitle === 'Success!') {
              // Navigation is handled in the setTimeout above
            }
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  eyeText: {
    fontSize: 20,
  },
  inputFocused: {
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginBottom: 20,
    overflow: 'hidden',
  },
  countryCode: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  userTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userTypeSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f0f8ff',
  },
  userTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  userTypeIconSelected: {
    transform: [{ scale: 1.1 }],
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  userTypeTextSelected: {
    color: '#667eea',
  },
  gstinNote: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: -8,
    marginBottom: 20,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#667eea',
    fontWeight: '600',
  },
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  signUpGradient: {
    padding: 16,
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  loginContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  socialContainer: {
    alignItems: 'center',
  },
  socialText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  socialButtonDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  socialLabelDisabled: {
    color: '#999',
  },
}); 