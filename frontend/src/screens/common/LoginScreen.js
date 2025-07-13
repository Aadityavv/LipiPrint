import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { validatePhone, validateOTP } from '../../utils/security';
import ApiService from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import CustomAlert from '../../components/CustomAlert';
// import SvgUri from 'react-native-svg-uri'; // Uncomment if using react-native-svg-uri

export default function LoginScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [phone, setPhone] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const MASTER_OTP = '9999';

  const handleSendOTP = async () => {
    setPhoneError('');
    if (!phone.trim()) {
      setAlertTitle('Error');
      setAlertMessage('Please enter your phone number');
      setAlertType('error');
      setAlertVisible(true);
      return;
    }
    setIsLoading(true);
    try {
      await ApiService.request('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
        headers: { 'Content-Type': 'application/json' },
      });
      setShowOtp(true);
    } catch (error) {
      setAlertTitle('OTP Failed');
      setAlertMessage('Failed to send OTP');
      setAlertType('error');
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setOtpError('');
    if (!otp.trim()) {
      setOtpError('Please enter the OTP');
      return;
    }
    setIsLoading(true);
    try {
      const response = await ApiService.request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.accessToken || response.token) {
        // Support both accessToken and token for compatibility
        const token = response.accessToken || response.token;
        await ApiService.setToken(token);
        setShowOtp(false);
        // Get user role from response
        let userRole = null;
        if (response.user && response.user.role) {
          userRole = response.user.role;
        } else if (response.userDTO && response.userDTO.role) {
          userRole = response.userDTO.role;
        }
        // Navigate based on role
        if (userRole === 'ADMIN') {
          navigation.reset({ index: 0, routes: [{ name: 'AdminTabs' }] });
        } else if (userRole === 'DELIVERY') {
          navigation.reset({ index: 0, routes: [{ name: 'DeliveryTabs' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }
      } else {
        setOtpError('Invalid OTP');
      }
    } catch (error) {
      setOtpError('Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserProfileComplete = async (phoneNumber) => {
    // This would typically be an API call to check if user profile is complete
    // For demo purposes, we'll simulate different scenarios based on phone number
    if (phoneNumber === '2') {
      return true; // Admin - profile complete
    } else if (phoneNumber === '3') {
      return true; // Delivery - profile complete
    } else {
      // Regular user - check if profile is complete
      // You would typically check this from your backend
      return false; // For demo, assume profile is incomplete
    }
  };

  const navigateBasedOnRole = (phoneNumber) => {
    if (phoneNumber === '2') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'AdminTabs' }],
      });
    } else if (phoneNumber === '3') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'DeliveryTabs' }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  };

  const handlePhoneChange = (value) => {
    setPhone(value);
    if (phoneError) {
      setPhoneError('');
    }
  };

  const handleOtpChange = (value) => {
    setOtp(value);
    if (otpError) {
      setOtpError('');
    }
  };

  const handleLogin = async () => {
    if (!phone.trim() || !otp.trim()) {
      setAlertTitle('Error');
      setAlertMessage('Please enter both phone and OTP');
      setAlertType('error');
      setAlertVisible(true);
      return;
    }
    setIsLoading(true);
    try {
      await ApiService.request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
        headers: { 'Content-Type': 'application/json' },
      });
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      setAlertTitle('Login Failed');
      setAlertMessage(error.message || 'Invalid credentials');
      setAlertType('error');
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
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
            {/* Use SVG if supported, else PNG fallback */}
            {/* <SvgUri width="120" height="120" source={require('../../assets/logo/LipiPrintLogoSVG.svg')} /> */}
            <Image
              source={require('../../assets/logo/LipiPrintLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animatable.View>
          <Animatable.View animation="fadeInUp" delay={200} duration={350} style={styles.textSection}>
            <Text style={[styles.headline]}>
              {showOtp ? 'Enter the OTP' : 'Enter your mobile number'}
            </Text>
            <Animatable.Text animation="fadeInUp" delay={300} duration={350} style={[styles.subheading, { color: theme.text }]}>
              {showOtp ? 'We have sent a One Time Password (OTP) to your mobile number.' : 'Sign in to print smarter and faster.'}
            </Animatable.Text>
          </Animatable.View>
          <Animatable.View animation="fadeInUp" delay={300} duration={350} style={{ width: '100%' }}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={[styles.inputRow, inputFocused && styles.inputRowFocused, phoneError && styles.inputRowError]}>
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
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                editable={!showOtp}
              />
            </View>
            {phoneError && (
              <Text style={styles.errorText}>{phoneError}</Text>
            )}
          </Animatable.View>
          {!showOtp && (
            <Animatable.View animation="fadeInUp" delay={400} duration={350} style={{ width: '100%' }}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
                onPress={handleSendOTP}
                disabled={isLoading}
              >
                <Text style={styles.ctaText}>
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Text>
              </TouchableOpacity>
            </Animatable.View>
          )}
          {showOtp && (
            <>
              <Animatable.View animation="fadeInUp" delay={500} duration={350} style={{ width: '100%' }}>
                <Text style={styles.inputLabel}>OTP</Text>
                <TextInput
                  style={[styles.otpInput, otpFocused && styles.otpInputFocused, otpError && styles.otpInputError]}
                  placeholder="Enter OTP"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={handleOtpChange}
                  maxLength={6}
                  onFocus={() => setOtpFocused(true)}
                  onBlur={() => setOtpFocused(false)}
                />
                {otpError && (
                  <Text style={styles.errorText}>{otpError}</Text>
                )}
              </Animatable.View>
              <Animatable.View animation="fadeInUp" delay={600} duration={350} style={{ width: '100%' }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={isLoading}
                >
                  <Text style={styles.ctaText}>
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
              <Animatable.View animation="fadeInUp" delay={700} duration={350} style={styles.resendContainer}>
                <TouchableOpacity
                  onPress={() => {
                    setShowOtp(false);
                    setOtp('');
                    setOtpError('');
                  }}
                  style={styles.signupLink}
                >
                  <Text style={styles.resendText}>Change Phone Number</Text>
                </TouchableOpacity>
              </Animatable.View>
            </>
          )}
          <TouchableOpacity style={styles.signupLink} onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.signupText]}>
              Don't have an account? <Text style={{color: '#00C6FB', fontWeight: 'bold'}}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
          {/* Illustration placeholder (uncomment and add your image if needed) */}
          {/* <Animatable.Image animation="bounceIn" delay={700} duration={500} source={require('../assets/printer_illustration.png')} style={styles.illustration} resizeMode="contain" /> */}
        </View>
        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          onConfirm={() => setAlertVisible(false)}
        />
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
    transition: 'border-color 0.2s',
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
  otpInput: {
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
    transition: 'border-color 0.2s',
  },
  otpInputFocused: {
    borderColor: '#00C6FB',
    shadowColor: '#00C6FB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  otpInputError: {
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
  illustration: {
    width: '100%',
    height: 220,
    alignSelf: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
}); 
