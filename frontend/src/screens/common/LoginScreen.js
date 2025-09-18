import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as Animatable from 'react-native-animatable';
import ApiService from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import CustomAlert from '../../components/CustomAlert';

export default function LoginScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [inputFocused, setInputFocused] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');

  const showAlert = (title, message, type = 'error') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleLogin = async () => {
    setPhoneError('');
    setPasswordError('');
    
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();
    
    if (!cleanPhone || cleanPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    if (!cleanPassword) {
      setPasswordError('Please enter your password');
      return;
    }

    setIsLoading(true);
    console.log(`🔐 Attempting login for: ${cleanPhone}`);
    
    try {
      const response = await ApiService.login(cleanPhone, cleanPassword);
      
      console.log('✅ Login successful:', response);

      // Determine user role and navigate
      let userRole = null;
      if (response?.user?.role) {
        userRole = response.user.role;
      } else if (response?.userDTO?.role) {
        userRole = response.userDTO.role;
      }
      
      console.log('👤 User role determined:', userRole);

      // Reset states
      setPhone('');
      setPassword('');

      // Navigate based on role
      if (userRole === 'ADMIN') {
        console.log('🔄 Navigating to AdminTabs');
        navigation.reset({ index: 0, routes: [{ name: 'AdminTabs' }] });
      } else if (userRole === 'DELIVERY') {
        console.log('🔄 Navigating to DeliveryTabs');
        navigation.reset({ index: 0, routes: [{ name: 'DeliveryTabs' }] });
      } else {
        console.log('🔄 Navigating to MainTabs');
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
      
    } catch (error) {
      console.error('❌ Login Error:', error);
      
      if (error.message === 'Unauthorized') {
        setPasswordError('Invalid phone number or password');
      } else {
        showAlert('Login Failed', error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocus = (field) => {
    setInputFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setInputFocused(prev => ({ ...prev, [field]: false }));
  };

  const handlePhoneChange = (value) => {
    // Only allow digits, cap length to 10
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(sanitized);
    if (phoneError) setPhoneError('');
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (passwordError) setPasswordError('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Animatable.View animation="fadeInDown" delay={100} duration={500} style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo/LipiPrintLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={200} duration={350} style={styles.textSection}>
            <Text style={[styles.headline]}>
              Sign In
            </Text>
            <Animatable.Text animation="fadeInUp" delay={300} duration={350} style={[styles.subheading, { color: theme.text }]}>
              Sign in to print smarter and faster.
            </Animatable.Text>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={300} duration={350} style={{ width: '100%' }}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={[styles.inputRow, inputFocused.phone && styles.inputRowFocused, phoneError && styles.inputRowError]}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCode}>+91</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={handlePhoneChange}
                maxLength={10}
                onFocus={() => handleFocus('phone')}
                onBlur={() => handleBlur('phone')}
              />
            </View>
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={400} duration={350} style={{ width: '100%' }}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={[styles.passwordInput, inputFocused.password && styles.passwordInputFocused, passwordError && styles.passwordInputError]}
              placeholder="Enter your password"
              value={password}
              onChangeText={handlePasswordChange}
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
              secureTextEntry={true}
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={500} duration={350} style={{ width: '100%' }}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.ctaText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </Animatable.View>

          <TouchableOpacity style={styles.signupLink} onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.signupText]}>
              Don't have an account? <Text style={{ color: '#00C6FB', fontWeight: 'bold' }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          <CustomAlert
            visible={alertVisible}
            title={alertTitle}
            message={alertMessage}
            type={alertType}
            onConfirm={() => setAlertVisible(false)}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
  },
  textSection: {
    marginTop: 10,
    marginBottom: 32,
    alignItems: 'center',
  },
  headline: {
    fontSize: 50,
    fontWeight: '900',
    color: '#1A232E',
    marginBottom: 16,
    lineHeight: 54,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 18,
    color: '#222',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    height: 56,
    overflow: 'hidden',
  },
  inputRowFocused: {
    borderColor: '#00C6FB',
    shadowColor: '#00C6FB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputRowError: {
    borderColor: '#EF4444',
  },
  countryCodeBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    height: '100%',
  },
  countryCode: {
    fontSize: 18,
    color: '#222',
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingHorizontal: 16,
    color: '#222',
    backgroundColor: '#fff',
    height: '100%',
  },
  ctaButton: {
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 32,
    backgroundColor: '#0058A3',
    shadowColor: '#0058A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  ctaText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  passwordInput: {
    width: '100%',
    fontSize: 18,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    color: '#222',
    backgroundColor: '#fff',
  },
  passwordInputFocused: {
    borderColor: '#00C6FB',
    shadowColor: '#00C6FB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  passwordInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: -16,
    marginBottom: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  resendText: {
    color: '#00C6FB',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  signupLink: {
    marginTop: 8,
    marginBottom: 16,
    alignSelf: 'center',
  },
  signupText: {
    color: '#222',
    fontSize: 16,
    textAlign: 'center',
  },
});
