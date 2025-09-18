package com.lipiprint.backend.controller;

import com.lipiprint.backend.dto.*;
import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.security.JwtUtils;
import com.lipiprint.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtils jwtUtils;

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
            User user = new User(signUpRequest.getName(), signUpRequest.getPhone(), 
                               signUpRequest.getEmail(), signUpRequest.getPassword(), User.Role.USER);
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


}
