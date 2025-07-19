// Production configuration for LipiPrint app
// This file contains all production-specific settings and security configurations

export const PRODUCTION_CONFIG = {
  // API Configuration
  API: {
    BASE_URL: 'http://10.125.114.121:8082', // Updated to Render deployment URL
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  },

  // Security Configuration
  SECURITY: {
    // JWT Configuration
    JWT: {
      STORAGE_KEY: 'lipiprint_jwt_token',
      REFRESH_TOKEN_KEY: 'lipiprint_refresh_token',
      TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes before expiry
    },

    // Rate Limiting
    RATE_LIMITING: {
      LOGIN_ATTEMPTS: 5,
      LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      OTP_ATTEMPTS: 3,
      OTP_WINDOW_MS: 10 * 60 * 1000, // 10 minutes
      API_RATE_LIMIT: 100, // requests per minute
    },

    // Input Validation
    VALIDATION: {
      MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
      ALLOWED_FILE_TYPES: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
      MAX_FILENAME_LENGTH: 255,
      MAX_DESCRIPTION_LENGTH: 1000,
    },

    // Encryption
    ENCRYPTION: {
      ALGORITHM: 'AES-256-GCM',
      KEY_SIZE: 32,
      IV_SIZE: 16,
    },
  },

  // Payment Configuration
  PAYMENT: {
    RAZORPAY: {
      KEY_ID: 'rzp_test_0SpkSjDk6lMGOy', // Replace with your live Razorpay key
      CURRENCY: 'INR',
      PREFILL: {
        NAME: '',
        EMAIL: '',
        CONTACT: '',
      },
    },
    CURRENCY: '₹',
    TAX_RATE: 0.18, // 18% GST
  },

  // File Upload Configuration
  UPLOAD: {
    MAX_CONCURRENT_UPLOADS: 3,
    CHUNK_SIZE: 1024 * 1024, // 1MB chunks
    UPLOAD_TIMEOUT: 300000, // 5 minutes
    COMPRESSION_QUALITY: 0.8,
  },

  // Notification Configuration
  NOTIFICATIONS: {
    PUSH_ENABLED: true,
    PUSH_SERVER_URL: 'https://push.lipiprint.com',
    EMAIL_ENABLED: true,
    SMS_ENABLED: true,
    IN_APP_ENABLED: true,
  },

  // Analytics Configuration
  ANALYTICS: {
    ENABLED: true,
    TRACKING_ID: 'G-XXXXXXXXXX', // Replace with your Google Analytics ID
    CRASH_REPORTING: true,
    PERFORMANCE_MONITORING: true,
  },

  // Caching Configuration
  CACHE: {
    ENABLED: true,
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    TTL: 24 * 60 * 60 * 1000, // 24 hours
    PERSISTENT: true,
  },

  // Error Reporting
  ERROR_REPORTING: {
    ENABLED: true,
    SENTRY_DSN: 'https://your-sentry-dsn@sentry.io/project-id', // Replace with your Sentry DSN
    LOG_LEVEL: 'error',
    CAPTURE_UNHANDLED: true,
  },

  // Feature Flags
  FEATURES: {
    OCR_ENABLED: false,
    BATCH_MODE_ENABLED: false,
    REAL_TIME_TRACKING: true,
    PUSH_NOTIFICATIONS: true,
    OFFLINE_MODE: true,
    DARK_MODE: true,
    MULTI_LANGUAGE: false,
  },

  // Performance Configuration
  PERFORMANCE: {
    IMAGE_OPTIMIZATION: true,
    LAZY_LOADING: true,
    PRELOAD_CRITICAL_RESOURCES: true,
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
  },

  // Localization
  LOCALIZATION: {
    DEFAULT_LANGUAGE: 'en',
    SUPPORTED_LANGUAGES: ['en', 'hi'],
    DATE_FORMAT: 'DD/MM/YYYY',
    TIME_FORMAT: 'HH:mm',
    CURRENCY_FORMAT: 'INR',
  },

  // Print Configuration
  PRINT: {
    DEFAULT_PAPER_SIZE: 'A4',
    DEFAULT_COLOR_MODE: 'color',
    DEFAULT_COPIES: 1,
    MAX_COPIES: 100,
    SUPPORTED_PAPER_SIZES: ['A4', 'A3', 'A5', 'Letter', 'Legal'],
    SUPPORTED_COLOR_MODES: ['color', 'black_white', 'grayscale'],
  },

  // Delivery Configuration
  DELIVERY: {
    DEFAULT_DELIVERY_TIME: 24, // hours
    EXPRESS_DELIVERY_TIME: 2, // hours
    MAX_DELIVERY_DISTANCE: 50, // km
    DELIVERY_CHARGES: {
      STANDARD: 50,
      EXPRESS: 150,
      FREE_THRESHOLD: 500, // Free delivery above this amount
    },
  },

  // Support Configuration
  SUPPORT: {
    PHONE: '+91-XXXXXXXXXX',
    EMAIL: 'support@lipiprint.com',
    WHATSAPP: '+91-XXXXXXXXXX',
    WORKING_HOURS: '9:00 AM - 6:00 PM (IST)',
    RESPONSE_TIME: '2 hours',
  },

  // Legal Configuration
  LEGAL: {
    PRIVACY_POLICY_URL: 'https://lipiprint.com/privacy',
    TERMS_OF_SERVICE_URL: 'https://lipiprint.com/terms',
    REFUND_POLICY_URL: 'https://lipiprint.com/refund',
    GRIEVANCE_OFFICER: {
      NAME: 'Grievance Officer',
      EMAIL: 'grievance@lipiprint.com',
      ADDRESS: 'Your Company Address',
    },
  },
};

// Environment-specific overrides
export const getConfig = () => {
  const config = { ...PRODUCTION_CONFIG };

  // Override with environment variables if available
  if (__DEV__) {
    // Development overrides
    config.API.BASE_URL = 'http://10.125.114.121:8082'; // Updated for development
    config.SECURITY.RATE_LIMITING.LOGIN_ATTEMPTS = 10;
    config.ANALYTICS.ENABLED = false;
    config.ERROR_REPORTING.ENABLED = false;
  }

  return config;
};

// Export default config
export default getConfig(); 