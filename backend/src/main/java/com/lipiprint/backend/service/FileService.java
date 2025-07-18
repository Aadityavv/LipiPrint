package com.lipiprint.backend.service;

import com.lipiprint.backend.entity.File;
import com.lipiprint.backend.repository.FileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import com.lipiprint.backend.entity.User;
import org.apache.pdfbox.pdmodel.PDDocument;
import java.io.InputStream;
import com.google.cloud.storage.Bucket;
import com.google.cloud.storage.Blob;
import com.google.firebase.cloud.StorageClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import com.lipiprint.backend.entity.PrintJob;
import com.lipiprint.backend.entity.Order;

@Service
public class FileService {
    private static final Logger logger = LoggerFactory.getLogger(FileService.class);
    @Autowired
    private FileRepository fileRepository;
    @Autowired
    private PrintJobService printJobService;

    public File save(File file) {
        return fileRepository.save(file);
    }

    public Optional<File> findById(Long id) {
        return fileRepository.findById(id);
    }

    public List<File> findAll() {
        return fileRepository.findAll();
    }

    public void deleteById(Long id) {
        fileRepository.deleteById(id);
    }

    // Delete file from Firebase Storage and DB
    public void deleteFileAndFromFirebase(Long id) {
        File file = fileRepository.findById(id).orElseThrow();
        // Delete from Firebase Storage
        try {
            Bucket bucket = StorageClient.getInstance().bucket();
            Blob blob = bucket.get(file.getFilename());
            if (blob != null) {
                blob.delete();
            }
        } catch (Exception e) {
            logger.error("Failed to delete file from Firebase Storage", e);
        }
        // Delete from DB
        fileRepository.delete(file);
    }

    // Delete file from Firebase Storage only (not from DB)
    public void deleteFileFromFirebaseOnly(Long id) {
        File file = fileRepository.findById(id).orElseThrow();
        logger.info("Attempting to delete file from Firebase: {}", file.getFilename());
        
        // Delete from Firebase Storage
        try {
            Bucket bucket = StorageClient.getInstance().bucket();
            logger.info("Firebase bucket name: {}", bucket.getName());
            
            Blob blob = bucket.get(file.getFilename());
            if (blob != null) {
                logger.info("Found blob in Firebase: {}", blob.getName());
                boolean deleted = blob.delete();
                logger.info("Blob deletion result: {}", deleted);
            } else {
                logger.warn("Blob not found in Firebase for filename: {}", file.getFilename());
            }
        } catch (Exception e) {
            logger.error("Failed to delete file from Firebase Storage: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete file from Firebase Storage", e);
        }
        
        file.setDeleted(true);
        fileRepository.save(file);
        logger.info("Firebase deletion completed for file ID: {}", id);
    }

    public File saveUploadedFile(MultipartFile file, User user) {
        try {
            File entity = new File();
            
            // Create unique filename for Firebase
            String originalFilename = file.getOriginalFilename();
            String uniqueFilename = System.currentTimeMillis() + "_" + originalFilename;
            
            entity.setFilename(uniqueFilename); // Store unique filename in DB
            entity.setOriginalFilename(originalFilename);
            entity.setContentType(file.getContentType());
            entity.setSize(file.getSize());
            entity.setUploadedBy(user);

            // Upload to Firebase Storage with unique filename
            Bucket bucket = StorageClient.getInstance().bucket();
            Blob blob = bucket.create(uniqueFilename, file.getInputStream(), file.getContentType());
            String encodedFileName = URLEncoder.encode(uniqueFilename, StandardCharsets.UTF_8.toString());
            String fileUrl = String.format(
                "https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media",
                bucket.getName(),
                encodedFileName
            );
            entity.setUrl(fileUrl);

            // Detect number of pages for PDF
            if (file.getContentType() != null && file.getContentType().equalsIgnoreCase("application/pdf")) {
                try (InputStream is = file.getInputStream(); PDDocument doc = PDDocument.load(is)) {
                    entity.setPages(doc.getNumberOfPages());
                } catch (Exception e) {
                    entity.setPages(null); // Could not determine
                }
            } else {
                entity.setPages(null);
            }
            // Fallback: if pages is still null or less than 1, set to 1
            if (entity.getPages() == null || entity.getPages() < 1) {
                entity.setPages(1);
            }

            return fileRepository.save(entity);
        } catch (Exception e) {
            logger.error("Failed to store file", e);
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public File saveUploadedFileWithPrintOptions(MultipartFile file, User user, String color, String paper, String quality, String side, String binding) {
        // Save the file as before
        File savedFile = saveUploadedFile(file, user);
        // Create a PrintJob with the provided options and link to the file and user
        try {
            PrintJob printJob = new PrintJob();
            printJob.setFile(savedFile);
            printJob.setUser(user);
            printJob.setStatus(PrintJob.Status.QUEUED);
            // Store print options as JSON string
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> opts = new java.util.HashMap<>();
            if (color != null) opts.put("color", color);
            if (paper != null) opts.put("paper", paper);
            if (quality != null) opts.put("quality", quality);
            if (side != null) opts.put("side", side);
            if (binding != null) opts.put("binding", binding);
            printJob.setOptions(mapper.writeValueAsString(opts));
            printJobService.save(printJob);
        } catch (Exception e) {
            logger.error("Failed to create PrintJob with print options", e);
        }
        return savedFile;
    }

    public Resource loadFileAsResource(Long fileId) {
        File file = fileRepository.findById(fileId).orElseThrow(() -> new RuntimeException("File not found"));
        // Return a dummy resource for now
        return new ByteArrayResource(new byte[0]);
    }

    public List<File> findByUser(User user) {
        return fileRepository.findByUploadedBy(user);
    }

    public List<File> findDeliveredFiles() {
        List<PrintJob> printJobs = printJobService.findAll();
        java.util.Set<File> result = new java.util.HashSet<>();
        for (PrintJob pj : printJobs) {
            if (pj.getOrder() != null &&
                pj.getOrder().getStatus() == Order.Status.DELIVERED &&
                pj.getFile() != null &&
                !pj.getFile().isDeleted()) {
                result.add(pj.getFile());
            }
        }
        return new java.util.ArrayList<>(result);
    }
} 