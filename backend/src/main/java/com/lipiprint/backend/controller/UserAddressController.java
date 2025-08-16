package com.lipiprint.backend.controller;

import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.entity.UserAddress;
import com.lipiprint.backend.repository.UserAddressRepository;
import com.lipiprint.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/user/addresses")
public class UserAddressController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserAddressController.class);
    
    @Autowired private UserAddressRepository repo;
    @Autowired private UserService userService;
    
    // ✅ PINCODE VALIDATION PATTERN
    private static final Pattern PINCODE_PATTERN = Pattern.compile("^\\d{6}$");

    @GetMapping
    public List<UserAddress> getAddresses(Authentication auth) {
        User user = userService.findByPhone(auth.getName()).orElseThrow();
        return repo.findByUserId(user.getId());
    }

    // ✅ CRITICAL FIX: Change from UserAddress to Map<String, Object>
    @PostMapping
    public ResponseEntity<?> addAddress(@RequestBody Map<String, Object> addressData, Authentication auth) {
        logger.info("========================================");
        logger.info("ADD ADDRESS REQUEST");
        logger.info("Address Data: {}", addressData);
        logger.info("========================================");
        
        try {
            User user = userService.findByPhone(auth.getName()).orElseThrow();
            logger.info("✅ User found: {} (ID: {})", user.getName(), user.getId());
            
            // ✅ EXTRACT: Convert JSON to UserAddress object
// In your addAddress method, add null checks:
UserAddress address = new UserAddress();
address.setLine1(addressData.get("line1") != null ? ((String) addressData.get("line1")).trim() : "");
address.setLine2(addressData.get("line2") != null ? ((String) addressData.get("line2")).trim() : "");
address.setLine3(addressData.get("line3") != null ? ((String) addressData.get("line3")).trim() : null);
address.setPhone(addressData.get("phone") != null ? ((String) addressData.get("phone")).trim() : "");
address.setCity(addressData.get("city") != null ? ((String) addressData.get("city")).trim() : "");
address.setState(addressData.get("state") != null ? ((String) addressData.get("state")).trim() : "");
address.setPincode(addressData.get("pincode") != null ? ((String) addressData.get("pincode")).trim() : "");
address.setAddressType((String) addressData.getOrDefault("addressType", "home"));
            
            logger.info("🔍 Converted to UserAddress:");
            logger.info("   Line1: '{}'", address.getLine1());
            logger.info("   Line2: '{}'", address.getLine2());
            logger.info("   Pincode: '{}'", address.getPincode());
            logger.info("   City: '{}'", address.getCity());
            logger.info("   State: '{}'", address.getState());
            
            // ✅ VALIDATE: Check the address (updated validation)
            String validationError = validateAddress(address);
            if (validationError != null) {
                logger.error("❌ Validation failed: {}", validationError);
                return ResponseEntity.badRequest().body(Map.of("error", validationError));
            }
            
            address.setUser(user);
            UserAddress savedAddress = repo.save(address);
            
            logger.info("✅ Address saved successfully with ID: {}", savedAddress.getId());
            logger.info("========================================");
            
            return ResponseEntity.ok(savedAddress);
            
        } catch (Exception e) {
            logger.error("❌ Failed to add address: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to add address: " + e.getMessage()));
        }
    }

    // ✅ ALSO FIX: Update method to handle JSON
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAddress(@PathVariable Long id, @RequestBody Map<String, Object> addressData, Authentication auth) {
        try {
            User user = userService.findByPhone(auth.getName()).orElseThrow();
            UserAddress existing = repo.findByIdAndUserId(id, user.getId()).orElseThrow();
            
            // ✅ UPDATE: Set fields from JSON data
            if (addressData.containsKey("line1")) existing.setLine1((String) addressData.get("line1"));
            if (addressData.containsKey("line2")) existing.setLine2((String) addressData.get("line2"));
            if (addressData.containsKey("line3")) existing.setLine3((String) addressData.get("line3"));
            if (addressData.containsKey("phone")) existing.setPhone((String) addressData.get("phone"));
            if (addressData.containsKey("city")) existing.setCity((String) addressData.get("city"));
            if (addressData.containsKey("state")) existing.setState((String) addressData.get("state"));
            if (addressData.containsKey("pincode")) existing.setPincode((String) addressData.get("pincode"));
            if (addressData.containsKey("addressType")) existing.setAddressType((String) addressData.get("addressType"));
            
            // ✅ VALIDATE: Updated address
            String validationError = validateAddress(existing);
            if (validationError != null) {
                return ResponseEntity.badRequest().body(Map.of("error", validationError));
            }
            
            UserAddress savedAddress = repo.save(existing);
            return ResponseEntity.ok(savedAddress);
            
        } catch (Exception e) {
            logger.error("❌ Failed to update address: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update address: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAddress(@PathVariable Long id, Authentication auth) {
        try {
            User user = userService.findByPhone(auth.getName()).orElseThrow();
            UserAddress existing = repo.findByIdAndUserId(id, user.getId()).orElse(null);
            
            if (existing == null) {
                return ResponseEntity.notFound().build();
            }
            
            repo.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Address deleted successfully"));
            
        } catch (Exception e) {
            logger.error("❌ Failed to delete address: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete address"));
        }
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<?> setDefault(@PathVariable Long id, Authentication auth) {
        try {
            User user = userService.findByPhone(auth.getName()).orElseThrow();
            repo.findByUserId(user.getId()).forEach(addr -> {
                addr.setIsDefault(addr.getId().equals(id));
                repo.save(addr);
            });
            return ResponseEntity.ok(Map.of("message", "Default address updated"));
        } catch (Exception e) {
            logger.error("❌ Failed to set default address: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to set default address"));
        }
    }
    
    // ✅ UPDATED: Validation method (line3 is optional now)
    private String validateAddress(UserAddress address) {
        if (address.getLine1() == null || address.getLine1().trim().isEmpty()) {
            return "Address Line 1 is required";
        }
        if (address.getLine2() == null || address.getLine2().trim().isEmpty()) {
            return "Address Line 2 is required";
        }
        // ✅ REMOVED: line3 validation since frontend doesn't send it
        // if (address.getLine3() == null || address.getLine3().trim().isEmpty()) {
        //     return "Address Line 3 is required";
        // }
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