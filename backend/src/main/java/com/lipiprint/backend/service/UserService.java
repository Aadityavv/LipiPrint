package com.lipiprint.backend.service;

import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.repository.UserRepository;
import com.lipiprint.backend.repository.OrderRepository;
import com.lipiprint.backend.repository.PrintJobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private PrintJobRepository printJobRepository;

    public User register(User user) {
        user.setRole(User.Role.USER);
        user.setCreatedAt(java.time.LocalDateTime.now());
        user.setUpdatedAt(java.time.LocalDateTime.now());
        // Encode password before saving
        if (user.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(user);
    }

    public Optional<User> findByPhone(String phone) {
        return userRepository.findByPhone(phone);
    }

    public Optional<User> authenticateUser(String phone, String password) {
        Optional<User> userOptional = findByPhone(phone);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (passwordEncoder.matches(password, user.getPassword())) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public List<User> findByRole(User.Role role) {
        return userRepository.findByRole(role);
    }

    public User updateProfile(User user) {
        user.setUpdatedAt(java.time.LocalDateTime.now());
        return userRepository.save(user);
    }

    public void blockUser(Long userId, boolean blocked) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setBlocked(blocked);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);
    }

    public void assignRole(Long userId, User.Role role) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setRole(role);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Map<String, Object> getUserStatistics(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        User user = userRepository.findById(userId).orElseThrow();
        var orders = orderRepository.findByUserId(userId);
        int totalOrders = orders.size();
        int totalPrintJobs = printJobRepository.findByUserId(userId).size();
        double totalSpent = orders.stream().mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0).sum();
        double totalSaved = totalSpent * 0.10;
        stats.put("userId", user.getId());
        stats.put("userName", user.getName());
        stats.put("totalOrders", totalOrders);
        stats.put("totalPrintJobs", totalPrintJobs);
        stats.put("totalSpent", totalSpent);
        stats.put("totalSaved", totalSaved);
        stats.put("accountCreated", user.getCreatedAt());
        stats.put("lastUpdated", user.getUpdatedAt());
        return stats;
    }

    public long getActiveUserCount() {
        return userRepository.count();
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    /**
     * Create a new user from phone number (for MSG91 auth)
     */
    public User createUserFromPhone(String phoneNumber) {
        User user = new User();
        user.setPhone(cleanPhoneNumber(phoneNumber));
        user.setName("User"); // Default name, can be updated later
        user.setRole(User.Role.USER);
        user.setBlocked(false);
        user.setCreatedAt(java.time.LocalDateTime.now());
        user.setUpdatedAt(java.time.LocalDateTime.now());
        
        return userRepository.save(user);
    }

    /**
     * Find user by phone number with different formats
     */
    public Optional<User> findByPhoneNumber(String phoneNumber) {
        String cleanPhone = cleanPhoneNumber(phoneNumber);
        
        // Try exact match first
        Optional<User> user = findByPhone(cleanPhone);
        
        // Try without country code
        if (user.isEmpty() && cleanPhone.startsWith("91") && cleanPhone.length() == 12) {
            user = findByPhone(cleanPhone.substring(2));
        }
        
        // Try with country code
        if (user.isEmpty() && cleanPhone.length() == 10) {
            user = findByPhone("91" + cleanPhone);
        }
        
        return user;
    }

    /**
     * Clean phone number format
     */
    private String cleanPhoneNumber(String phoneNumber) {
        if (phoneNumber == null) return null;
        
        // Remove all non-digit characters
        String cleaned = phoneNumber.replaceAll("[^\\d]", "");
        
        // Handle Indian phone numbers
        if (cleaned.length() == 10) {
            return cleaned; // Store without country code
        } else if (cleaned.length() == 12 && cleaned.startsWith("91")) {
            return cleaned.substring(2); // Remove country code
        } else if (cleaned.length() == 13 && cleaned.startsWith("091")) {
            return cleaned.substring(3); // Remove 0 and country code
        }
        
        return cleaned;
    }

    /**
     * Update user profile after OTP verification
     */
    public User completeProfile(Long userId, String name, String email, String userType, String gstin) {
        User user = userRepository.findById(userId).orElseThrow();
        
        if (name != null && !name.trim().isEmpty()) {
            user.setName(name.trim());
        }
        
        if (email != null && !email.trim().isEmpty()) {
            // Check if email is already in use by another user
            Optional<User> existingUser = findByEmail(email);
            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                throw new RuntimeException("Email is already in use by another account");
            }
            user.setEmail(email.trim());
        }
        
        if (userType != null && !userType.trim().isEmpty()) {
            user.setUserType(userType.trim());
        }
        
        if (gstin != null && !gstin.trim().isEmpty()) {
            user.setGstin(gstin.trim());
        }
        
        return updateProfile(user);
    }
}
