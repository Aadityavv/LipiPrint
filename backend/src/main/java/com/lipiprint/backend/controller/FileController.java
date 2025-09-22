package com.lipiprint.backend.controller;

import com.lipiprint.backend.dto.FileDTO;
import com.lipiprint.backend.entity.File;
import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.service.FileService;
import com.lipiprint.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import com.lipiprint.backend.dto.UserDTO;
import org.springframework.core.io.ClassPathResource;
import java.io.IOException;

@RestController
@RequestMapping("/api/files")
public class FileController {
    @Autowired
    private FileService fileService;
    @Autowired
    private UserService userService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "color", required = false) String color,
        @RequestParam(value = "paper", required = false) String paper,
        @RequestParam(value = "quality", required = false) String quality,
        @RequestParam(value = "side", required = false) String side,
        @RequestParam(value = "binding", required = false) String binding,
        Authentication authentication) {
        User user = userService.findByPhone(authentication.getName()).orElseThrow();
        // File validation
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded."));
        }
        String originalFilename = file.getOriginalFilename();
        long maxSize = 50 * 1024 * 1024; // 50MB
        String[] allowedTypes = {"pdf", "doc", "docx", "txt", "jpg", "jpeg", "png"};
        boolean allowed = false;
        if (originalFilename != null) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
            for (String t : allowedTypes) {
                if (ext.equals(t)) { allowed = true; break; }
            }
        }
        if (!allowed) {
            return ResponseEntity.badRequest().body(Map.of("error", "File type not allowed. Allowed: pdf, doc, docx, txt, jpg, jpeg, png."));
        }
        if (file.getSize() > maxSize) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 50MB limit."));
        }
        try {
            // Save file and print options
            File savedFile = fileService.saveUploadedFileWithPrintOptions(file, user, color, paper, quality, side, binding);
            FileDTO fileDTO = new FileDTO(savedFile.getId(), savedFile.getFilename(), savedFile.getOriginalFilename(), savedFile.getContentType(), savedFile.getSize(), savedFile.getUrl(), null, savedFile.getCreatedAt(), savedFile.getUpdatedAt(), savedFile.getPages());
            return ResponseEntity.ok(fileDTO);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    @GetMapping("")
    public ResponseEntity<List<FileDTO>> listFiles(Authentication authentication) {
        User user = userService.findByPhone(authentication.getName()).orElseThrow();
        List<FileDTO> files = fileService.findByUser(user).stream()
                .map(f -> new FileDTO(f.getId(), f.getFilename(), f.getOriginalFilename(), f.getContentType(), f.getSize(), f.getUrl(), null, f.getCreatedAt(), f.getUpdatedAt(), f.getPages()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(files);
    }

    @GetMapping("/admin")
    public ResponseEntity<List<FileDTO>> listAllFiles(Authentication authentication) {
        // Check if user is admin
        User user = userService.findByPhone(authentication.getName()).orElseThrow();
        if (user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        List<FileDTO> files = fileService.findAll().stream()
                .map(f -> new FileDTO(f.getId(), f.getFilename(), f.getOriginalFilename(), f.getContentType(), f.getSize(), f.getUrl(), 
                    f.getUploadedBy() != null ? new UserDTO(f.getUploadedBy().getId(), f.getUploadedBy().getName(), f.getUploadedBy().getPhone(), f.getUploadedBy().getEmail(), f.getUploadedBy().getRole() != null ? f.getUploadedBy().getRole().name() : null, f.getUploadedBy().isBlocked(), f.getUploadedBy().getCreatedAt(), f.getUploadedBy().getUpdatedAt(), false) : null, 
                    f.getCreatedAt(), f.getUpdatedAt(), f.getPages()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(files);
    }

    @GetMapping("/admin/delivered")
    public ResponseEntity<List<FileDTO>> listDeliveredFiles(Authentication authentication) {
        User user = userService.findByPhone(authentication.getName()).orElseThrow();
        if (user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<FileDTO> files = fileService.findDeliveredFiles().stream()
                .map(f -> new FileDTO(f.getId(), f.getFilename(), f.getOriginalFilename(), f.getContentType(), f.getSize(), f.getUrl(),
                    f.getUploadedBy() != null ? new UserDTO(f.getUploadedBy().getId(), f.getUploadedBy().getName(), f.getUploadedBy().getPhone(), f.getUploadedBy().getEmail(), f.getUploadedBy().getRole() != null ? f.getUploadedBy().getRole().name() : null, f.getUploadedBy().isBlocked(), f.getUploadedBy().getCreatedAt(), f.getUploadedBy().getUpdatedAt(), false) : null,
                    f.getCreatedAt(), f.getUpdatedAt(), f.getPages()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(files);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        // File download logic should be implemented in FileService
        Resource resource = fileService.loadFileAsResource(id);
        File file = fileService.findById(id).orElseThrow();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getOriginalFilename() + "\"")
                .body(resource);
    }

    @GetMapping("/logo")
    public ResponseEntity<Resource> getLogo() throws IOException {
        ClassPathResource imgFile = new ClassPathResource("LipiPrintLogo.png");
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(imgFile);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable Long id) {
        try {
            fileService.deleteFileAndFromFirebase(id);
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "Cannot delete file: it is used in a print job."));
        }
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> deleteFileFromFirebaseOnly(@PathVariable Long id, Authentication authentication) {
        // Check if user is admin
        User user = userService.findByPhone(authentication.getName()).orElseThrow();
        if (user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            fileService.deleteFileFromFirebaseOnly(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to delete file from Firebase."));
        }
    }
}