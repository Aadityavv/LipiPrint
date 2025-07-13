package com.lipiprint.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SettingsDTO {
    private Long id;
    private UserDTO user;
    private String key;
    private String value;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 