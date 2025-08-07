package com.lipiprint.backend.service;

import com.lipiprint.backend.config.NimbusPostConfig;
import com.lipiprint.backend.dto.ShipmentRequest;
import com.lipiprint.backend.dto.ShipmentResponse;
import com.lipiprint.backend.dto.TrackingResponse;
import com.lipiprint.backend.entity.Order;
import com.lipiprint.backend.entity.UserAddress;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.annotation.PostConstruct;
import java.text.SimpleDateFormat;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class NimbusPostService {
    
    private static final Logger logger = LoggerFactory.getLogger(NimbusPostService.class);
    
    @Autowired
    private NimbusPostConfig config;
    
    @Autowired
    private RestTemplate restTemplate;
    
    private String authToken;
    
@PostConstruct
public void authenticate() {
    if (!config.isEnabled()) {
        logger.info("NimbusPost integration is disabled");
        return;
    }
    
    try {
        String authUrl = config.getBaseUrl() + "/users/login";
        
        Map<String, String> authRequest = new HashMap<>();
        authRequest.put("email", config.getEmail());
        authRequest.put("password", config.getPassword());
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(authRequest, headers);
        
        // FIXED: Use ParameterizedTypeReference for type safety
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
            authUrl, 
            HttpMethod.POST, 
            entity, 
            new ParameterizedTypeReference<Map<String, Object>>() {}
        );
        
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            Map<String, Object> responseBody = response.getBody();
            this.authToken = (String) responseBody.get("token");
            logger.info("NimbusPost authentication successful");
        } else {
            logger.error("NimbusPost authentication failed: Invalid response");
        }
    } catch (Exception e) {
        logger.error("NimbusPost authentication failed: {}", e.getMessage());
    }
}

public ShipmentResponse createShipment(Order order, UserAddress address, String customerName, String customerEmail) {
        if (!config.isEnabled()) {
            throw new RuntimeException("NimbusPost integration is disabled");
        }
        
        if (authToken == null) {
            authenticate();
            if (authToken == null) {
                throw new RuntimeException("NimbusPost authentication failed");
            }
        }
        
        try {
            String shipmentUrl = config.getBaseUrl() + "/shipments";
            
            ShipmentRequest request = buildShipmentRequest(order, address, customerName, customerEmail);
            
            HttpHeaders headers = createHeaders();
            HttpEntity<ShipmentRequest> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<ShipmentResponse> response = restTemplate.postForEntity(
                shipmentUrl, entity, ShipmentResponse.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            } else {
                throw new RuntimeException("Shipment creation failed with status: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("Failed to create NimbusPost shipment for order {}: {}", order.getId(), e.getMessage());
            throw new RuntimeException("Shipment creation failed: " + e.getMessage());
        }
    }
    
    public TrackingResponse trackShipment(String awbNumber) {
        if (!config.isEnabled()) {
            throw new RuntimeException("NimbusPost integration is disabled");
        }
        
        if (authToken == null) {
            authenticate();
            if (authToken == null) {
                throw new RuntimeException("NimbusPost authentication failed");
            }
        }
        
        try {
            String trackingUrl = config.getBaseUrl() + "/courier/tracking?awb=" + awbNumber;
            
            HttpHeaders headers = createHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            ResponseEntity<TrackingResponse> response = restTemplate.exchange(
                trackingUrl, HttpMethod.GET, entity, TrackingResponse.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            } else {
                throw new RuntimeException("Tracking failed with status: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("Failed to track shipment {}: {}", awbNumber, e.getMessage());
            throw new RuntimeException("Tracking failed: " + e.getMessage());
        }
    }
    
private ShipmentRequest buildShipmentRequest(Order order, UserAddress address, String customerName, String customerEmail) {
    ShipmentRequest request = new ShipmentRequest();
    
    // Order details
    request.setOrderNumber("LP" + order.getId());
    request.setOrderId(order.getId().toString());
    request.setOrderAmount(order.getTotalAmount().toString());
    request.setTotalOrderValue(order.getTotalAmount().toString());
    request.setShippingCharges("0");
    request.setDiscount("0");
    request.setCodCharges("0");
    
    // Payment details - NOW WORKS WITH PROPER RELATIONSHIP
    boolean isCOD = order.getPayment() == null || 
                   order.getRazorpayOrderId() == null || 
                   order.getRazorpayOrderId().trim().isEmpty();
    request.setPaymentType(isCOD ? "COD" : "PREPAID");
    request.setPaymentMode(isCOD ? "COD" : "ONLINE");
    
    // Rest of the method remains the same...
    // Package details for documents (A4/A3 prints)
    request.setPackageWeight("0.2");
    request.setPackageLength("30");
    request.setPackageBreadth("21");
    request.setPackageHeight("3");
    
    String[] addressParts = extractAddressParts(address.getLine3());
    
    request.setConsignee(customerName != null ? customerName : "Customer");
    request.setConsigneeAddress1(address.getLine1());
    request.setConsigneeAddress2(address.getLine2());
    request.setConsigneeAddress3(address.getLine3());
    request.setConsigneePincode(addressParts[2]);
    request.setConsigneeCity(addressParts[0]);
    request.setConsigneeState(addressParts[1]);
    request.setConsigneePhone(address.getPhone());
    request.setConsigneeEmail(customerEmail != null ? customerEmail : "customer@lipiprint.com");
    
    request.setPickupLocation("LipiPrint Bareilly Store");
    request.setRequestAutoPickup("1");
    request.setChannelId("1");
    request.setCompanyName("LipiPrint");
    request.setMarketplace("LipiPrint App");
    request.setResellerName("LipiPrint");
    request.setInvoiceNumber("INV" + order.getId());
    
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
    request.setOrderDate(sdf.format(order.getCreatedAt()));
    
    return request;
}
    
    private String[] extractAddressParts(String line3) {
        // Default values
        String city = "Unknown";
        String state = "UP"; // Default to Uttar Pradesh since you're in Bareilly
        String pincode = "243001"; // Default Bareilly pincode
        
        if (line3 != null && !line3.trim().isEmpty()) {
            // Extract pincode (6 digits)
            Pattern pincodePattern = Pattern.compile("\\b\\d{6}\\b");
            Matcher pincodeMatcher = pincodePattern.matcher(line3);
            if (pincodeMatcher.find()) {
                pincode = pincodeMatcher.group();
            }
            
            // Simple extraction for city (assuming it's before comma or space)
            String[] parts = line3.split("[,\\s]+");
            if (parts.length > 0) {
                city = parts[0].trim();
            }
        }
        
        return new String[]{city, state, pincode};
    }
    
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authToken != null) {
            headers.setBearerAuth(authToken);
        }
        return headers;
    }
    
    public boolean isEnabled() {
        return config.isEnabled();
    }
}

