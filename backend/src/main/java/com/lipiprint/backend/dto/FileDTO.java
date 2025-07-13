package com.lipiprint.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileDTO {
    private Long id;
    private String filename;
    private String originalFilename;
    private String contentType;
    private Long size;
    private String url;
    private UserDTO uploadedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer pages;
} 