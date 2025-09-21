import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';
import CustomAlert from '../../components/CustomAlert';

export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: Enter new password
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState({});
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');

  const showAlert = (title, message, type = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
  };

  const handleOtpChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 6) {
      setOtp(cleaned);
    }
  };

  const handleFocus = (field) => {
    setInputFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setInputFocused(prev => ({ ...prev, [field]: false }));
  };

  const sendOtp = async () => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      showAlert('Invalid Email', 'Please enter a valid email address', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://lipiprint-freelance.onrender.com/api/auth/send-email-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep(2);
        showAlert('OTP Sent', 'OTP has been sent to your email address. Please check your inbox.', 'success');
      } else {
        showAlert('Error', data.message || 'Failed to send OTP. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      showAlert('Error', 'Failed to send OTP. Please check your internet connection and try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      showAlert('Invalid OTP', 'Please enter the 6-digit OTP', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://lipiprint-freelance.onrender.com/api/auth/reset-password-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep(3);
        showAlert('OTP Verified', 'OTP verified successfully. You can now set a new password.', 'success');
      } else {
        showAlert('Error', data.message || 'Failed to verify OTP. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      showAlert('Error', 'Failed to verify OTP. Please check your internet connection and try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showAlert('Invalid Password', 'Password must be at least 6 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://lipiprint-freelance.onrender.com/api/auth/update-password-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          newPassword 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showAlert('Success', 'Password reset successfully! You can now login with your new password.', 'success');
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      } else {
        showAlert('Error', data.message || 'Failed to reset password. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      showAlert('Error', 'Failed to reset password. Please check your internet connection and try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Animatable.View animation="fadeInUp" delay={200} duration={350} style={{ width: '100%' }}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <View style={[styles.inputRow, inputFocused.email && styles.inputRowFocused]}>
          <View style={styles.emailIconBox}>
            <Icon name="email" size={20} color="#666" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter your email address"
            keyboardType="email-address"
            value={email}
            onChangeText={handleEmailChange}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
          />
        </View>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={300} duration={350} style={{ width: '100%' }}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
          onPress={sendOtp}
          disabled={isLoading}
        >
          <Text style={styles.ctaText}>
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </Text>
        </TouchableOpacity>
      </Animatable.View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Animatable.View animation="fadeInUp" delay={200} duration={350} style={{ width: '100%' }}>
        <Text style={styles.inputLabel}>Enter OTP</Text>
        <View style={[styles.inputRow, inputFocused.otp && styles.inputRowFocused]}>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={handleOtpChange}
            maxLength={6}
            onFocus={() => handleFocus('otp')}
            onBlur={() => handleBlur('otp')}
          />
        </View>
        <Text style={styles.otpNote}>OTP sent to {email}</Text>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={300} duration={350} style={{ width: '100%' }}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
          onPress={verifyOtp}
          disabled={isLoading}
        >
          <Text style={styles.ctaText}>
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Text>
        </TouchableOpacity>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={400} duration={350} style={{ width: '100%' }}>
        <TouchableOpacity style={styles.resendButton} onPress={sendOtp}>
          <Text style={styles.resendText}>Resend OTP</Text>
        </TouchableOpacity>
      </Animatable.View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Animatable.View animation="fadeInUp" delay={200} duration={350} style={{ width: '100%' }}>
        <Text style={styles.inputLabel}>New Password</Text>
        <View style={[styles.inputRow, inputFocused.newPassword && styles.inputRowFocused]}>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            onFocus={() => handleFocus('newPassword')}
            onBlur={() => handleBlur('newPassword')}
          />
        </View>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={300} duration={350} style={{ width: '100%' }}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View style={[styles.inputRow, inputFocused.confirmPassword && styles.inputRowFocused]}>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            onFocus={() => handleFocus('confirmPassword')}
            onBlur={() => handleBlur('confirmPassword')}
          />
        </View>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={400} duration={350} style={{ width: '100%' }}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
          onPress={resetPassword}
          disabled={isLoading}
        >
          <Text style={styles.ctaText}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Text>
        </TouchableOpacity>
      </Animatable.View>
    </>
  );

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Forgot Password';
      case 2: return 'Verify OTP';
      case 3: return 'Reset Password';
      default: return 'Forgot Password';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return 'Enter your email address to receive OTP';
      case 2: return 'Enter the OTP sent to your email';
      case 3: return 'Create a new password for your account';
      default: return 'Enter your email address to receive OTP';
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
          <Animatable.View animation="fadeInDown" delay={100} duration={500} style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getStepTitle()}</Text>
            <View style={styles.headerRight} />
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={200} duration={350} style={styles.textSection}>
            <Text style={[styles.subheading, { color: theme.text }]}>
              {getStepSubtitle()}
            </Text>
          </Animatable.View>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

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
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A232E',
    marginLeft: -30,
  },
  headerRight: {
    width: 30,
  },
  textSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  subheading: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  emailIconBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    height: '100%',
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
  otpNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: -16,
    marginBottom: 16,
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    color: '#00C6FB',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});