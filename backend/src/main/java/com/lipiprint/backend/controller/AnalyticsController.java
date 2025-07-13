package com.lipiprint.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import com.lipiprint.backend.service.OrderService;
import com.lipiprint.backend.service.UserService;
import com.lipiprint.backend.entity.Order;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    @Autowired
    private OrderService orderService;
    @Autowired
    private UserService userService;

    @GetMapping("/{type}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAnalytics(@PathVariable String type) {
        Map<String, Object> data = new HashMap<>();
        data.put("type", type);
        switch (type) {
            case "orders":
                data.put("value", orderService.getTotalOrderCount());
                break;
            case "pendingOrders":
                data.put("value", orderService.getPendingOrderCount());
                break;
            case "users":
                data.put("value", userService.getActiveUserCount());
                break;
            case "revenue":
                data.put("value", orderService.getTotalRevenue());
                break;
            default:
                data.put("value", 0);
        }
        return ResponseEntity.ok(data);
    }

    @GetMapping("/recent-activities")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getRecentActivities() {
        // In a real app, aggregate from orders, users, payments, etc.
        // For now, use the 10 most recent orders as activities
        var activities = orderService.findAll().stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .limit(10)
            .map(Order::toActivityMap)
            .toList();
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/trends/orders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getOrderTrends() {
        return ResponseEntity.ok(orderService.getOrderTrendsLast7Days());
    }

    @GetMapping("/trends/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getRevenueTrends() {
        return ResponseEntity.ok(orderService.getRevenueTrendsLast7Days());
    }
} 