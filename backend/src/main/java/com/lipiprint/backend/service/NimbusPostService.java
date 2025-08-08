package com.lipiprint.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lipiprint.backend.config.NimbusPostConfig;
import com.lipiprint.backend.dto.ShipmentRequest;
import com.lipiprint.backend.dto.ShipmentResponse;
import com.lipiprint.backend.dto.TrackingResponse;
import com.lipiprint.backend.entity.Order;
import com.lipiprint.backend.entity.UserAddress;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.annotation.PostConstruct;
import java.util.*;

@Service
public class NimbusPostService {
    
    private static final Logger logger = LoggerFactory.getLogger(NimbusPostService.class);
    
    @Autowired
    private NimbusPostConfig config;
    
    @Autowired
    private RestTemplate restTemplate;
    
    private String authToken;
    private ObjectMapper objectMapper = new ObjectMapper();
    
    @PostConstruct
    public void authenticate() {
        if (!config.isEnabled()) {
            logger.info("NimbusPost integration is disabled for LipiPrint Saharanpur");
            return;
        }
        
        try {
            String authUrl = config.getBaseUrl() + "/users/login";
            
            Map<String, String> authRequest = new HashMap<>();
            authRequest.put("email", config.getEmail());
            authRequest.put("password", config.getPassword());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
            
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(authRequest, headers);
            
            try {
                ResponseEntity<String> response = restTemplate.postForEntity(authUrl, entity, String.class);
                
                if (response.getStatusCode() == HttpStatus.OK) {
                    Map<String, Object> responseBody = objectMapper.readValue(response.getBody(), 
                        new TypeReference<Map<String, Object>>() {});
                    
                    this.authToken = (String) responseBody.get("token");
                    logger.info("NimbusPost authentication successful for LipiPrint Saharanpur");
                } else {
                    logger.error("NimbusPost authentication failed with status: {}", response.getStatusCode());
                }
            } catch (Exception e) {
                logger.error("NimbusPost API call failed for Saharanpur: {}", e.getMessage());
                // Don't throw exception to prevent app startup failure
            }
            
        } catch (Exception e) {
            logger.error("NimbusPost configuration error for LipiPrint Saharanpur: {}", e.getMessage());
        }
    }
    
    // *** MISSING METHODS - THESE WERE CAUSING THE COMPILATION ERRORS ***
    
    public Map<String, Object> getDeliveryEstimate(String pincode, Double weight) {
        logger.info("[NimbusPostService] Getting delivery estimate from Saharanpur to pincode: {}", pincode);
        
        if (!config.isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        if (authToken == null) {
            authenticate();
            if (authToken == null) {
                throw new RuntimeException("NimbusPost authentication failed");
            }
        }
        
        try {
            String estimateUrl = config.getBaseUrl() + "/shipping/estimate";
            
            Map<String, Object> estimateRequest = new HashMap<>();
            estimateRequest.put("pickup_pincode", "247001"); // Saharanpur pincode
            estimateRequest.put("delivery_pincode", pincode);
            estimateRequest.put("weight", weight);
            estimateRequest.put("length", 10);
            estimateRequest.put("breadth", 10);
            estimateRequest.put("height", 5);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(authToken);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(estimateRequest, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(estimateUrl, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
                    
                logger.info("[NimbusPostService] Delivery estimate successful from Saharanpur: {}", responseBody);
                return responseBody;
            } else {
                throw new RuntimeException("Failed to get delivery estimate: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Delivery estimate failed from Saharanpur: {}", e.getMessage());
            throw new RuntimeException("Delivery estimate failed: " + e.getMessage());
        }
    }
    
    public Map<String, Object> getShippingRates(Map<String, Object> request) {
        logger.info("[NimbusPostService] Getting shipping rates from LipiPrint Saharanpur: {}", request);
        
        if (!config.isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        if (authToken == null) {
            authenticate();
            if (authToken == null) {
                throw new RuntimeException("NimbusPost authentication failed");
            }
        }
        
        try {
            String ratesUrl = config.getBaseUrl() + "/shipping/rates";
            
            // Add Saharanpur origin to the request
            request.put("pickup_pincode", "247001");
            request.put("origin", "Saharanpur, UP");
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(authToken);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(ratesUrl, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
                    
                logger.info("[NimbusPostService] Shipping rates successful from Saharanpur: {}", responseBody);
                return responseBody;
            } else {
                throw new RuntimeException("Failed to get shipping rates: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Shipping rates failed from Saharanpur: {}", e.getMessage());
            throw new RuntimeException("Shipping rates failed: " + e.getMessage());
        }
    }
    
    public ShipmentResponse createShipment(ShipmentRequest shipmentRequest) {
        logger.info("[NimbusPostService] Creating shipment from LipiPrint Saharanpur: {}", shipmentRequest.getOrderId());
        
        if (!config.isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        if (authToken == null) {
            authenticate();
            if (authToken == null) {
                throw new RuntimeException("NimbusPost authentication failed");
            }
        }
        
        try {
            String createUrl = config.getBaseUrl() + "/shipping/create";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(authToken);
            
            HttpEntity<ShipmentRequest> entity = new HttpEntity<>(shipmentRequest, headers);
            
            ResponseEntity<ShipmentResponse> response = restTemplate.postForEntity(
                createUrl, entity, ShipmentResponse.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("[NimbusPostService] Shipment created successfully from Saharanpur: {}", 
                    response.getBody().getAwbNumber());
                return response.getBody();
            } else {
                throw new RuntimeException("Failed to create shipment: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Shipment creation failed from Saharanpur: {}", e.getMessage());
            throw new RuntimeException("Shipment creation failed: " + e.getMessage());
        }
    }
    
    public TrackingResponse trackShipment(String awbNumber) {
        logger.info("[NimbusPostService] Tracking shipment from Saharanpur: {}", awbNumber);
        
        if (!config.isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        try {
            String trackUrl = config.getBaseUrl() + "/tracking/" + awbNumber;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (authToken != null) {
                headers.setBearerAuth(authToken);
            }
            
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            ResponseEntity<TrackingResponse> response = restTemplate.exchange(
                trackUrl, HttpMethod.GET, entity, TrackingResponse.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("[NimbusPostService] Tracking successful from Saharanpur: {}", awbNumber);
                return response.getBody();
            } else {
                throw new RuntimeException("Failed to track shipment: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Tracking failed from Saharanpur: {}", e.getMessage());
            throw new RuntimeException("Tracking failed: " + e.getMessage());
        }
    }
    // Add these methods to your NimbusPostService class

public boolean isEnabled() {
    return config.isEnabled();
}

public ShipmentResponse createShipment(Order order, UserAddress deliveryAddress, 
                                     String customerName, String customerEmail) {
    logger.info("[NimbusPostService] Creating shipment for LipiPrint Saharanpur order: {}", order.getId());
    
    if (!isEnabled()) {
        throw new RuntimeException("NimbusPost is not enabled");
    }
    
    if (authToken == null) {
        authenticate();
        if (authToken == null) {
            throw new RuntimeException("NimbusPost authentication failed");
        }
    }
    
    try {
        // Build ShipmentRequest from Order and UserAddress
        ShipmentRequest shipmentRequest = buildShipmentRequest(order, deliveryAddress, customerName, customerEmail);
        return createShipment(shipmentRequest);
        
    } catch (Exception e) {
        logger.error("[NimbusPostService] Failed to create shipment for order {}: {}", order.getId(), e.getMessage());
        throw new RuntimeException("Shipment creation failed: " + e.getMessage());
    }
}

public void cancelShipment(String awbNumber) {
    logger.info("[NimbusPostService] Cancelling shipment with AWB: {}", awbNumber);
    
    if (!isEnabled()) {
        throw new RuntimeException("NimbusPost is not enabled");
    }
    
    if (authToken == null) {
        authenticate();
        if (authToken == null) {
            throw new RuntimeException("NimbusPost authentication failed");
        }
    }
    
    try {
        String cancelUrl = config.getBaseUrl() + "/shipping/cancel";
        
        Map<String, String> cancelRequest = new HashMap<>();
        cancelRequest.put("awb", awbNumber);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(authToken);
        
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(cancelRequest, headers);
        
        ResponseEntity<String> response = restTemplate.postForEntity(cancelUrl, entity, String.class);
        
        if (response.getStatusCode() == HttpStatus.OK) {
            logger.info("[NimbusPostService] Shipment cancelled successfully: {}", awbNumber);
        } else {
            throw new RuntimeException("Failed to cancel shipment: " + response.getStatusCode());
        }
        
    } catch (Exception e) {
        logger.error("[NimbusPostService] Failed to cancel shipment {}: {}", awbNumber, e.getMessage());
        throw new RuntimeException("Shipment cancellation failed: " + e.getMessage());
    }
}

// Helper method to build ShipmentRequest from Order and UserAddress
private ShipmentRequest buildShipmentRequest(Order order, UserAddress deliveryAddress, 
                                           String customerName, String customerEmail) {
    ShipmentRequest request = new ShipmentRequest();
    
    // Order details
    request.setOrderId(order.getId().toString());
    request.setOrderAmount(order.getTotalAmount().toString());
    request.setPaymentMethod(order.getPaymentMethod() != null ? 
        order.getPaymentMethod().toString() : "ONLINE");
    
    // Pickup details (LipiPrint Saharanpur)
    request.setPickupName("LipiPrint Saharanpur");
    request.setPickupAddress("Shop No. 12, Ground Floor, City Plaza, Ambala Road");
    request.setPickupCity("Saharanpur");
    request.setPickupState("Uttar Pradesh");
    request.setPickupPincode("247001");
    request.setPickupPhone("+91-9876543210");
    
    // Customer delivery details
    request.setDeliveryName(customerName);
    request.setDeliveryPhone(deliveryAddress.getPhone());
    request.setDeliveryEmail(customerEmail);
    
    // Parse address lines
    request.setDeliveryAddress(deliveryAddress.getLine1());
    request.setDeliveryCity(extractCity(deliveryAddress.getLine3()));
    request.setDeliveryState(extractState(deliveryAddress.getLine3()));
    request.setDeliveryPincode(extractPincode(deliveryAddress.getLine3()));
    
    // Package details for document printing
    request.setWeight(0.2);
    request.setLength(30);  // A4/A3 document package
    request.setBreadth(25);
    request.setHeight(2);
    
    // Service details
    request.setCodAmount(order.getPaymentMethod() == Order.PaymentMethod.COD ? 
        order.getTotalAmount() : 0.0);
    request.setProductDescription("Printed Documents - LipiPrint Saharanpur");
    request.setInvoiceNumber("LP" + order.getId());
    
    return request;
}

private String extractPincode(String addressLine) {
    if (addressLine == null) return "000000";
    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b(\\d{6})\\b");
    java.util.regex.Matcher matcher = pattern.matcher(addressLine);
    return matcher.find() ? matcher.group(1) : "000000";
}

private String extractCity(String addressLine) {
    if (addressLine == null) return "Unknown";
    String[] parts = addressLine.split("[,\\s]+");
    return parts.length > 0 ? parts[0].trim() : "Unknown";
}

private String extractState(String addressLine) {
    if (addressLine == null) return "Unknown";
    if (addressLine.toLowerCase().contains("up") || addressLine.toLowerCase().contains("uttar pradesh")) {
        return "Uttar Pradesh";
    } else if (addressLine.toLowerCase().contains("uttarakhand")) {
        return "Uttarakhand";
    } else if (addressLine.toLowerCase().contains("delhi")) {
        return "Delhi";
    }
    return "Unknown";
}

    
}
