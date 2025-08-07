package com.lipiprint.backend.controller;

import com.lipiprint.backend.dto.TrackingResponse;
import com.lipiprint.backend.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shipping")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ShippingController {
    
    private static final Logger logger = LoggerFactory.getLogger(ShippingController.class);
    
    @Autowired
    private OrderService orderService;
    
    @GetMapping("/track/{orderId}")
    public ResponseEntity<?> trackOrder(@PathVariable Long orderId) {
        try {
            TrackingResponse tracking = orderService.getOrderTracking(orderId);
            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            logger.error("Failed to track order {}: {}", orderId, e.getMessage());
            return ResponseEntity.badRequest().body("Tracking failed: " + e.getMessage());
        }
    }
    
    @GetMapping("/track/awb/{awbNumber}")
    public ResponseEntity<?> trackByAwb(@PathVariable String awbNumber) {
        try {
            TrackingResponse tracking = orderService.getTrackingByAwb(awbNumber);
            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            logger.error("Failed to track AWB {}: {}", awbNumber, e.getMessage());
            return ResponseEntity.badRequest().body("Tracking failed: " + e.getMessage());
        }
    }
}
