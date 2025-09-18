package com.lipiprint.backend.service;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class Msg91Service {
    
    private static final Logger logger = LoggerFactory.getLogger(Msg91Service.class);
    
    @Value("${msg91.api.key}")
    private String apiKey;
    
    @Value("${msg91.sender.id:MSGIND}")
    private String senderId;
    
    @Value("${msg91.otp.template.id:}")
    private String otpTemplateId;
    
    @Value("${msg91.enabled:true}")
    private boolean msg91Enabled;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    // MSG91 SendOTP API endpoints
    private static final String SEND_OTP_URL = "https://api.msg91.com/api/sendotp.php";
    private static final String VERIFY_OTP_URL = "https://api.msg91.com/api/verifyRequestOTP.php";
    private static final String RESEND_OTP_URL = "https://api.msg91.com/api/retryotp.php";
    
    /**
     * Send OTP using MSG91 SendOTP API
     */
    public OtpResult sendOtp(String phoneNumber) {
        if (!msg91Enabled) {
            logger.warn("📱 MSG91 is disabled in configuration");
            return new OtpResult(false, "MSG91 service is disabled");
        }
        
        try {
            String cleanPhone = cleanPhoneNumber(phoneNumber);
            logger.info("📱 Sending OTP to: {}", maskPhoneNumber(cleanPhone));
            
            String url = UriComponentsBuilder.fromHttpUrl(SEND_OTP_URL)
                .queryParam("authkey", apiKey)
                .queryParam("mobile", cleanPhone)
                .queryParam("sender", senderId)
                .queryParam("otp_expiry", "5") // 5 minutes expiry
                .queryParam("template_id", otpTemplateId != null && !otpTemplateId.isEmpty() ? otpTemplateId : "")
                .build()
                .toString();
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                String responseBody = response.getBody();
                
                if (responseBody != null) {
                    // Parse JSON response
                    try {
                        JSONObject jsonResponse = new JSONObject(responseBody);
                        String type = jsonResponse.optString("type");
                        String message = jsonResponse.optString("message");
                        
                        if ("success".equals(type)) {
                            logger.info("✅ OTP sent successfully to: {}", maskPhoneNumber(cleanPhone));
                            return new OtpResult(true, "OTP sent successfully");
                        } else {
                            logger.error("❌ MSG91 SendOTP failed: {}", message);
                            return new OtpResult(false, "Failed to send OTP: " + message);
                        }
                    } catch (Exception e) {
                        // Handle non-JSON response (old API format)
                        if (responseBody.contains("Message sent successfully")) {
                            logger.info("✅ OTP sent successfully to: {}", maskPhoneNumber(cleanPhone));
                            return new OtpResult(true, "OTP sent successfully");
                        } else {
                            logger.error("❌ MSG91 SendOTP error: {}", responseBody);
                            return new OtpResult(false, "Failed to send OTP");
                        }
                    }
                } else {
                    return new OtpResult(false, "Empty response from MSG91");
                }
            } else {
                logger.error("❌ HTTP error sending OTP. Status: {}", response.getStatusCode());
                return new OtpResult(false, "HTTP error: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("❌ Exception sending OTP: {}", e.getMessage());
            return new OtpResult(false, "Error sending OTP: " + e.getMessage());
        }
    }
    
    /**
     * Verify OTP using MSG91 VerifyOTP API
     */
    public OtpVerificationResult verifyOtp(String phoneNumber, String otp) {
        if (!msg91Enabled) {
            return new OtpVerificationResult(false, "MSG91 service is disabled");
        }
        
        try {
            String cleanPhone = cleanPhoneNumber(phoneNumber);
            logger.info("🔍 Verifying OTP for: {}", maskPhoneNumber(cleanPhone));
            
            String url = UriComponentsBuilder.fromHttpUrl(VERIFY_OTP_URL)
                .queryParam("authkey", apiKey)
                .queryParam("mobile", cleanPhone)
                .queryParam("otp", otp)
                .build()
                .toString();
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                String responseBody = response.getBody();
                
                if (responseBody != null) {
                    try {
                        JSONObject jsonResponse = new JSONObject(responseBody);
                        String type = jsonResponse.optString("type");
                        String message = jsonResponse.optString("message");
                        
                        if ("success".equals(type)) {
                            logger.info("✅ OTP verified successfully for: {}", maskPhoneNumber(cleanPhone));
                            return new OtpVerificationResult(true, "OTP verified successfully");
                        } else {
                            logger.warn("❌ OTP verification failed for {}: {}", maskPhoneNumber(cleanPhone), message);
                            return new OtpVerificationResult(false, message);
                        }
                    } catch (Exception e) {
                        // Handle non-JSON response
                        if (responseBody.toLowerCase().contains("verified")) {
                            logger.info("✅ OTP verified successfully for: {}", maskPhoneNumber(cleanPhone));
                            return new OtpVerificationResult(true, "OTP verified successfully");
                        } else {
                            logger.warn("❌ OTP verification failed: {}", responseBody);
                            return new OtpVerificationResult(false, "Invalid OTP");
                        }
                    }
                } else {
                    return new OtpVerificationResult(false, "Empty response from MSG91");
                }
            } else {
                logger.error("❌ HTTP error verifying OTP. Status: {}", response.getStatusCode());
                return new OtpVerificationResult(false, "HTTP error: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("❌ Exception verifying OTP: {}", e.getMessage());
            return new OtpVerificationResult(false, "Error verifying OTP");
        }
    }
    
    /**
     * Resend OTP using MSG91 ResendOTP API
     */
    public OtpResult resendOtp(String phoneNumber, String retryType) {
        if (!msg91Enabled) {
            return new OtpResult(false, "MSG91 service is disabled");
        }
        
        try {
            String cleanPhone = cleanPhoneNumber(phoneNumber);
            logger.info("🔄 Resending OTP to: {} via {}", maskPhoneNumber(cleanPhone), retryType);
            
            String url = UriComponentsBuilder.fromHttpUrl(RESEND_OTP_URL)
                .queryParam("authkey", apiKey)
                .queryParam("mobile", cleanPhone)
                .queryParam("retrytype", retryType) // "text" for SMS, "voice" for voice call
                .build()
                .toString();
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                String responseBody = response.getBody();
                
                if (responseBody != null) {
                    try {
                        JSONObject jsonResponse = new JSONObject(responseBody);
                        String type = jsonResponse.optString("type");
                        String message = jsonResponse.optString("message");
                        
                        if ("success".equals(type)) {
                            logger.info("✅ OTP resent successfully to: {} via {}", maskPhoneNumber(cleanPhone), retryType);
                            return new OtpResult(true, "OTP resent successfully");
                        } else {
                            logger.error("❌ MSG91 ResendOTP failed: {}", message);
                            return new OtpResult(false, "Failed to resend OTP: " + message);
                        }
                    } catch (Exception e) {
                        // Handle non-JSON response
                        if (responseBody.contains("Message sent successfully")) {
                            logger.info("✅ OTP resent successfully to: {}", maskPhoneNumber(cleanPhone));
                            return new OtpResult(true, "OTP resent successfully");
                        } else {
                            logger.error("❌ MSG91 ResendOTP error: {}", responseBody);
                            return new OtpResult(false, "Failed to resend OTP");
                        }
                    }
                } else {
                    return new OtpResult(false, "Empty response from MSG91");
                }
            } else {
                logger.error("❌ HTTP error resending OTP. Status: {}", response.getStatusCode());
                return new OtpResult(false, "HTTP error: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("❌ Exception resending OTP: {}", e.getMessage());
            return new OtpResult(false, "Error resending OTP: " + e.getMessage());
        }
    }
    
    /**
     * Resend OTP via SMS (default)
     */
    public OtpResult resendOtp(String phoneNumber) {
        return resendOtp(phoneNumber, "text");
    }
    
    /**
     * Resend OTP via Voice call
     */
    public OtpResult resendOtpViaVoice(String phoneNumber) {
        return resendOtp(phoneNumber, "voice");
    }
    
    /**
     * Send regular SMS (non-OTP)
     */
    public boolean sendSms(String phoneNumber, String message) {
        if (!msg91Enabled) {
            return false;
        }
        
        try {
            String cleanPhone = cleanPhoneNumber(phoneNumber);
            
            String url = UriComponentsBuilder.fromHttpUrl("http://api.msg91.com/api/sendhttp.php")
                .queryParam("authkey", apiKey)
                .queryParam("mobiles", cleanPhone)
                .queryParam("message", message)
                .queryParam("sender", senderId)
                .queryParam("route", "default")
                .build()
                .toString();
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                String responseBody = response.getBody();
                if (responseBody != null && !responseBody.toLowerCase().contains("error")) {
                    logger.info("✅ SMS sent successfully to: {}", maskPhoneNumber(cleanPhone));
                    return true;
                } else {
                    logger.error("❌ SMS sending failed: {}", responseBody);
                    return false;
                }
            } else {
                logger.error("❌ HTTP error sending SMS. Status: {}", response.getStatusCode());
                return false;
            }
            
        } catch (Exception e) {
            logger.error("❌ Exception sending SMS: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Send order notification
     */
    public boolean sendOrderNotification(String phoneNumber, String orderNumber, String status) {
        if (!msg91Enabled) {
            return false;
        }
        
        String message = String.format(
            "Your LipiPrint order #%s is now %s. Track your order in the app. Thank you!",
            orderNumber, status.toUpperCase()
        );
        
        return sendSms(phoneNumber, message);
    }
    
    /**
     * Send promotional message
     */
    public boolean sendPromotionalMessage(String phoneNumber, String message) {
        return sendSms(phoneNumber, message);
    }
    
    /**
     * Clean and format phone number for Indian numbers
     */
    private String cleanPhoneNumber(String phoneNumber) {
        if (phoneNumber == null) return null;
        
        // Remove all non-digit characters
        String cleaned = phoneNumber.replaceAll("[^\\d]", "");
        
        // Handle Indian phone numbers
        if (cleaned.length() == 10) {
            // Add country code for India
            return "91" + cleaned;
        } else if (cleaned.length() == 12 && cleaned.startsWith("91")) {
            // Already has country code
            return cleaned;
        } else if (cleaned.length() == 13 && cleaned.startsWith("091")) {
            // Remove leading 0
            return cleaned.substring(1);
        }
        
        return cleaned;
    }
    
    /**
     * Mask phone number for logging privacy
     */
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return "****";
        }
        
        int visibleDigits = 2;
        String visible = phoneNumber.substring(phoneNumber.length() - visibleDigits);
        String masked = "*".repeat(phoneNumber.length() - visibleDigits);
        
        return masked + visible;
    }
    
    /**
     * Check if MSG91 is enabled
     */
    public boolean isEnabled() {
        return msg91Enabled;
    }
    
    // Response classes
    public static class OtpResult {
        private final boolean success;
        private final String message;
        
        public OtpResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }
        
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
    
    public static class OtpVerificationResult {
        private final boolean success;
        private final String message;
        
        public OtpVerificationResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }
        
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
}
