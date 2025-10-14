# 🚨 CRITICAL ACTIONS BEFORE PLAY STORE LAUNCH

## ⚠️ MUST DO BEFORE SUBMISSION (BLOCKERS)

### 1. Replace Razorpay Test Key ⚡ CRITICAL
**Location**: `frontend/src/config/production.js` - Line 50

**Current**:
```javascript
KEY_ID: 'rzp_test_0SpkSjDk6lMGOy', // Replace with your live Razorpay key
```

**Action**:
```javascript
KEY_ID: 'rzp_live_XXXXXXXXXXXXX', // Your actual live key
```

---

### 2. Fill Placeholder Information ⚡ CRITICAL

Search and replace these placeholders in the following files:
- `frontend/src/config/production.js`
- `frontend/src/screens/policies/*.js`

**Placeholders to replace**:

| Placeholder | Example Replacement | Files |
|-------------|-------------------|-------|
| `+91-XXXXXXXXXX` | `+91-9876543210` | production.js, ContactUsScreen.js, ShippingPolicyScreen.js |
| `[Your Office Address]` | `123 Main Street, Building A` | ContactUsScreen.js |
| `[City, State - Pincode]` | `Mumbai, Maharashtra - 400001` | ContactUsScreen.js |
| `[Your Registered Office Address]` | Full company address | PrivacyPolicyScreen.js |
| `[Your City/Cities]` | `Mumbai and Pune` | ShippingPolicyScreen.js |
| `G-XXXXXXXXXX` | Your actual Google Analytics ID | production.js line 82 |
| Sentry DSN | Your actual Sentry DSN | production.js line 98 |

---

### 3. Host Policies on Public Website ⚡ CRITICAL

**Required URLs** (MUST be publicly accessible):

1. https://lipiprint.com/privacy
2. https://lipiprint.com/terms
3. https://lipiprint.com/refund
4. https://lipiprint.com/shipping
5. https://lipiprint.com/contact

**How to host**:
- Option 1: Create simple HTML pages and host on your domain
- Option 2: Use GitHub Pages (free)
- Option 3: Use Google Sites or similar free hosting
- Option 4: Create pages on your existing website

**Then update** `frontend/src/config/production.js`:
```javascript
LEGAL: {
  PRIVACY_POLICY_URL: 'https://lipiprint.com/privacy',
  TERMS_OF_SERVICE_URL: 'https://lipiprint.com/terms',
  REFUND_POLICY_URL: 'https://lipiprint.com/refund',
  SHIPPING_POLICY_URL: 'https://lipiprint.com/shipping', // ADD THIS
  CONTACT_US_URL: 'https://lipiprint.com/contact', // ADD THIS
  // ... rest of config
}
```

---

### 4. Update Play Store Listing ⚡ CRITICAL

**In Google Play Console**, add these URLs:

1. **Privacy Policy URL**: https://lipiprint.com/privacy (REQUIRED)
2. **Terms of Service URL**: https://lipiprint.com/terms (Recommended)

**Where to add**:
- Go to Play Console
- Select your app
- Store presence → App content → Privacy Policy
- Paste your hosted privacy policy URL
- Save changes

---

## 🔴 HIGH PRIORITY (Before Launch)

### 5. Complete Razorpay KYC ⚠️ HIGH PRIORITY

- [ ] Log in to Razorpay Dashboard
- [ ] Complete KYC verification
- [ ] Upload business documents
- [ ] Verify bank account
- [ ] Activate live mode
- [ ] Get live API keys
- [ ] Test live payment flow

**Timeline**: 2-5 business days for KYC approval

---

### 6. Test Live Payment Flow ⚠️ HIGH PRIORITY

- [ ] Replace test key with live key
- [ ] Test small amount payment (₹1)
- [ ] Verify payment success
- [ ] Check webhook notifications
- [ ] Verify refund process works
- [ ] Test all payment methods (UPI, Card, Wallet)

---

### 7. Add Content Moderation System ⚠️ HIGH PRIORITY

**Minimum implementation**:
```javascript
// Backend: Add file validation
- Scan for viruses/malware (use ClamAV or similar)
- Check file size limits
- Validate file types
- Block suspicious filenames
- Add rate limiting per user

// Admin tools needed:
- View flagged content
- Manual review queue
- User suspension capability
- Audit logs
```

---

### 8. GST Compliance (if applicable) ⚠️ HIGH PRIORITY

If your business revenue exceeds ₹20 lakhs/year:
- [ ] Register for GST
- [ ] Update GST number in Razorpay
- [ ] Ensure invoices have GST details
- [ ] File GST returns regularly

---

## 🟡 MEDIUM PRIORITY (Recommended)

### 9. Implement Data Deletion Feature

**GDPR Compliance**:
- [ ] Add "Delete My Account" option
- [ ] Add "Download My Data" option
- [ ] Implement permanent data deletion
- [ ] Add confirmation dialogs

**Location**: Settings screen or Privacy & Security screen

---

### 10. Add User Reporting Mechanism

**Features needed**:
- Report inappropriate content
- Report payment issues
- Report delivery problems
- Flag suspicious activity

---

### 11. Create Play Store Assets

**Required**:
- [ ] App Icon (512x512 PNG)
- [ ] Feature Graphic (1024x500)
- [ ] Screenshots (minimum 2, maximum 8)
  - Phone: 1080x1920 or 1080x2340
  - 7-inch tablet: 1536x2048
  - 10-inch tablet: 2048x1536

**Optional but recommended**:
- [ ] Promotional video (30 seconds to 2 minutes)
- [ ] TV banner (1280x720)

---

### 12. Setup Analytics & Monitoring

**Update production.js**:
```javascript
ANALYTICS: {
  ENABLED: true,
  TRACKING_ID: 'G-YOURACTUALID', // Replace placeholder
  CRASH_REPORTING: true,
  PERFORMANCE_MONITORING: true,
},

ERROR_REPORTING: {
  ENABLED: true,
  SENTRY_DSN: 'https://YOUR-ACTUAL-DSN@sentry.io/project-id', // Replace
  LOG_LEVEL: 'error',
  CAPTURE_UNHANDLED: true,
},
```

---

## 🟢 LOW PRIORITY (Can Do Later)

### 13. Security Enhancements

- [ ] Add biometric authentication
- [ ] Implement 2FA (optional)
- [ ] Add session timeout
- [ ] Add suspicious activity alerts

---

### 14. User Experience Improvements

- [ ] Add onboarding tutorial
- [ ] Create help videos
- [ ] Add FAQ section
- [ ] Implement chatbot

---

## ✅ QUICK CHECKLIST

**Before you submit to Play Store, ensure**:

- [ ] ✅ Razorpay test key replaced with live key
- [ ] ✅ All placeholder phone numbers filled
- [ ] ✅ All placeholder addresses filled
- [ ] ✅ Policies hosted on public website
- [ ] ✅ Privacy Policy URL added to Play Store listing
- [ ] ✅ Google Analytics ID updated
- [ ] ✅ Sentry DSN updated
- [ ] ✅ Razorpay KYC completed
- [ ] ✅ Live payment tested successfully
- [ ] ✅ App tested on multiple devices (Android 8+)
- [ ] ✅ No crashes or critical bugs
- [ ] ✅ Screenshots prepared (8 images)
- [ ] ✅ Feature graphic created (1024x500)
- [ ] ✅ Signed APK/AAB generated
- [ ] ✅ Content rating completed in Play Console
- [ ] ✅ Release notes written
- [ ] ✅ Age restriction set (18+)
- [ ] ✅ Category selected (Business/Productivity)

---

## 📱 PLAY STORE SUBMISSION STEPS

1. **Google Play Console**
   - Go to https://play.google.com/console
   - Create new application
   - Fill in app details

2. **Store Listing**
   - App name: LipiPrint - Print & Deliver
   - Short description: (Copy from PLAY_STORE_DESCRIPTIONS.txt)
   - Full description: (Copy from PLAY_STORE_DESCRIPTIONS.txt)
   - Screenshots: Upload 8 screenshots
   - Feature graphic: Upload 1024x500 image
   - App icon: Upload 512x512 icon

3. **App Content**
   - Privacy Policy: https://lipiprint.com/privacy
   - App access: All functionality available without restrictions
   - Ads: No (since you don't have ads)
   - Content rating: Complete questionnaire (18+)
   - Target audience: Adults (18+)
   - Data safety: Fill out data collection details

4. **Pricing & Distribution**
   - Free app
   - Countries: India (or select multiple)
   - Content guidelines: Accept
   - Export laws: Accept

5. **Release**
   - Production track (or Internal/Closed testing first)
   - Upload signed AAB (Android App Bundle)
   - Release name: v1.0.0
   - Release notes: (Copy from PLAY_STORE_DESCRIPTIONS.txt)
   - Review and rollout

---

## ⏱️ ESTIMATED TIMELINE

| Task | Time Required |
|------|---------------|
| Replace test key & fill placeholders | 30 minutes |
| Host policies on website | 2-4 hours |
| Razorpay KYC completion | 2-5 business days |
| Test live payments | 1 hour |
| Create Play Store assets | 4-8 hours |
| Generate signed APK/AAB | 1 hour |
| Fill Play Store listing | 2-3 hours |
| Google Play review | 3-7 days |

**Total time to launch**: 1-2 weeks (including Razorpay KYC and Play Store review)

---

## 🆘 SUPPORT CONTACTS

- **Google Play Console Help**: https://support.google.com/googleplay/android-developer
- **Razorpay Support**: support@razorpay.com or https://razorpay.com/support/
- **Play Store Policies**: https://play.google.com/about/developer-content-policy/

---

## 📞 NEED HELP?

If you need help with any of these steps:
1. Check the detailed compliance report: `PLAY_STORE_COMPLIANCE_REPORT.md`
2. Review Play Store descriptions: `PLAY_STORE_DESCRIPTIONS.txt`
3. Contact Google Play Developer Support
4. Contact Razorpay Support for payment integration issues

---

**Good luck with your launch! 🚀**



