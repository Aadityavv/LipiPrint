package com.lipiprint.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.HashMap;
import java.util.Random;

@Service
public class EmailOtpService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailOtpService.class);
    
    @Autowired
    private JavaMailSender mailSender;
    
    // In-memory storage for OTPs (in production, use Redis or database)
    private static final Map<String, String> EMAIL_OTP_MAP = new HashMap<>();
    private static final Map<String, Long> OTP_TIMESTAMP_MAP = new HashMap<>();
    private static final long OTP_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes
    
    /**
     * Generate and store OTP for email
     */
    public String generateOtp(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }
        
        String cleanedEmail = email.trim().toLowerCase();
        String otp = generateRandomOtp();
        
        // Store OTP with timestamp
        EMAIL_OTP_MAP.put(cleanedEmail, otp);
        OTP_TIMESTAMP_MAP.put(cleanedEmail, System.currentTimeMillis());
        
        logger.info("✅ OTP generated for email: {} (OTP: {})", cleanedEmail, otp);
        
        // Send actual email
        try {
            sendOtpEmail(cleanedEmail, otp);
            logger.info("📧 Email sent successfully to: {}", cleanedEmail);
        } catch (Exception e) {
            logger.error("❌ Failed to send email to {}: {}", cleanedEmail, e.getMessage());
            // Still return OTP for testing purposes
            logger.info("📧 [FALLBACK] OTP for {}: {}", cleanedEmail, otp);
        }
        
        return otp;
    }
    
    /**
     * Verify OTP for email
     */
    public boolean verifyOtp(String email, String otp) {
        if (email == null || otp == null) {
            return false;
        }
        
        String cleanedEmail = email.trim().toLowerCase();
        
        // Check if OTP exists
        if (!EMAIL_OTP_MAP.containsKey(cleanedEmail)) {
            logger.warn("❌ No OTP found for email: {}", cleanedEmail);
            return false;
        }
        
        // Check if OTP has expired
        Long timestamp = OTP_TIMESTAMP_MAP.get(cleanedEmail);
        if (timestamp == null || (System.currentTimeMillis() - timestamp) > OTP_EXPIRY_TIME) {
            logger.warn("❌ OTP expired for email: {}", cleanedEmail);
            // Clean up expired OTP
            EMAIL_OTP_MAP.remove(cleanedEmail);
            OTP_TIMESTAMP_MAP.remove(cleanedEmail);
            return false;
        }
        
        // Verify OTP
        boolean isValid = EMAIL_OTP_MAP.get(cleanedEmail).equals(otp);
        
        if (isValid) {
            logger.info("✅ OTP verification successful for email: {}", cleanedEmail);
            // Clean up used OTP
            EMAIL_OTP_MAP.remove(cleanedEmail);
            OTP_TIMESTAMP_MAP.remove(cleanedEmail);
        } else {
            logger.warn("❌ OTP verification failed for email: {}", cleanedEmail);
        }
        
        return isValid;
    }
    
    /**
     * Generate random 6-digit OTP
     */
    private String generateRandomOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000); // 6-digit number
        return String.valueOf(otp);
    }
    
    /**
     * Clean up expired OTPs (can be called periodically)
     */
    public void cleanupExpiredOtps() {
        long currentTime = System.currentTimeMillis();
        EMAIL_OTP_MAP.entrySet().removeIf(entry -> {
            String email = entry.getKey();
            Long timestamp = OTP_TIMESTAMP_MAP.get(email);
            if (timestamp == null || (currentTime - timestamp) > OTP_EXPIRY_TIME) {
                OTP_TIMESTAMP_MAP.remove(email);
                return true;
            }
            return false;
        });
    }
    
    /**
     * Send OTP email
     */
    private void sendOtpEmail(String email, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("LipiPrint - Password Reset OTP");
            message.setText(
                "Hello,\n\n" +
                "You requested a password reset for your LipiPrint account.\n\n" +
                "Your OTP is: " + otp + "\n\n" +
                "This OTP is valid for 5 minutes.\n\n" +
                "If you didn't request this, please ignore this email.\n\n" +
                "Best regards,\n" +
                "LipiPrint Team"
            );
            
            mailSender.send(message);
        } catch (Exception e) {
            logger.error("Failed to send email: {}", e.getMessage());
            throw e;
        }
    }
}