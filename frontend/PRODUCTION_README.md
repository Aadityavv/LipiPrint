# LipiPrint - Production Deployment Guide

## 🚀 Production Readiness Checklist

### Security Measures Implemented ✅

1. **SQL Injection Prevention**
   - Comprehensive input validation using `SecurityValidator`
   - Pattern-based detection of SQL injection attempts
   - Automatic sanitization of all user inputs
   - Secure API service with built-in validation

2. **XSS (Cross-Site Scripting) Prevention**
   - Input sanitization for all text fields
   - Pattern-based XSS detection
   - Response data sanitization
   - Secure component rendering

3. **Authentication & Authorization**
   - JWT token-based authentication
   - Secure token storage using AsyncStorage
   - Automatic token refresh mechanism
   - Role-based access control

4. **Rate Limiting**
   - Login attempt rate limiting (5 attempts per 15 minutes)
   - OTP verification rate limiting (3 attempts per 10 minutes)
   - API rate limiting (100 requests per minute)
   - Automatic rate limit reset

5. **Input Validation**
   - Phone number validation (Indian format)
   - Email validation
   - Name validation (letters, spaces, dots, hyphens only)
   - Address validation (10-200 characters)
   - Pincode validation (6 digits)
   - GSTIN validation (15 characters)
   - Password strength validation

6. **Data Sanitization**
   - Automatic removal of dangerous characters
   - Script tag removal
   - Event handler removal
   - URL scheme validation

## 🔧 Production Configuration

### 1. Environment Variables

Create a `.env` file in the frontend root directory:

```env
# API Configuration
API_BASE_URL=https://api.lipiprint.com
API_TIMEOUT=30000

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key

# Payment Configuration
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Push Notifications
PUSH_SERVER_URL=https://push.lipiprint.com
FCM_SERVER_KEY=your_fcm_server_key

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_TIMEOUT=300000
```

### 2. Update Configuration Files

#### `src/config/production.js`
Update the following values:

```javascript
// Replace placeholder values with actual production values
API: {
  BASE_URL: 'https://api.lipiprint.com', // Your actual API URL
  TIMEOUT: 30000,
},

PAYMENT: {
  RAZORPAY: {
    KEY_ID: 'rzp_live_YOUR_ACTUAL_KEY_ID',
  },
},

ANALYTICS: {
  TRACKING_ID: 'G-XXXXXXXXXX', // Your Google Analytics ID
},

ERROR_REPORTING: {
  SENTRY_DSN: 'https://your-sentry-dsn@sentry.io/project-id',
},

SUPPORT: {
  PHONE: '+91-XXXXXXXXXX',
  EMAIL: 'dev.lipiprint@gmail.com',
  WHATSAPP: '+91-XXXXXXXXXX',
},

LEGAL: {
  PRIVACY_POLICY_URL: 'https://lipiprint.com/privacy',
  TERMS_OF_SERVICE_URL: 'https://lipiprint.com/terms',
  REFUND_POLICY_URL: 'https://lipiprint.com/refund',
},
```

### 3. SSL Certificate

Ensure your API endpoints use HTTPS:
- Obtain SSL certificate for your domain
- Configure SSL termination at load balancer
- Enable HSTS headers
- Redirect HTTP to HTTPS

### 4. Database Security

#### PostgreSQL Configuration
```sql
-- Create production database user with limited privileges
CREATE USER lipiprint_app WITH PASSWORD 'strong_password_here';
GRANT CONNECT ON DATABASE lipiprint TO lipiprint_app;
GRANT USAGE ON SCHEMA public TO lipiprint_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lipiprint_app;

-- Enable SSL connections
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL';
```

## 🛡️ Security Best Practices

### 1. Code Security

- ✅ All user inputs are validated and sanitized
- ✅ SQL injection patterns are blocked
- ✅ XSS patterns are detected and prevented
- ✅ Rate limiting is implemented
- ✅ JWT tokens are securely stored
- ✅ HTTPS is enforced for all API calls

### 2. Network Security

- Use HTTPS for all communications
- Implement API rate limiting
- Use secure headers (HSTS, CSP, etc.)
- Enable CORS with specific origins
- Implement request/response logging

### 3. Data Protection

- Encrypt sensitive data at rest
- Use secure key management
- Implement data backup and recovery
- Follow GDPR compliance guidelines
- Regular security audits

### 4. Monitoring & Logging

- Implement comprehensive error logging
- Monitor API performance and errors
- Set up alerts for security events
- Track user authentication attempts
- Monitor rate limiting violations

## 📱 App Store Deployment

### 1. Android (Google Play Store)

#### Build Configuration
```bash
# Generate production keystore
keytool -genkey -v -keystore lipiprint-release-key.keystore -alias lipiprint-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Build production APK
cd android
./gradlew assembleRelease

# Build production AAB (recommended)
./gradlew bundleRelease
```

#### `android/app/build.gradle`
```gradle
android {
    signingConfigs {
        release {
            storeFile file("lipiprint-release-key.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2. iOS (App Store)

#### Build Configuration
```bash
# Install pods
cd ios && pod install

# Build for production
npx react-native run-ios --configuration Release
```

#### `ios/LipiPrint/Info.plist`
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>api.lipiprint.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
        </dict>
    </dict>
</dict>
```

## 🔍 Testing Checklist

### Security Testing
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are prevented
- [ ] Rate limiting works correctly
- [ ] JWT token validation is working
- [ ] Input validation is enforced
- [ ] Error messages don't leak sensitive information

### Functionality Testing
- [ ] Login/OTP flow works correctly
- [ ] Profile completion flow works
- [ ] File upload with validation
- [ ] Payment integration works
- [ ] Real-time notifications work
- [ ] Offline mode functionality

### Performance Testing
- [ ] App startup time is acceptable
- [ ] API response times are within limits
- [ ] Memory usage is optimized
- [ ] Battery usage is reasonable
- [ ] Network usage is optimized

## 📊 Monitoring & Analytics

### 1. Error Tracking
- Sentry integration for crash reporting
- Custom error logging for business logic
- Performance monitoring

### 2. Analytics
- Google Analytics for user behavior
- Custom event tracking
- Conversion funnel analysis

### 3. Performance Monitoring
- API response time monitoring
- App performance metrics
- User engagement tracking

## 🚨 Incident Response

### 1. Security Incidents
1. Immediately block affected endpoints
2. Investigate and identify root cause
3. Apply security patches
4. Notify affected users if necessary
5. Document incident and lessons learned

### 2. Performance Issues
1. Monitor system resources
2. Scale infrastructure if needed
3. Optimize database queries
4. Implement caching strategies
5. Update monitoring alerts

## 📞 Support & Maintenance

### 1. Support Channels
- Email: dev.lipiprint@gmail.com
- Phone: +91-XXXXXXXXXX
- WhatsApp: +91-XXXXXXXXXX
- In-app chat support

### 2. Maintenance Schedule
- Weekly security updates
- Monthly performance reviews
- Quarterly security audits
- Annual penetration testing

### 3. Backup Strategy
- Daily database backups
- Weekly full system backups
- Monthly disaster recovery testing
- Off-site backup storage

## 🔄 Update Process

### 1. App Updates
1. Test thoroughly in staging environment
2. Submit to app stores
3. Monitor rollout progress
4. Track user adoption and feedback
5. Rollback plan if issues arise

### 2. API Updates
1. Deploy to staging environment
2. Run comprehensive tests
3. Deploy to production with blue-green deployment
4. Monitor for any issues
5. Rollback if necessary

## 📋 Compliance

### 1. GDPR Compliance
- User data consent management
- Data portability features
- Right to be forgotten implementation
- Privacy policy updates

### 2. Indian Regulations
- GST compliance for payments
- Digital Personal Data Protection Act compliance
- RBI guidelines for payment processing
- Local data storage requirements

---

## 🎯 Quick Start for Production

1. **Update Configuration**
   ```bash
   # Edit production config
   nano src/config/production.js
   
   # Set environment variables
   cp .env.example .env
   nano .env
   ```

2. **Build for Production**
   ```bash
   # Android
   cd android && ./gradlew assembleRelease
   
   # iOS
   cd ios && xcodebuild -workspace LipiPrint.xcworkspace -scheme LipiPrint -configuration Release
   ```

3. **Deploy Backend**
   ```bash
   # Deploy to your production server
   # Ensure database is properly configured
   # Set up SSL certificates
   ```

4. **Monitor & Test**
   - Test all critical flows
   - Monitor error logs
   - Verify security measures
   - Check performance metrics

---

**⚠️ Important Security Notes:**
- Never commit sensitive keys to version control
- Regularly rotate API keys and secrets
- Monitor for suspicious activities
- Keep all dependencies updated
- Conduct regular security audits
- Have an incident response plan ready

For additional security questions or support, contact: security@lipiprint.com 