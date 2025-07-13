import React, { useState, forwardRef } from 'react';
import { TextInput, Text, View, StyleSheet } from 'react-native';
import { sanitizeText, SecurityValidator } from '../utils/security';

const SecureInput = forwardRef(({
  value,
  onChangeText,
  placeholder,
  style,
  error,
  validationType = 'text',
  validationOptions = {},
  onValidationError,
  maxLength = 255,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localError, setLocalError] = useState('');

  const validateInput = (text) => {
    let validation;
    
    switch (validationType) {
      case 'phone':
        validation = SecurityValidator.validatePhoneNumber(text);
        break;
      case 'otp':
        validation = SecurityValidator.validateOTP(text);
        break;
      case 'email':
        validation = SecurityValidator.validateEmail(text);
        break;
      case 'name':
        validation = SecurityValidator.validateName(text, validationOptions.fieldName || 'Name');
        break;
      case 'address':
        validation = SecurityValidator.validateAddress(text);
        break;
      case 'pincode':
        validation = SecurityValidator.validatePincode(text);
        break;
      case 'gstin':
        validation = SecurityValidator.validateGSTIN(text);
        break;
      case 'password':
        validation = SecurityValidator.validatePassword(text);
        break;
      case 'text':
      default:
        validation = SecurityValidator.validateText(
          text, 
          validationOptions.fieldName || 'Text',
          validationOptions.minLength || 1,
          validationOptions.maxLength || maxLength
        );
        break;
    }

    if (!validation.isValid) {
      setLocalError(validation.error);
      if (onValidationError) {
        onValidationError(validation.error);
      }
      return false;
    }

    setLocalError('');
    return true;
  };

  const handleChangeText = (text) => {
    // Sanitize the input first
    const sanitizedText = sanitizeText(text);
    
    // Validate if validation is enabled
    if (validationType !== 'none') {
      validateInput(sanitizedText);
    }
    
    // Call the parent's onChangeText with sanitized value
    if (onChangeText) {
      onChangeText(sanitizedText);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Validate on blur if validation is enabled and there's a value
    if (validationType !== 'none' && value) {
      validateInput(value);
    }
  };

  const displayError = error || localError;

  return (
    <View style={styles.container}>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          style,
          isFocused && styles.inputFocused,
          displayError && styles.inputError
        ]}
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        {...props}
      />
      {displayError && (
        <Text style={styles.errorText}>{displayError}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    width: '100%',
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
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
    marginBottom: 8,
  },
});

SecureInput.displayName = 'SecureInput';

export default SecureInput; 