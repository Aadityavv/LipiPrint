package com.lipiprint.backend.dto;

import org.springframework.web.multipart.MultipartFile;
import lombok.Data;

@Data
public class FileUploadRequest {
    private MultipartFile file;
} 