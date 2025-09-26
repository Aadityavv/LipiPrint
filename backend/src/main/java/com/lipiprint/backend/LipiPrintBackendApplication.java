package com.lipiprint.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
@EnableScheduling // ✅ Enable scheduled tasks for automatic order status updates
public class LipiPrintBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(LipiPrintBackendApplication.class, args);
    }
        @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
} 