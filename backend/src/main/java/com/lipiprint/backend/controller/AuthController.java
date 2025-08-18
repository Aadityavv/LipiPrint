package com.lipiprint.backend.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.lipiprint.backend.dto.*;
import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.security.JwtUtils;
import com.lipiprint.backend.service.UserService;
import com.lipiprint.backend.service.FirebaseOtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private FirebaseOtpService firebaseOtpService;

    // Keep this for fallback/testing purposes
    private static final Set<String> otpVerifiedPhones = ConcurrentHashMap.newKeySet();

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserCreateRequest signUpRequest) {
        // Check if phone is verified (either via Firebase or fallback)
        if (!otpVerifiedPhones.contains(signUpRequest.getPhone())) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Please verify your phone via OTP before signing up."));
        }
        
        if (userService.findByPhone(signUpRequest.getPhone()).isPresent()) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Phone is already in use!"));
        }
        
        if (userService.findByEmail(signUpRequest.getEmail()).isPresent()) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Email is already in use!"));
        }
        
        User user = new User(signUpRequest.getName(), signUpRequest.getPhone(), 
                           signUpRequest.getEmail(), User.Role.USER);
        user.setUserType(signUpRequest.getUserType());
        user.setGstin(signUpRequest.getGstin());
        
        userService.register(user);
        otpVerifiedPhones.remove(signUpRequest.getPhone()); // Clean up
        
        logger.info("✅ User registered successfully: {}", signUpRequest.getPhone());
        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @PostMapping("/signout")
    public ResponseEntity<?> logoutUser() {
        return ResponseEntity.ok(new MessageResponse("User signed out successfully!"));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody LoginRequest loginRequest) {
        try {
            String phoneNumber = loginRequest.getPhone();
            logger.info("📱 OTP requested for phone: {}", phoneNumber);
            
            // In production, Firebase handles OTP sending on client-side
            // This endpoint is mainly for logging and potential server-side validation
            
            return ResponseEntity.ok(new MessageResponse("OTP sent successfully to " + phoneNumber));
            
        } catch (Exception e) {
            logger.error("❌ Send OTP failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to send OTP: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpRequest otpRequest) {
        try {
            String phoneNumber = otpRequest.getPhone();
            String otp = otpRequest.getOtp();
            
            logger.info("🔍 Verifying OTP for phone: {}", phoneNumber);
            
            // Try Firebase verification first (if idToken is provided)
            boolean isFirebaseVerified = false;
            if (otpRequest.getIdToken() != null && !otpRequest.getIdToken().isEmpty()) {
                try {
                    String verifiedPhone = firebaseOtpService.verifyPhoneToken(otpRequest.getIdToken());
                    if (verifiedPhone.equals(phoneNumber) || 
                        verifiedPhone.equals("+91" + phoneNumber) || 
                        ("+91" + verifiedPhone).equals(phoneNumber)) {
                        isFirebaseVerified = true;
                        logger.info("✅ Firebase OTP verification successful for: {}", phoneNumber);
                    }
                } catch (Exception e) {
                    logger.warn("⚠️ Firebase verification failed, trying fallback: {}", e.getMessage());
                }
            }
            
            // Fallback to static OTP for testing/development
            boolean isStaticOtpValid = false;
            if (!isFirebaseVerified) {
                String masterOtp = "9999"; // Default OTP
                
                // Check if user exists and set admin OTP
                Optional<User> existingUser = userService.findByPhone(phoneNumber);
                if (existingUser.isPresent() && existingUser.get().getRole() == User.Role.ADMIN) {
                    masterOtp = "3333";
                }
                
                if (otp.equals(masterOtp)) {
                    isStaticOtpValid = true;
                    logger.info("✅ Static OTP verification successful for: {}", phoneNumber);
                }
            }
            
            // If neither verification method worked
            if (!isFirebaseVerified && !isStaticOtpValid) {
                logger.error("❌ OTP verification failed for: {}", phoneNumber);
                return ResponseEntity.badRequest().body(new MessageResponse("Invalid OTP"));
            }
            
            // Mark phone as verified
            otpVerifiedPhones.add(phoneNumber);
            
            // Find or handle user
            Optional<User> userOptional = userService.findByPhone(phoneNumber);
            User user = userOptional.orElse(null);
            
            // Generate JWT token if user exists
            String jwt = null;
            UserDTO userDTO = null;
            
            if (user != null) {
                jwt = jwtUtils.generateToken(user);
                userDTO = new UserDTO(
                    user.getId(), 
                    user.getName(), 
                    user.getPhone(), 
                    user.getEmail(),
                    user.getRole().name(), 
                    user.isBlocked(), 
                    user.getCreatedAt(), 
                    user.getUpdatedAt()
                );
                logger.info("✅ Existing user login successful: {}", phoneNumber);
            } else {
                // For new users, they'll need to complete signup
                logger.info("📝 New user - OTP verified, signup required: {}", phoneNumber);
            }
            
            return ResponseEntity.ok(new JwtResponse(jwt, "Bearer", userDTO));
            
        } catch (Exception e) {
            logger.error("❌ OTP verification error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(new MessageResponse("OTP verification failed: " + e.getMessage()));
        }
    }

    /**
     * New endpoint for Firebase-based authentication
     */
@PostMapping("/firebase-auth")
public ResponseEntity<?> firebaseAuth(@RequestBody FirebaseAuthRequest request) {
    try {
        // Use the reliable UserRecord-based method
        String phoneNumber = firebaseOtpService.verifyPhoneToken(request.getIdToken());
        
        logger.info("✅ Firebase authentication successful for: {}", phoneNumber);
        
        // Clean phone number format (remove +91 if present)
        String cleanPhone = phoneNumber.replaceFirst("\\+91", "");

        
        // Find or create user
        Optional<User> userOptional = userService.findByPhone(cleanPhone);
        User user;
        
        if (userOptional.isPresent()) {
            user = userOptional.get();
            logger.info("✅ Existing user found: {}", cleanPhone);
        } else {
            // Create new user with Firebase phone
            user = userService.createUserFromPhone(cleanPhone);
            logger.info("✅ New user created from Firebase: {}", cleanPhone);
        }
        
        // Generate JWT token
        String jwt = jwtUtils.generateToken(user);
        
        UserDTO userDTO = new UserDTO(
            user.getId(), 
            user.getName(), 
            user.getPhone(), 
            user.getEmail(),
            user.getRole().name(), 
            user.isBlocked(), 
            user.getCreatedAt(), 
            user.getUpdatedAt()
        );
        
        return ResponseEntity.ok(new JwtResponse(jwt, "Bearer", userDTO));
        
    } catch (FirebaseAuthException e) {
        logger.error("❌ Firebase authentication failed: {}", e.getMessage());
        return ResponseEntity.badRequest()
            .body(new MessageResponse("Authentication failed: " + e.getMessage()));
    } catch (RuntimeException e) {
        logger.error("❌ Authentication error: {}", e.getMessage());
        return ResponseEntity.badRequest()
            .body(new MessageResponse("Authentication failed: " + e.getMessage()));
    } catch (Exception e) {
        logger.error("❌ Unexpected authentication error: {}", e.getMessage());
        return ResponseEntity.badRequest()
            .body(new MessageResponse("Authentication failed: " + e.getMessage()));
    }
}

}
