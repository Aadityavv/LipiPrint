import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecurityValidator } from '../utils/security';
import config from '../config/production';

class SecureApiService {
  constructor() {
    this.baseURL = config.API.BASE_URL;
    this.timeout = config.API.TIMEOUT;
    this.retryAttempts = config.API.RETRY_ATTEMPTS;
    this.retryDelay = config.API.RETRY_DELAY;
    
    // Initialize rate limiters
    this.loginRateLimiter = SecurityValidator.createRateLimiter(
      config.SECURITY.RATE_LIMITING.LOGIN_ATTEMPTS,
      config.SECURITY.RATE_LIMITING.LOGIN_WINDOW_MS
    );
    
    this.otpRateLimiter = SecurityValidator.createRateLimiter(
      config.SECURITY.RATE_LIMITING.OTP_ATTEMPTS,
      config.SECURITY.RATE_LIMITING.OTP_WINDOW_MS
    );
    
    this.apiRateLimiter = SecurityValidator.createRateLimiter(
      config.SECURITY.RATE_LIMITING.API_RATE_LIMIT,
      60 * 1000 // 1 minute
    );
  }

  // Get stored JWT token
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem(config.SECURITY.JWT.STORAGE_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Store JWT token
  async setAuthToken(token) {
    try {
      await AsyncStorage.setItem(config.SECURITY.JWT.STORAGE_KEY, token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  // Remove JWT token
  async removeAuthToken() {
    try {
      await AsyncStorage.removeItem(config.SECURITY.JWT.STORAGE_KEY);
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  // Validate and sanitize request data
  validateRequestData(data, validationRules = {}) {
    const validatedData = {};
    const errors = {};

    for (const [key, value] of Object.entries(data)) {
      const rule = validationRules[key];
      
      if (rule) {
        let validation;
        
        switch (rule.type) {
          case 'phone':
            validation = SecurityValidator.validatePhoneNumber(value);
            break;
          case 'email':
            validation = SecurityValidator.validateEmail(value);
            break;
          case 'name':
            validation = SecurityValidator.validateName(value, rule.fieldName);
            break;
          case 'address':
            validation = SecurityValidator.validateAddress(value);
            break;
          case 'pincode':
            validation = SecurityValidator.validatePincode(value);
            break;
          case 'gstin':
            validation = SecurityValidator.validateGSTIN(value);
            break;
          case 'text':
            validation = SecurityValidator.validateText(
              value, 
              rule.fieldName || key,
              rule.minLength || 1,
              rule.maxLength || 255
            );
            break;
          default:
            // For unknown types, just sanitize
            validatedData[key] = SecurityValidator.sanitizeText(value);
            continue;
        }

        if (validation.isValid) {
          validatedData[key] = validation.value;
        } else {
          errors[key] = validation.error;
        }
      } else {
        // No specific validation rule, just sanitize
        validatedData[key] = SecurityValidator.sanitizeText(value);
      }
    }

    return { validatedData, errors };
  }

  // Make secure API request
  async makeRequest(endpoint, options = {}) {
    const {
      method = 'GET',
      data = null,
      validationRules = {},
      requiresAuth = true,
      retryOnFailure = true,
      rateLimitKey = null
    } = options;

    // Check rate limiting
    if (rateLimitKey) {
      const rateLimitCheck = this.apiRateLimiter.checkLimit(rateLimitKey);
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(rateLimitCheck.remainingTime / 1000)} seconds.`);
      }
    }

    // Validate and sanitize request data
    let validatedData = data;
    if (data && Object.keys(validationRules).length > 0) {
      const validation = this.validateRequestData(data, validationRules);
      if (Object.keys(validation.errors).length > 0) {
        throw new Error(`Validation errors: ${Object.values(validation.errors).join(', ')}`);
      }
      validatedData = validation.validatedData;
    }

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'LipiPrint-Mobile-App/1.0',
    };

    // Add authorization header if required
    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Prepare request configuration
    const requestConfig = {
      method,
      headers,
      timeout: this.timeout,
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method) && validatedData) {
      requestConfig.body = JSON.stringify(validatedData);
    }

    // Add query parameters for GET requests
    let url = `${this.baseURL}${endpoint}`;
    if (method === 'GET' && validatedData) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(validatedData)) {
        params.append(key, value);
      }
      url += `?${params.toString()}`;
    }

    // Log request details
    console.log('[SECURE API CALL]', { url, method, data: validatedData, headers });

    // Make request with retry logic
    let lastError;
    for (let attempt = 1; attempt <= (retryOnFailure ? this.retryAttempts : 1); attempt++) {
      try {
        const response = await fetch(url, requestConfig);
        // Log response status
        console.log('[SECURE API RESPONSE STATUS]', { url, status: response.status });
        
        // Handle different response status codes
        if (response.status === 401) {
          // Unauthorized - clear token and throw error
          await this.removeAuthToken();
          throw new Error('Authentication failed. Please login again.');
        }
        
        if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to perform this action.');
        }
        
        if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        }
        
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        // Parse response
        const responseData = await response.json();
        // Log response body
        console.log('[SECURE API RESPONSE BODY]', { url, response: responseData });
        
        // Validate response data for security
        if (responseData && typeof responseData === 'object') {
          // Check for potential XSS in response
          const sanitizedResponse = this.sanitizeResponseData(responseData);
          return sanitizedResponse;
        }
        
        return responseData;
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.message.includes('Authentication failed') || 
            error.message.includes('Access denied') ||
            error.message.includes('Validation errors')) {
          break;
        }
        
        // Wait before retry
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw lastError;
  }

  // Sanitize response data to prevent XSS
  sanitizeResponseData(data) {
    if (typeof data === 'string') {
      return SecurityValidator.sanitizeText(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeResponseData(item));
    }
    
    if (data && typeof data === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeResponseData(value);
      }
      return sanitized;
    }
    
    return data;
  }

  // Authentication methods
  async login(phoneNumber) {
    // Check login rate limiting
    const rateLimitCheck = this.loginRateLimiter.checkLimit(phoneNumber);
    if (!rateLimitCheck.allowed) {
      throw new Error(`Too many login attempts. Please try again in ${Math.ceil(rateLimitCheck.remainingTime / 1000)} seconds.`);
    }

    const validationRules = {
      phoneNumber: { type: 'phone' }
    };

    return this.makeRequest('/auth/send-otp', {
      method: 'POST',
      data: { phoneNumber },
      validationRules,
      requiresAuth: false,
      rateLimitKey: `login_${phoneNumber}`
    });
  }

  async verifyOTP(phoneNumber, otp) {
    // Check OTP rate limiting
    const rateLimitCheck = this.otpRateLimiter.checkLimit(phoneNumber);
    if (!rateLimitCheck.allowed) {
      throw new Error(`Too many OTP attempts. Please try again in ${Math.ceil(rateLimitCheck.remainingTime / 1000)} seconds.`);
    }

    const validationRules = {
      phoneNumber: { type: 'phone' },
      otp: { type: 'otp' }
    };

    const response = await this.makeRequest('/auth/verify-otp', {
      method: 'POST',
      data: { phoneNumber, otp },
      validationRules,
      requiresAuth: false,
      rateLimitKey: `otp_${phoneNumber}`
    });

    // Store token if login successful
    if (response.token) {
      await this.setAuthToken(response.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
        requiresAuth: true
      });
    } finally {
      // Always clear local token
      await this.removeAuthToken();
    }
  }

  // User profile methods
  async updateProfile(profileData) {
    const validationRules = {
      firstName: { type: 'name', fieldName: 'First Name' },
      lastName: { type: 'name', fieldName: 'Last Name' },
      email: { type: 'email' },
      address: { type: 'address' },
      pincode: { type: 'pincode' },
      gstin: { type: 'gstin' },
      companyName: { type: 'text', fieldName: 'Company Name', maxLength: 100 }
    };

    return this.makeRequest('/user/profile', {
      method: 'PUT',
      data: profileData,
      validationRules,
      requiresAuth: true
    });
  }

  async getProfile() {
    return this.makeRequest('/user/profile', {
      method: 'GET',
      requiresAuth: true
    });
  }

  // File upload methods
  async uploadFile(fileData, onProgress) {
    const validationRules = {
      fileName: { type: 'text', fieldName: 'File Name', maxLength: 255 },
      description: { type: 'text', fieldName: 'Description', maxLength: 1000 }
    };

    return this.makeRequest('/files/upload', {
      method: 'POST',
      data: fileData,
      validationRules,
      requiresAuth: true,
      onProgress
    });
  }

  // Order methods
  async createOrder(orderData) {
    const validationRules = {
      deliveryAddress: { type: 'address' },
      deliveryPincode: { type: 'pincode' },
      specialInstructions: { type: 'text', fieldName: 'Special Instructions', maxLength: 500 }
    };

    return this.makeRequest('/orders', {
      method: 'POST',
      data: orderData,
      validationRules,
      requiresAuth: true
    });
  }

  async getOrders() {
    return this.makeRequest('/orders', {
      method: 'GET',
      requiresAuth: true
    });
  }

  // Reset rate limiters (for testing or admin purposes)
  resetRateLimiters(identifier) {
    this.loginRateLimiter.reset(identifier);
    this.otpRateLimiter.reset(identifier);
    this.apiRateLimiter.reset(identifier);
  }
}

// Create singleton instance
const secureApiService = new SecureApiService();

export default secureApiService; 