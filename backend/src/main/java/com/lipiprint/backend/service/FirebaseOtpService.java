package com.lipiprint.backend.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class FirebaseOtpService {
    
    private static final Logger logger = LoggerFactory.getLogger(FirebaseOtpService.class);
    
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
}
