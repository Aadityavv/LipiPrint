package com.lipiprint.backend.controller;

import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.entity.UserAddress;
import com.lipiprint.backend.repository.UserAddressRepository;
import com.lipiprint.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/user/addresses")
public class UserAddressController {
    @Autowired private UserAddressRepository repo;
    @Autowired private UserService userService;
    
    // ✅ PINCODE VALIDATION PATTERN
    private static final Pattern PINCODE_PATTERN = Pattern.compile("^\\d{6}$");

    @GetMapping
    public List<UserAddress> getAddresses(Authentication auth) {
        User user = userService.findByPhone(auth.getName()).orElseThrow();
        return repo.findByUserId(user.getId());
    }

    @PostMapping
    public ResponseEntity<?> addAddress(@RequestBody UserAddress address, Authentication auth) {
        User user = userService.findByPhone(auth.getName()).orElseThrow();
        
        // ✅ VALIDATE NEW FIELDS
        String validationError = validateAddress(address);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(Map.of("error", validationError));
        }
        
        address.setUser(user);
        UserAddress savedAddress = repo.save(address);
        return ResponseEntity.ok(savedAddress);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAddress(@PathVariable Long id, @RequestBody UserAddress address, Authentication auth) {
        User user = userService.findByPhone(auth.getName()).orElseThrow();
        UserAddress existing = repo.findByIdAndUserId(id, user.getId()).orElseThrow();
        
        // ✅ VALIDATE NEW FIELDS
        String validationError = validateAddress(address);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(Map.of("error", validationError));
        }
        
        // Update all fields including new ones
        existing.setLine1(address.getLine1());
        existing.setLine2(address.getLine2());
        existing.setLine3(address.getLine3());
        existing.setPhone(address.getPhone());
        existing.setCity(address.getCity());
        existing.setState(address.getState());
        existing.setPincode(address.getPincode());
        existing.setAddressType(address.getAddressType());
        
        UserAddress savedAddress = repo.save(existing);
        return ResponseEntity.ok(savedAddress);
    }

    @DeleteMapping("/{id}")
    public void deleteAddress(@PathVariable Long id, Authentication auth) {
        User user = userService.findByPhone(auth.getName()).orElseThrow();
        repo.deleteById(id);
    }

    @PutMapping("/{id}/default")
    public void setDefault(@PathVariable Long id, Authentication auth) {
        User user = userService.findByPhone(auth.getName()).orElseThrow();
        repo.findByUserId(user.getId()).forEach(addr -> {
            addr.setIsDefault(addr.getId().equals(id));
            repo.save(addr);
        });
    }
    
    // ✅ NEW VALIDATION METHOD
    private String validateAddress(UserAddress address) {
        if (address.getLine1() == null || address.getLine1().trim().isEmpty()) {
            return "Address Line 1 is required";
        }
        if (address.getLine2() == null || address.getLine2().trim().isEmpty()) {
            return "Address Line 2 is required";
        }
        if (address.getLine3() == null || address.getLine3().trim().isEmpty()) {
            return "Address Line 3 is required";
        }
        if (address.getPhone() == null || address.getPhone().trim().isEmpty()) {
            return "Phone number is required";
        }
        if (address.getCity() == null || address.getCity().trim().isEmpty()) {
            return "City is required";
        }
        if (address.getState() == null || address.getState().trim().isEmpty()) {
            return "State is required";
        }
        if (address.getPincode() == null || !PINCODE_PATTERN.matcher(address.getPincode()).matches()) {
            return "Valid 6-digit pincode is required";
        }
        
        return null; // No validation errors
    }
}
