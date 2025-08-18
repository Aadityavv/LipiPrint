import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { getApp } from '@react-native-firebase/app';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import ApiService from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import CustomAlert from '../../components/CustomAlert';

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

  // Firebase confirmation result object
  const [confirmation, setConfirmation] = useState(null);

  const showAlert = (title, message, type = 'error') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleSendOTP = async () => {
    setPhoneError('');
    const clean = phone.trim();
    
    if (!clean || clean.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    console.log(`🔥 Attempting Firebase OTP for: +91${clean}`);
    
    try {
      const app = getApp();
      const firebaseAuth = getAuth(app);
      
      console.log('🔥 Firebase app and auth initialized');
      console.log('🔥 Calling signInWithPhoneNumber...');
      
      const conf = await signInWithPhoneNumber(firebaseAuth, `+91${clean}`);
      
      console.log('✅ Firebase signInWithPhoneNumber successful');
      console.log('✅ Confirmation object received:', !!conf);
      
      setConfirmation(conf);
      setShowOtp(true);
      showAlert('OTP Sent', 'Please check your phone for the verification code', 'success');
      
    } catch (error) {
      console.error('❌ Firebase OTP Error:', error);
      console.error('❌ Error code:', error?.code);
      console.error('❌ Error message:', error?.message);
      
      let errorMessage = 'Failed to send OTP. ';
      
      if (error?.code === 'auth/missing-client-identifier') {
        errorMessage += 'Please check your Firebase configuration and SHA certificates.';
      } else if (error?.code === 'auth/invalid-phone-number') {
        errorMessage += 'Invalid phone number format.';
      } else if (error?.code === 'auth/quota-exceeded') {
        errorMessage += 'SMS quota exceeded. Try again later.';
      } else if (error?.code === 'auth/app-not-authorized') {
        errorMessage += 'App not authorized for Firebase Auth.';
      } else {
        errorMessage += error?.message || 'Unknown error occurred.';
      }
      
      showAlert('OTP Failed', errorMessage);
      
      // Fallback: offer manual backend OTP for testing
      console.log('🔄 Consider using backend fallback OTP for testing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setOtpError('');
    const code = otp.trim();
    
    if (!code) {
      setOtpError('Please enter the OTP');
      return;
    }
    
    if (!confirmation) {
      showAlert('Error', 'No verification session found. Please request OTP again.');
      setShowOtp(false);
      return;
    }

    setIsLoading(true);
    console.log(`🔍 Verifying OTP: ${code}`);
    
    try {
      // Confirm OTP with Firebase
      console.log('🔥 Calling confirmation.confirm...');
      const userCredential = await confirmation.confirm(code);
      console.log('✅ Firebase OTP confirmed successfully');
      
      // Get Firebase ID token
      console.log('🔑 Getting Firebase ID token...');
      const idToken = await userCredential.user.getIdToken();
      console.log('✅ Firebase ID token obtained');

      // Call backend to verify token and get app JWT
      console.log('🌐 Calling backend /auth/firebase-auth...');
      const response = await ApiService.request('/auth/firebase-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idToken, 
          phoneNumber: `+91${phone}` 
        }),
      });
      
      console.log('✅ Backend response received:', response);

      // Extract and store app token
      const token = response?.accessToken || response?.token || response?.jwt;
      if (token) {
        await ApiService.setToken(token);
        console.log('✅ App token stored successfully');
      }

      // Determine user role and navigate
      let userRole = null;
      if (response?.user?.role) {
        userRole = response.user.role;
      } else if (response?.userDTO?.role) {
        userRole = response.userDTO.role;
      }
      
      console.log('👤 User role determined:', userRole);

      // Reset states
      setShowOtp(false);
      setConfirmation(null);
      setOtp('');
      setPhone('');

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
      console.error('❌ OTP Verification Error:', error);
      console.error('❌ Error code:', error?.code);
      
      if (error?.code === 'auth/invalid-verification-code') {
        setOtpError('Invalid OTP. Please check and try again.');
      } else if (error?.code === 'auth/code-expired') {
        setOtpError('OTP has expired. Please request a new one.');
        setShowOtp(false);
        setConfirmation(null);
      } else {
        setOtpError('Invalid OTP or network error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (value) => {
    // Only allow digits, cap length to 10
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(sanitized);
    if (phoneError) setPhoneError('');
  };

  const handleOtpChange = (value) => {
    // Only digits, cap to 6
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(sanitized);
    if (otpError) setOtpError('');
  };

  const handleResendOTP = async () => {
    setOtp('');
    setOtpError('');
    setConfirmation(null);
    setShowOtp(false);
    // Automatically trigger send OTP again
    setTimeout(() => handleSendOTP(), 100);
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
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
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
                  autoFocus={true}
                />
                {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
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
                <TouchableOpacity onPress={handleResendOTP} style={styles.signupLink}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowOtp(false);
                    setOtp('');
                    setOtpError('');
                    setConfirmation(null);
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
    textAlign: 'center',
    letterSpacing: 2,
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
