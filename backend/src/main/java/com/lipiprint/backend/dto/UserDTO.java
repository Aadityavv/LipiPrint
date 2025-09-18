package com.lipiprint.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String name;
    private String phone;
    private String email;
    private String role;
    private boolean blocked;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isNewUser;
} 