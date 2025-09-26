package com.lipiprint.backend.service;

import com.lipiprint.backend.dto.TrackingResponse;
import com.lipiprint.backend.entity.Order;
import com.lipiprint.backend.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * ✅ NEW: Service for automatic order status updates from NimbusPost
 * This service runs scheduled tasks to poll NimbusPost API and automatically 
 * update order statuses for "Out for delivery", "Delivered" etc.
 */
@Service
@ConditionalOnProperty(name = "nimbuspost.auto-tracking.enabled", havingValue = "true", matchIfMissing = true)
public class ScheduledStatusUpdateService {
    
    private static final Logger logger = LoggerFactory.getLogger(ScheduledStatusUpdateService.class);
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private NimbusPostService nimbusPostService;
    
    @Autowired
    private OrderService orderService;
    
    /**
     * ✅ SCHEDULED TASK: Run every 30 minutes to check for status updates
     * Checks all shipped orders and updates their status from NimbusPost API
     */
    @Scheduled(fixedRate = 1800000) // 30 minutes = 30 * 60 * 1000 ms
    public void updateShippedOrderStatuses() {
        try {
            logger.info("[ScheduledStatusUpdateService] Starting scheduled order status update check");
            
            // Get all orders that have AWB numbers (shipped orders)
            List<Order> shippedOrders = findAllShippedOrders();
            
            if (shippedOrders.isEmpty()) {
                logger.debug("[ScheduledStatusUpdateService] No shipped orders found to update");
                return;
            }
            
            logger.info("[ScheduledStatusUpdateService] Found {} shipped orders to check for status updates", 
                shippedOrders.size());
            
            int updatedCount = 0;
            for (Order order : shippedOrders) {
                try {
                    boolean wasUpdated = updateOrderStatusIfChanged(order);
                    if (wasUpdated) {
                        updatedCount++;
                        logger.info("[ScheduledStatusUpdateService] Updated order {} from NimbusPost API", order.getId());
                    }
                } catch (Exception e) {
                    logger.error("[ScheduledStatusUpdateService] Error updating order {}: {}", order.getId(), e.getMessage());
                    // Continue with other orders
                }
            }
            
            logger.info("[ScheduledStatusUpdateService] Completed status update check. Updated {} orders out of {} checked", 
                updatedCount, shippedOrders.size());
                
        } catch (Exception e) {
            logger.error("[ScheduledStatusUpdateService] Critical error in scheduled status update: {}", e.getMessage());
        }
    }
    
    /**
     * Get all orders that have AWB numbers and can be tracked
     */
    private List<Order> findAllShippedOrders() {
        return orderRepository.findAll().stream()
            .filter(this::isShippedOrder)
            .toList();
    }
    
    /**
     * Check if an order has been shipped (has AWB and shipping created)
     */
    private boolean isShippedOrder(Order order) {
        return order.getAwbNumber() != null && 
               !order.getAwbNumber().trim().isEmpty() && 
               Boolean.TRUE.equals(order.getShippingCreated());
    }
    
    /**
     * Update order status if it has changed in NimbusPost
     */
    private boolean updateOrderStatusIfChanged(Order order) {
        try {
            logger.debug("[ScheduledStatusUpdateService] Checking status for order {} with AWB: {}", 
                order.getId(), order.getAwbNumber());
            
            // Get latest status from NimbusPost API
            TrackingResponse trackingResponse = nimbusPostService.trackShipment(order.getAwbNumber());
            
            if (trackingResponse == null || !Boolean.TRUE.equals(trackingResponse.isStatus())) {
                logger.warn("[ScheduledStatusUpdateService] Failed to get tracking info for order {} AWB: {}", 
                    order.getId(), order.getAwbNumber());
                return false;
            }
            
            String nimbusStatus = trackingResponse.getCurrentStatus();
            String activity = trackingResponse.getTrackingData() != null && !trackingResponse.getTrackingData().isEmpty() 
                ? trackingResponse.getTrackingData().get(0).getActivity()
                : null;
            
            if (nimbusStatus == null) {
                logger.debug("[ScheduledStatusUpdateService] No status returned from NimbusPost for order {} AWB: {}", 
                    order.getId(), order.getAwbNumber());
                return false;
            }
            
            // Update using the service method (reuses existing logic)
            return orderService.updateOrderStatusFromNimbusPost(
                order.getAwbNumber(), 
                nimbusStatus, 
                activity, 
                trackingResponse.getLastLocation(), 
                trackingResponse.getTrackingData() != null && !trackingResponse.getTrackingData().isEmpty()
                    ? trackingResponse.getTrackingData().get(0).getDate()
                    : null
            );
            
        } catch (Exception e) {
            logger.error("[ScheduledStatusUpdateService] Error tracking order {} AWB: {} - Error: {}", 
                order.getId(), order.getAwbNumber(), e.getMessage());
            return false;
        }
    }
    
    /**
     * ✅ MANUAL: Manual trigger for testing status updates
     */
    public int updateAllShippedOrders() {
        logger.info("[ScheduledStatusUpdateService] Manual trigger: updating all shipped orders");
        updateShippedOrderStatuses();
        return findAllShippedOrders().size();
    }
    
    /**
     * ✅ MANUAL: Update specific order by ID
     */
    public boolean updateSpecificOrder(Long orderId) {
        logger.info("[ScheduledStatusUpdateService] Manual trigger: updating order {}", orderId);
        
        return orderRepository.findById(orderId)
            .filter(this::isShippedOrder)
            .map(order -> updateOrderStatusIfChanged(order))
            .orElse(false);
    }
}
