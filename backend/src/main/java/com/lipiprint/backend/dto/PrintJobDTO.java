package com.lipiprint.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrintJobDTO {
    private Long id;
    private FileDTO file;
    private UserDTO user;
    private String status;
    private String options;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 