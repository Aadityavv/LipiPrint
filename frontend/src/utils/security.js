// Security utility for input validation and sanitization
// Prevents SQL injection, XSS, and other security vulnerabilities

export class SecurityValidator {
  // SQL Injection prevention patterns
  static SQL_INJECTION_PATTERNS = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)\b)/i,
    /(\b(and|or)\b\s+\d+\s*=\s*\d+)/i,
    /(\b(and|or)\b\s+['"]\w+['"]\s*=\s*['"]\w+['"])/i,
    /(--|\/\*|\*\/|;)/,
    /(\b(xp_|sp_|sys\.|information_schema\.|mysql\.|pg_)\w*\b)/i,
    /(\b(load_file|into\s+outfile|into\s+dumpfile)\b)/i,
    /(\b(union\s+all|union\s+distinct)\b)/i,
    /\b(select\s+\*|select\s+.*\s+from\s+.*\s+where\s+.*\s*=\s*.*)\b/i,
  ];

  // XSS prevention patterns
  static XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    /onfocus\s*=/gi,
    /onblur\s*=/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
  ];

  // Phone number validation
  static validatePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, error: 'Phone number is required' };
    }

    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    // Check for SQL injection
    if (this.containsSQLInjection(cleanPhone)) {
      return { isValid: false, error: 'Invalid phone number format' };
    }

    // Check for XSS
    if (this.containsXSS(cleanPhone)) {
      return { isValid: false, error: 'Invalid phone number format' };
    }

    // Validate Indian phone number (10 digits starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return { isValid: false, error: 'Please enter a valid 10-digit phone number' };
    }

    return { isValid: true, value: cleanPhone };
  }

  // OTP validation
  static validateOTP(otp) {
    if (!otp || typeof otp !== 'string') {
      return { isValid: false, error: 'OTP is required' };
    }

    // Check for SQL injection
    if (this.containsSQLInjection(otp)) {
      return { isValid: false, error: 'Invalid OTP format' };
    }

    // Check for XSS
    if (this.containsXSS(otp)) {
      return { isValid: false, error: 'Invalid OTP format' };
    }

    // Remove all non-digit characters
    const cleanOTP = otp.replace(/\D/g, '');

    // Validate 4 or 6-digit OTP
    const otpRegex = /^\d{4,6}$/;
    if (!otpRegex.test(cleanOTP)) {
      return { isValid: false, error: 'Please enter a valid 4 or 6-digit OTP' };
    }

    return { isValid: true, value: cleanOTP };
  }

  // Email validation
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required' };
    }

    // Check for SQL injection
    if (this.containsSQLInjection(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // Check for XSS
    if (this.containsXSS(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true, value: email.trim().toLowerCase() };
  }

  // Name validation
  static validateName(name, fieldName = 'Name') {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: `${fieldName} is required` };
    }

    const cleanName = name.trim();

    // Check for SQL injection
    if (this.containsSQLInjection(cleanName)) {
      return { isValid: false, error: `Invalid ${fieldName.toLowerCase()} format` };
    }

    // Check for XSS
    if (this.containsXSS(cleanName)) {
      return { isValid: false, error: `Invalid ${fieldName.toLowerCase()} format` };
    }

    // Name should be 2-50 characters, letters, spaces, dots, and hyphens only
    const nameRegex = /^[a-zA-Z\s\.\-]{2,50}$/;
    if (!nameRegex.test(cleanName)) {
      return { isValid: false, error: `${fieldName} should be 2-50 characters and contain only letters, spaces, dots, and hyphens` };
    }

    return { isValid: true, value: cleanName };
  }

  // Address validation
  static validateAddress(address) {
    if (!address || typeof address !== 'string') {
      return { isValid: false, error: 'Address is required' };
    }

    const cleanAddress = address.trim();

    // Check for SQL injection
    if (this.containsSQLInjection(cleanAddress)) {
      return { isValid: false, error: 'Invalid address format' };
    }

    // Check for XSS
    if (this.containsXSS(cleanAddress)) {
      return { isValid: false, error: 'Invalid address format' };
    }

    // Address should be 10-200 characters
    if (cleanAddress.length < 10 || cleanAddress.length > 200) {
      return { isValid: false, error: 'Address should be between 10 and 200 characters' };
    }

    return { isValid: true, value: cleanAddress };
  }

  // Pincode validation
  static validatePincode(pincode) {
    if (!pincode || typeof pincode !== 'string') {
      return { isValid: false, error: 'Pincode is required' };
    }

    const cleanPincode = pincode.replace(/\D/g, '');

    // Check for SQL injection
    if (this.containsSQLInjection(cleanPincode)) {
      return { isValid: false, error: 'Invalid pincode format' };
    }

    // Check for XSS
    if (this.containsXSS(cleanPincode)) {
      return { isValid: false, error: 'Invalid pincode format' };
    }

    // Indian pincode validation (6 digits)
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(cleanPincode)) {
      return { isValid: false, error: 'Please enter a valid 6-digit pincode' };
    }

    return { isValid: true, value: cleanPincode };
  }

  // GSTIN validation
  static validateGSTIN(gstin) {
    if (!gstin || typeof gstin !== 'string') {
      return { isValid: false, error: 'GSTIN is required' };
    }

    const cleanGSTIN = gstin.trim().toUpperCase();

    // Check for SQL injection
    if (this.containsSQLInjection(cleanGSTIN)) {
      return { isValid: false, error: 'Invalid GSTIN format' };
    }

    // Check for XSS
    if (this.containsXSS(cleanGSTIN)) {
      return { isValid: false, error: 'Invalid GSTIN format' };
    }

    // GSTIN validation (15 characters: 2 state + 10 PAN + 3 entity)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(cleanGSTIN)) {
      return { isValid: false, error: 'Please enter a valid 15-character GSTIN' };
    }

    return { isValid: true, value: cleanGSTIN };
  }

  // Generic text validation
  static validateText(text, fieldName = 'Text', minLength = 1, maxLength = 255) {
    if (!text || typeof text !== 'string') {
      return { isValid: false, error: `${fieldName} is required` };
    }

    const cleanText = text.trim();

    // Check for SQL injection
    if (this.containsSQLInjection(cleanText)) {
      return { isValid: false, error: `Invalid ${fieldName.toLowerCase()} format` };
    }

    // Check for XSS
    if (this.containsXSS(cleanText)) {
      return { isValid: false, error: `Invalid ${fieldName.toLowerCase()} format` };
    }

    if (cleanText.length < minLength || cleanText.length > maxLength) {
      return { isValid: false, error: `${fieldName} must be between ${minLength} and ${maxLength} characters` };
    }

    return { isValid: true, value: cleanText };
  }

  // Check for SQL injection patterns
  static containsSQLInjection(text) {
    if (!text || typeof text !== 'string') return false;
    
    return this.SQL_INJECTION_PATTERNS.some(pattern => pattern.test(text));
  }

  // Check for XSS patterns
  static containsXSS(text) {
    if (!text || typeof text !== 'string') return false;
    
    return this.XSS_PATTERNS.some(pattern => pattern.test(text));
  }

  // Sanitize text input (remove dangerous characters)
  static sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/vbscript:/gi, '') // Remove vbscript:
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  // Rate limiting helper
  static createRateLimiter(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const attempts = new Map();
    
    return {
      checkLimit: (identifier) => {
        const now = Date.now();
        const userAttempts = attempts.get(identifier) || [];
        
        // Remove old attempts outside the window
        const validAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
        
        if (validAttempts.length >= maxAttempts) {
          return { allowed: false, remainingTime: windowMs - (now - validAttempts[0]) };
        }
        
        validAttempts.push(now);
        attempts.set(identifier, validAttempts);
        
        return { allowed: true, remainingAttempts: maxAttempts - validAttempts.length };
      },
      
      reset: (identifier) => {
        attempts.delete(identifier);
      }
    };
  }
}

// Export individual validation functions for convenience
export const validatePhone = SecurityValidator.validatePhoneNumber;
export const validateOTP = SecurityValidator.validateOTP;
export const validateEmail = SecurityValidator.validateEmail;
export const validateName = SecurityValidator.validateName;
export const validateAddress = SecurityValidator.validateAddress;
export const validatePincode = SecurityValidator.validatePincode;
export const validateGSTIN = SecurityValidator.validateGSTIN;
export const validateText = SecurityValidator.validateText;
export const sanitizeText = SecurityValidator.sanitizeText; 