package com.lipiprint.backend.controller;

import com.lipiprint.backend.dto.*;
import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.security.JwtUtils;
import com.lipiprint.backend.security.CustomUserDetails;
import com.lipiprint.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private UserService userService;
    @Autowired
    private JwtUtils jwtUtils;

    // In-memory set to track OTP-verified phones (for demo)
    private static final Set<String> otpVerifiedPhones = ConcurrentHashMap.newKeySet();

    // @PostMapping("/signin")
    // public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
    //     // Password-based login removed. Use OTP endpoints instead.
    //     return ResponseEntity.status(405).body(new MessageResponse("Password login is disabled. Use OTP login."));
    // }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserCreateRequest signUpRequest) {
        // Enforce OTP verification before signup
        if (!otpVerifiedPhones.contains(signUpRequest.getPhone())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Please verify your phone via OTP before signing up."));
        }
        if (userService.findByPhone(signUpRequest.getPhone()).isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Phone is already in use!"));
        }
        if (userService.findByEmail(signUpRequest.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }
        User user = new User(signUpRequest.getName(), signUpRequest.getPhone(), signUpRequest.getEmail(), User.Role.USER);
        user.setUserType(signUpRequest.getUserType());
        user.setGstin(signUpRequest.getGstin());
        userService.register(user);
        otpVerifiedPhones.remove(signUpRequest.getPhone()); // Remove after successful signup
        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @PostMapping("/signout")
    public ResponseEntity<?> logoutUser() {
        // JWT is stateless; client should just delete token
        return ResponseEntity.ok(new MessageResponse("User signed out successfully!"));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody LoginRequest loginRequest) {
        // In real app, send OTP via SMS. Here, always return success.
        return ResponseEntity.ok(new MessageResponse("OTP sent successfully!"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpRequest otpRequest) {
        User user = userService.findByPhone(otpRequest.getPhone()).orElse(null);
        if (user == null) {
            // Allow OTP verification for new users as well
            // For demo, accept any phone
        }
        String masterOtp = "9999";
        if (user != null && user.getRole() == User.Role.ADMIN) masterOtp = "3333";
        if (!otpRequest.getOtp().equals(masterOtp)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid OTP"));
        }
        otpVerifiedPhones.add(otpRequest.getPhone()); // Mark phone as verified
        String jwt = user != null ? jwtUtils.generateToken(user) : null;
        UserDTO userDTO = user != null ? new UserDTO(user.getId(), user.getName(), user.getPhone(), user.getEmail(), user.getRole().name(), user.isBlocked(), user.getCreatedAt(), user.getUpdatedAt()) : null;
        return ResponseEntity.ok(new JwtResponse(jwt, "Bearer", userDTO));
    }
} 