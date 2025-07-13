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
import java.util.stream.Collectors;

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
        return userRepository.save(user);
    }

    public Optional<User> findByPhone(String phone) {
        return userRepository.findByPhone(phone);
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
        return userRepository.save(user);
    }

    public void blockUser(Long userId, boolean blocked) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setBlocked(blocked);
        userRepository.save(user);
    }

    public void assignRole(Long userId, User.Role role) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setRole(role);
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
} 