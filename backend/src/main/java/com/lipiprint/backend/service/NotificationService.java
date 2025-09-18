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
     * Send order status notification to database
     */
    public void sendOrderNotification(Long userId, String orderNumber, String status, String phoneNumber) {
        try {
            // Save to database
            Notification notification = new Notification();
            // Note: We need to set the user through the user relationship, not directly set userId
            // For now, we'll just save the message without user association
            notification.setMessage(String.format("Your order #%s is now %s", orderNumber, status));
            notification.setCreatedAt(java.time.LocalDateTime.now());
            save(notification);
            
            logger.info("✅ Order notification saved to database for order: {}", orderNumber);
            
        } catch (Exception e) {
            logger.error("❌ Failed to send order notification: {}", e.getMessage());
        }
    }

    /**
     * Send welcome message to new users (database only)
     */
    public void sendWelcomeMessage(String phoneNumber, String userName) {
        try {
            String message = String.format(
                "Welcome to LipiPrint, %s! Get your documents printed and delivered right to your doorstep. Start printing now!",
                userName != null ? userName : "User"
            );
            
            // Save welcome message to database
            Notification notification = new Notification();
            notification.setMessage(message);
            notification.setCreatedAt(java.time.LocalDateTime.now());
            save(notification);
            
            logger.info("✅ Welcome message saved to database for user: {}", phoneNumber);
            
        } catch (Exception e) {
            logger.error("❌ Failed to send welcome message: {}", e.getMessage());
        }
    }

    /**
     * Send promotional message (database only)
     */
    public boolean sendPromotionalMessage(String phoneNumber, String message) {
        try {
            // Save promotional message to database
            Notification notification = new Notification();
            notification.setMessage(message);
            notification.setCreatedAt(java.time.LocalDateTime.now());
            save(notification);
            
            logger.info("✅ Promotional message saved to database for: {}", phoneNumber);
            return true;
        } catch (Exception e) {
            logger.error("❌ Failed to send promotional message: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Send bulk promotional messages (database only)
     */
    public void sendBulkPromotionalMessage(List<String> phoneNumbers, String message) {
        for (String phoneNumber : phoneNumbers) {
            try {
                sendPromotionalMessage(phoneNumber, message);
                // Add small delay to avoid overwhelming the database
                Thread.sleep(100);
            } catch (Exception e) {
                logger.error("❌ Failed to send bulk promotional message to: {}", phoneNumber);
            }
        }
    }
}
