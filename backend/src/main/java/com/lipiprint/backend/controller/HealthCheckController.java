package com.lipiprint.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/health")
public class HealthCheckController {
    private static final Logger logger = LoggerFactory.getLogger(HealthCheckController.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${server.port:8082}")
    private int serverPort;

    // Used to prevent infinite recursion
    private static boolean isPrimaryScheduled = false;
    private static boolean isSecondaryScheduled = false;

    @GetMapping("/primary")
    public ResponseEntity<String> primaryHealth() {
        logger.info("[HealthCheck] Primary health endpoint called.");
        return ResponseEntity.ok("Primary health OK");
    }

    @GetMapping("/secondary")
    public ResponseEntity<String> secondaryHealth() {
        logger.info("[HealthCheck] Secondary health endpoint called.");
        return ResponseEntity.ok("Secondary health OK");
    }

    // Every 2 minutes, primary calls secondary
    @Scheduled(fixedRate = 120000, initialDelay = 10000)
    public void callSecondaryFromPrimary() {
        if (isPrimaryScheduled) return;
        isPrimaryScheduled = true;
        try {
            String url = "https://lipiprint-freelance.onrender.com/api/health/secondary";
            String response = restTemplate.getForObject(url, String.class);
            logger.info("[HealthCheck] Primary called Secondary: {}", response);
        } catch (Exception e) {
            logger.error("[HealthCheck] Error calling secondary: ", e);
        } finally {
            isPrimaryScheduled = false;
        }
    }

    // Every 2 minutes, secondary calls primary (staggered by 1 minute)
    @Scheduled(fixedRate = 120000, initialDelay = 70000)
    public void callPrimaryFromSecondary() {
        if (isSecondaryScheduled) return;
        isSecondaryScheduled = true;
        try {
            String url = "https://lipiprint-freelance.onrender.com/api/health/primary";
            String response = restTemplate.getForObject(url, String.class);
            logger.info("[HealthCheck] Secondary called Primary: {}", response);
        } catch (Exception e) {
            logger.error("[HealthCheck] Error calling primary: ", e);
        } finally {
            isSecondaryScheduled = false;
        }
    }
} 