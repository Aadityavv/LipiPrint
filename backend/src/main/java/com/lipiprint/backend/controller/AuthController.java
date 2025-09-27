package com.lipiprint.backend.controller;

import com.lipiprint.backend.dto.*;
import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.security.JwtUtils;
import com.lipiprint.backend.service.UserService;
import com.lipiprint.backend.service.EmailOtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private EmailOtpService emailOtpService;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserCreateRequest signUpRequest) {
        try {
            // Check if user already exists
            if (userService.findByPhone(signUpRequest.getPhone()).isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Phone number is already registered!"));
            }
            
            if (signUpRequest.getEmail() != null && 
                userService.findByEmail(signUpRequest.getEmail()).isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
            }
            
            // Create new user with password
            User.Role userRole = User.Role.USER; // Default role
            
            // Check if role is specified in the request
            if (signUpRequest.getRole() != null && signUpRequest.getRole().equalsIgnoreCase("ADMIN")) {
                userRole = User.Role.ADMIN;
            }
            
            User user = new User(signUpRequest.getName(), signUpRequest.getPhone(), 
                               signUpRequest.getEmail(), signUpRequest.getPassword(), userRole);
            user.setUserType(signUpRequest.getUserType());
            user.setGstin(signUpRequest.getGstin());
            
            user = userService.register(user);
            
            logger.info("✅ User registered successfully: {}", signUpRequest.getPhone());
            
            // Generate JWT token for immediate login
            String jwt = jwtUtils.generateToken(user);
            UserDTO userDTO = new UserDTO(
                user.getId(), 
                user.getName(), 
                user.getPhone(), 
                user.getEmail(),
                user.getRole().name(), 
                user.isBlocked(),
                user.isCanEdit(),
                user.getCreatedAt(), 
                user.getUpdatedAt(),
                false
            );
            
            return ResponseEntity.ok(new JwtResponse(jwt, "Bearer", userDTO));
            
        } catch (Exception e) {
            logger.error("❌ Registration failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            String phoneNumber = loginRequest.getPhone();
            String password = loginRequest.getPassword();
            
            if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Phone number is required"));
            }
            
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Password is required"));
            }
            
            logger.info("🔐 Login attempt for phone: {}", phoneNumber);
            
            // Authenticate user with password
            Optional<User> userOptional = userService.authenticateUser(phoneNumber, password);
            
            if (userOptional.isEmpty()) {
                logger.error("❌ Invalid credentials for phone: {}", phoneNumber);
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Invalid phone number or password"));
            }
            
            User user = userOptional.get();
            
            // Check if user is blocked
            if (user.isBlocked()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Your account has been blocked. Please contact support."));
            }
            
            logger.info("✅ Login successful for: {}", phoneNumber);
            
            // Generate JWT token
            String jwt = jwtUtils.generateToken(user);
            UserDTO userDTO = new UserDTO(
                user.getId(), 
                user.getName(), 
                user.getPhone(), 
                user.getEmail(),
                user.getRole().name(), 
                user.isBlocked(),
                user.isCanEdit(),
                user.getCreatedAt(), 
                user.getUpdatedAt(),
                false
            );
            
            return ResponseEntity.ok(new JwtResponse(jwt, "Bearer", userDTO));
            
        } catch (Exception e) {
            logger.error("❌ Login error: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Login failed: " + e.getMessage()));
        }
    }


    @PostMapping("/signout")
    public ResponseEntity<?> logoutUser() {
        // In stateless JWT authentication, logout is typically handled client-side
        // by removing the token. However, you can implement token blacklisting here if needed.
        logger.info("📤 User signed out");
        return ResponseEntity.ok(new MessageResponse("User signed out successfully!"));
    }

    @PostMapping("/send-email-otp")
    public ResponseEntity<?> sendEmailOtp(@Valid @RequestBody EmailOtpRequest request) {
        try {
            String email = request.getEmail().trim().toLowerCase();
            
            // Check if user exists with this email
            Optional<User> userOptional = userService.findByEmail(email);
            if (!userOptional.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("No account found with this email address."));
            }
            
            // Generate and send OTP
            emailOtpService.generateOtp(email);
            
            logger.info("✅ Email OTP sent to: {}", email);
            return ResponseEntity.ok(new MessageResponse("OTP sent to your email address."));
            
        } catch (Exception e) {
            logger.error("❌ Failed to send email OTP: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to send OTP. Please try again."));
        }
    }

    @PostMapping("/verify-email-otp")
    public ResponseEntity<?> verifyEmailOtp(@Valid @RequestBody EmailOtpVerifyRequest request) {
        try {
            String email = request.getEmail().trim().toLowerCase();
            String otp = request.getOtp();
            
            // Verify OTP
            if (!emailOtpService.verifyOtp(email, otp)) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Invalid or expired OTP."));
            }
            
            // Find user by email
            Optional<User> userOptional = userService.findByEmail(email);
            if (!userOptional.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("User not found."));
            }
            
            User user = userOptional.get();
            
            // Generate JWT token
            String jwt = jwtUtils.generateToken(user);
            UserDTO userDTO = new UserDTO(
                user.getId(), 
                user.getName(), 
                user.getPhone(), 
                user.getEmail(),
                user.getRole().name(), 
                user.isBlocked(),
                user.isCanEdit(),
                user.getCreatedAt(), 
                user.getUpdatedAt(),
                false
            );
            
            logger.info("✅ Email OTP verification successful for: {}", email);
            return ResponseEntity.ok(new JwtResponse(jwt, "Bearer", userDTO));
            
        } catch (Exception e) {
            logger.error("❌ Email OTP verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse("OTP verification failed. Please try again."));
        }
    }

    @PostMapping("/reset-password-email")
    public ResponseEntity<?> resetPasswordWithEmail(@Valid @RequestBody EmailOtpVerifyRequest request) {
        try {
            String email = request.getEmail().trim().toLowerCase();
            String otp = request.getOtp();
            
            // Verify OTP
            if (!emailOtpService.verifyOtp(email, otp)) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Invalid or expired OTP."));
            }
            
            // Find user by email
            Optional<User> userOptional = userService.findByEmail(email);
            if (!userOptional.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("User not found."));
            }
            
            logger.info("✅ Email OTP verified for password reset: {}", email);
            return ResponseEntity.ok(new MessageResponse("OTP verified. You can now set a new password."));
            
        } catch (Exception e) {
            logger.error("❌ Email OTP verification for password reset failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse("OTP verification failed. Please try again."));
        }
    }

    @PostMapping("/update-password-email")
    public ResponseEntity<?> updatePasswordWithEmail(@Valid @RequestBody Map<String, String> request) {
        try {
            String email = request.get("email").trim().toLowerCase();
            String newPassword = request.get("newPassword");
            
            if (newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Password must be at least 6 characters long."));
            }
            
            // Find user by email
            Optional<User> userOptional = userService.findByEmail(email);
            if (!userOptional.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("User not found."));
            }
            
            User user = userOptional.get();
            
            // Update password
            user.setPassword(userService.getPasswordEncoder().encode(newPassword));
            user.setUpdatedAt(java.time.LocalDateTime.now());
            userService.updateProfile(user);
            
            logger.info("✅ Password updated successfully for email: {}", email);
            return ResponseEntity.ok(new MessageResponse("Password updated successfully! You can now login with your new password."));
            
        } catch (Exception e) {
            logger.error("❌ Password update failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Failed to update password. Please try again."));
        }
    }
}
