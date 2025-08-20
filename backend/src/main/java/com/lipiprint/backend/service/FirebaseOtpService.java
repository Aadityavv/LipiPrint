package com.lipiprint.backend.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.HashMap;

@Service
public class FirebaseOtpService {
    
    private static final Logger logger = LoggerFactory.getLogger(FirebaseOtpService.class);
    
    // Default test phone numbers and their OTPs
    private static final Map<String, String> DEFAULT_PHONE_OTP_MAP = new HashMap<>();
    static {
        DEFAULT_PHONE_OTP_MAP.put("1234567890", "999999");
        DEFAULT_PHONE_OTP_MAP.put("6307692868", "999999");
    }
    
    /**
     * Verify OTP for default phone numbers (for testing)
     */
    public boolean verifyDefaultOtp(String phoneNumber, String otp) {
        if (phoneNumber == null || otp == null) {
            return false;
        }
        
        // Clean phone number (remove +91, spaces, etc.)
        String cleanedPhone = cleanPhoneNumber(phoneNumber);
        
        if (DEFAULT_PHONE_OTP_MAP.containsKey(cleanedPhone)) {
            boolean isValid = DEFAULT_PHONE_OTP_MAP.get(cleanedPhone).equals(otp);
            if (isValid) {
                logger.info("✅ Default OTP verification successful for phone: {}", cleanedPhone);
            } else {
                logger.warn("❌ Default OTP verification failed for phone: {}", cleanedPhone);
            }
            return isValid;
        }
        
        logger.info("📞 Phone number {} not in default list, using Firebase verification", cleanedPhone);
        return false; // Not a default phone number
    }
    
    /**
     * Check if phone number is a default test number
     */
    public boolean isDefaultPhoneNumber(String phoneNumber) {
        if (phoneNumber == null) return false;
        String cleanedPhone = cleanPhoneNumber(phoneNumber);
        return DEFAULT_PHONE_OTP_MAP.containsKey(cleanedPhone);
    }
    
    /**
     * Get default OTP for a phone number (for testing purposes only)
     */
    public String getDefaultOtp(String phoneNumber) {
        if (phoneNumber == null) return null;
        String cleanedPhone = cleanPhoneNumber(phoneNumber);
        return DEFAULT_PHONE_OTP_MAP.get(cleanedPhone);
    }
    
    /**
     * Clean phone number by removing country codes, spaces, and special characters
     */
    private String cleanPhoneNumber(String phoneNumber) {
        if (phoneNumber == null) return null;
        
        // Remove +91, +, spaces, dashes, etc.
        String cleaned = phoneNumber.replaceAll("[\\s\\-\\+]", "");
        
        // Remove country code if present
        if (cleaned.startsWith("91") && cleaned.length() == 12) {
            cleaned = cleaned.substring(2);
        }
        
        return cleaned;
    }
    
    /**
     * Verify phone and OTP (combines Firebase and default verification)
     */
    public VerificationResult verifyPhoneAndOtp(String phoneNumber, String otp) {
        try {
            // First check if it's a default phone number
            if (isDefaultPhoneNumber(phoneNumber)) {
                boolean isValid = verifyDefaultOtp(phoneNumber, otp);
                return new VerificationResult(isValid, phoneNumber, "DEFAULT");
            }
            
            // If not default, you would typically verify with Firebase here
            // For now, returning false for non-default numbers
            logger.info("📱 Non-default phone number verification not implemented yet");
            return new VerificationResult(false, phoneNumber, "FIREBASE");
            
        } catch (Exception e) {
            logger.error("❌ Error during phone and OTP verification: {}", e.getMessage());
            return new VerificationResult(false, phoneNumber, "ERROR");
        }
    }
    
    /**
     * Verify Firebase ID token and get phone number from user record (RECOMMENDED)
     */
    public String verifyPhoneToken(String idToken) throws FirebaseAuthException {
        try {
            // First, verify the ID token
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            
            // Get user record to access phone number reliably
            UserRecord userRecord = FirebaseAuth.getInstance().getUser(uid);
            String phoneNumber = userRecord.getPhoneNumber();
            
            if (phoneNumber == null || phoneNumber.isEmpty()) {
                logger.error("❌ Phone number not found for UID: {}", uid);
                throw new RuntimeException("Phone number not found for user");
            }
            
            logger.info("✅ Phone verification successful - UID: {}, Phone: {}", uid, phoneNumber);
            return phoneNumber;
            
        } catch (FirebaseAuthException e) {
            logger.error("❌ Firebase token verification failed: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("❌ Unexpected error during token verification: {}", e.getMessage());
            throw new RuntimeException("Token verification failed: " + e.getMessage());
        }
    }
    
    /**
     * Alternative method using token claims (fallback)
     */
    public String verifyPhoneTokenFromClaims(String idToken) throws FirebaseAuthException {
        try {
            // Verify the ID token sent from client
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            
            // Get phone number from claims
            Map<String, Object> claims = decodedToken.getClaims();
            String phoneNumber = (String) claims.get("phone_number");
            
            // Alternative: Try to get phone number from firebase identities claim
            if (phoneNumber == null || phoneNumber.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> firebase = (Map<String, Object>) claims.get("firebase");
                if (firebase != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> identities = (Map<String, Object>) firebase.get("identities");
                    if (identities != null) {
                        Object phoneNumbers = identities.get("phone");
                        if (phoneNumbers instanceof java.util.List) {
                            @SuppressWarnings("unchecked")
                            java.util.List<String> phoneList = (java.util.List<String>) phoneNumbers;
                            if (!phoneList.isEmpty()) {
                                phoneNumber = phoneList.get(0);
                            }
                        }
                    }
                }
            }
            
            if (phoneNumber == null || phoneNumber.isEmpty()) {
                logger.error("❌ Phone number not found in token claims for UID: {}", uid);
                throw new RuntimeException("Phone number not found in token");
            }
            
            logger.info("✅ Phone verification successful - UID: {}, Phone: {}", uid, phoneNumber);
            return phoneNumber;
            
        } catch (FirebaseAuthException e) {
            logger.error("❌ Firebase token verification failed: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("❌ Unexpected error during token verification: {}", e.getMessage());
            throw new RuntimeException("Token verification failed: " + e.getMessage());
        }
    }
    
    /**
     * Get complete user details from Firebase
     */
    public Map<String, Object> getUserDetails(String uid) throws FirebaseAuthException {
        try {
            UserRecord userRecord = FirebaseAuth.getInstance().getUser(uid);
            
            Map<String, Object> userDetails = new java.util.HashMap<>();
            userDetails.put("uid", userRecord.getUid());
            userDetails.put("phoneNumber", userRecord.getPhoneNumber());
            userDetails.put("email", userRecord.getEmail());
            userDetails.put("displayName", userRecord.getDisplayName());
            userDetails.put("emailVerified", userRecord.isEmailVerified());
            userDetails.put("disabled", userRecord.isDisabled());
            userDetails.put("photoUrl", userRecord.getPhotoUrl());
            
            return userDetails;
            
        } catch (FirebaseAuthException e) {
            logger.error("❌ Failed to get user details: {}", e.getMessage());
            throw e;
        }
    }
    
    /**
     * Verify token and get user details in one call
     */
    public Map<String, Object> verifyTokenAndGetUserDetails(String idToken) throws FirebaseAuthException {
        try {
            // Verify token first
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            
            // Get user details
            return getUserDetails(uid);
            
        } catch (FirebaseAuthException e) {
            logger.error("❌ Token verification and user details fetch failed: {}", e.getMessage());
            throw e;
        }
    }
    
    /**
     * Extract basic user details from Firebase token without additional API call
     */
    public Map<String, Object> extractUserDetails(String idToken) throws FirebaseAuthException {
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            Map<String, Object> claims = decodedToken.getClaims();
            
            Map<String, Object> userDetails = new java.util.HashMap<>();
            userDetails.put("uid", decodedToken.getUid());
            userDetails.put("email", decodedToken.getEmail());
            userDetails.put("name", decodedToken.getName());
            userDetails.put("picture", decodedToken.getPicture());
            userDetails.put("emailVerified", decodedToken.isEmailVerified());
            userDetails.put("phoneNumber", claims.get("phone_number"));
            
            return userDetails;
            
        } catch (FirebaseAuthException e) {
            logger.error("❌ Failed to extract user details: {}", e.getMessage());
            throw e;
        }
    }
    
    /**
     * Helper class for verification results
     */
    public static class VerificationResult {
        private final boolean success;
        private final String phoneNumber;
        private final String method;
        
        public VerificationResult(boolean success, String phoneNumber, String method) {
            this.success = success;
            this.phoneNumber = phoneNumber;
            this.method = method;
        }
        
        public boolean isSuccess() { return success; }
        public String getPhoneNumber() { return phoneNumber; }
        public String getMethod() { return method; }
    }
}
