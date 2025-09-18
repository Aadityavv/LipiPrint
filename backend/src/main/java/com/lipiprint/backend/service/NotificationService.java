package com.lipiprint.backend.service;

import com.lipiprint.backend.entity.Notification;
import com.lipiprint.backend.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private Msg91Service msg91Service;

    public Notification save(Notification notification) {
        return notificationRepository.save(notification);
    }

    public Optional<Notification> findById(Long id) {
        return notificationRepository.findById(id);
    }

    public List<Notification> findAll() {
        return notificationRepository.findAll();
    }

    /**
     * Send order status notification via SMS and database
     */
    public void sendOrderNotification(Long userId, String orderNumber, String status, String phoneNumber) {
        try {
            // Save to database
            Notification notification = new Notification();
            notification.setUserId(userId);
            notification.setTitle("Order Update");
            notification.setMessage(String.format("Your order #%s is now %s", orderNumber, status));
            notification.setType("ORDER_UPDATE");
            notification.setCreatedAt(java.time.LocalDateTime.now());
            save(notification);
            
            // Send SMS notification
            if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
                boolean smsSent = msg91Service.sendOrderNotification(phoneNumber, orderNumber, status);
                if (smsSent) {
                    logger.info("✅ Order notification SMS sent for order: {}", orderNumber);
                } else {
                    logger.warn("⚠️ Failed to send order notification SMS for order: {}", orderNumber);
                }
            }
            
        } catch (Exception e) {
            logger.error("❌ Failed to send order notification: {}", e.getMessage());
        }
    }

    /**
     * Send welcome SMS to new users
     */
    public void sendWelcomeMessage(String phoneNumber, String userName) {
        try {
            String message = String.format(
                "Welcome to LipiPrint, %s! Get your documents printed and delivered right to your doorstep. Start printing now!",
                userName != null ? userName : "User"
            );
            
            boolean sent = msg91Service.sendSimpleSms(phoneNumber, message);
            if (sent) {
                logger.info("✅ Welcome SMS sent to new user: {}", phoneNumber);
            }
            
        } catch (Exception e) {
            logger.error("❌ Failed to send welcome SMS: {}", e.getMessage());
        }
    }

    /**
     * Send promotional message
     */
    public boolean sendPromotionalMessage(String phoneNumber, String message) {
        try {
            return msg91Service.sendPromotionalMessage(phoneNumber, message);
        } catch (Exception e) {
            logger.error("❌ Failed to send promotional message: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Send bulk promotional messages
     */
    public void sendBulkPromotionalMessage(List<String> phoneNumbers, String message) {
        for (String phoneNumber : phoneNumbers) {
            try {
                sendPromotionalMessage(phoneNumber, message);
                // Add small delay to avoid rate limiting
                Thread.sleep(100);
            } catch (Exception e) {
                logger.error("❌ Failed to send bulk promotional SMS to: {}", phoneNumber);
            }
        }
    }
}
