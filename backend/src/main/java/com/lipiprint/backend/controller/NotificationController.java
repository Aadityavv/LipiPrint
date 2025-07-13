package com.lipiprint.backend.controller;

import com.lipiprint.backend.dto.NotificationDTO;
import com.lipiprint.backend.entity.Notification;
import com.lipiprint.backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;

    @GetMapping("")
    public ResponseEntity<List<NotificationDTO>> listNotifications() {
        List<NotificationDTO> notifications = notificationService.findAll().stream()
                .map(n -> new NotificationDTO(n.getId(), null, n.getMessage(), n.isRead(), n.getCreatedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/read/{id}")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        Notification notification = notificationService.findById(id).orElseThrow();
        notification.setRead(true);
        notificationService.save(notification);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("")
    public ResponseEntity<Void> clearNotifications() {
        notificationService.findAll().forEach(n -> notificationService.save(n));
        return ResponseEntity.noContent().build();
    }
} 