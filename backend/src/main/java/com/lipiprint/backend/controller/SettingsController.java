package com.lipiprint.backend.controller;

import com.lipiprint.backend.dto.SettingsDTO;
import com.lipiprint.backend.entity.Settings;
import com.lipiprint.backend.service.SettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    @Autowired
    private SettingsService settingsService;

    @GetMapping("")
    public ResponseEntity<List<SettingsDTO>> getSettings() {
        List<SettingsDTO> settings = settingsService.findAll().stream()
                .map(s -> new SettingsDTO(s.getId(), null, s.getKey(), s.getValue(), s.getCreatedAt(), s.getUpdatedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(settings);
    }

    @PostMapping("")
    public ResponseEntity<SettingsDTO> updateSettings(@RequestBody Settings settings) {
        Settings saved = settingsService.save(settings);
        SettingsDTO dto = new SettingsDTO(saved.getId(), null, saved.getKey(), saved.getValue(), saved.getCreatedAt(), saved.getUpdatedAt());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/accepting-orders")
    public ResponseEntity<?> getAcceptingOrders() {
        boolean accepting = settingsService.isAcceptingOrders();
        return ResponseEntity.ok(java.util.Map.of("acceptingOrders", accepting));
    }

    @PutMapping("/accepting-orders")
    public ResponseEntity<?> setAcceptingOrders(@RequestParam boolean accepting) {
        settingsService.setAcceptingOrders(accepting);
        return ResponseEntity.ok(java.util.Map.of("acceptingOrders", accepting));
    }
} 