package com.lipiprint.backend.controller;

import com.lipiprint.backend.dto.MessageResponse;
import com.lipiprint.backend.dto.UserCreateRequest;
import com.lipiprint.backend.dto.UserUpdateRequest;
import com.lipiprint.backend.dto.UserDTO;
import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getProfile(Authentication authentication) {
        User user = userService.findByPhone(authentication.getName()).orElseThrow();
        UserDTO userDTO = new UserDTO(user.getId(), user.getName(), user.getPhone(), user.getEmail(), user.getRole().name(), user.isBlocked(), user.isCanEdit(), user.getCreatedAt(), user.getUpdatedAt(), false);
        return ResponseEntity.ok(userDTO);
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getUserStatistics(Authentication authentication) {
        User user = userService.findByPhone(authentication.getName()).orElseThrow();
        Map<String, Object> stats = userService.getUserStatistics(user.getId());
        return ResponseEntity.ok(stats);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateProfile(Authentication authentication, @Valid @RequestBody UserUpdateRequest updateRequest) {
        User user = userService.findByPhone(authentication.getName()).orElseThrow();
        
        // Check if email is already in use by another user
        if (!user.getEmail().equals(updateRequest.getEmail())) {
            if (userService.findByEmail(updateRequest.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().build();
            }
        }
        
        user.setName(updateRequest.getName());
        user.setEmail(updateRequest.getEmail());
        
        // Update optional fields if provided
        if (updateRequest.getGstin() != null) {
            user.setGstin(updateRequest.getGstin());
        }
        if (updateRequest.getUserType() != null) {
            user.setUserType(updateRequest.getUserType());
        }
        
        userService.updateProfile(user);
        UserDTO userDTO = new UserDTO(user.getId(), user.getName(), user.getPhone(), user.getEmail(), user.getRole().name(), user.isBlocked(), user.isCanEdit(), user.getCreatedAt(), user.getUpdatedAt(), false);
        return ResponseEntity.ok(userDTO);
    }

    @DeleteMapping("/profile")
    public ResponseEntity<?> deleteOwnAccount(Authentication authentication) {
        User user = userService.findByPhone(authentication.getName()).orElseThrow();
        userService.deleteUser(user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> listUsers() {
        List<UserDTO> users = userService.getAllUsers().stream()
                .map(user -> new UserDTO(user.getId(), user.getName(), user.getPhone(), user.getEmail(), user.getRole().name(), user.isBlocked(), user.isCanEdit(), user.getCreatedAt(), user.getUpdatedAt(), false))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping("/block/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> blockUser(@PathVariable Long id, @RequestParam boolean blocked) {
        userService.blockUser(id, blocked);
        return ResponseEntity.ok(new MessageResponse("User block status updated."));
    }

    @PostMapping("/role/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> assignRole(@PathVariable Long id, @RequestParam String role) {
        userService.assignRole(id, User.Role.valueOf(role));
        return ResponseEntity.ok(new MessageResponse("User role updated."));
    }

    @PostMapping("/can-edit/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> updateCanEdit(@PathVariable Long id, @RequestParam boolean canEdit) {
        userService.updateCanEdit(id, canEdit);
        return ResponseEntity.ok(new MessageResponse("User edit permission updated."));
    }

    @GetMapping("/can-edit")
    public ResponseEntity<Map<String, Boolean>> checkCanEdit(Authentication authentication) {
        User user = userService.findByPhone(authentication.getName()).orElseThrow();
        Map<String, Boolean> response = new java.util.HashMap<>();
        response.put("canEdit", user.isCanEdit());
        return ResponseEntity.ok(response);
    }
} 