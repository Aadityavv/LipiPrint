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
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;

import javax.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class NimbusPostService {
    
    private static final Logger logger = LoggerFactory.getLogger(NimbusPostService.class);
    
    // ✅ VERIFIED: Official NimbusPost API endpoints
    private static final String LOGIN_ENDPOINT = "/users/login";
    private static final String SERVICEABILITY_ENDPOINT = "/courier/serviceability";
    private static final String SHIPMENT_ENDPOINT = "/shipments";
    private static final String TRACKING_ENDPOINT = "/shipments/track/";
    private static final String CANCEL_ENDPOINT = "/shipments/cancel";
    
    @Autowired
    private NimbusPostConfig config;
    
    @Autowired
    private RestTemplate restTemplate;
    
    private String authToken;
    private LocalDateTime tokenExpiry;
    private ObjectMapper objectMapper = new ObjectMapper();
    
    @PostConstruct
    public void authenticate() {
        logger.info("=====================================");
        logger.info("NIMBUSPOST AUTHENTICATION STARTING");
        logger.info("Business: Nagpal Print House Saharanpur");
        logger.info("=====================================");
        
        if (!config.isEnabled()) {
            logger.warn("❌ NimbusPost integration is DISABLED in configuration");
            return;
        }
        
        try {
            String authUrl = config.getBaseUrl() + LOGIN_ENDPOINT;
            logger.info("🔐 Auth URL: {}", authUrl);
            logger.info("📧 Email: {}", config.getEmail());
            logger.info("🔑 Password length: {}", config.getPassword() != null ? config.getPassword().length() : 0);
            
            // ✅ ENHANCED: Validate configuration
            if (config.getEmail() == null || config.getEmail().trim().isEmpty()) {
                logger.error("❌ NimbusPost email is not configured");
                return;
            }
            
            if (config.getPassword() == null || config.getPassword().trim().isEmpty()) {
                logger.error("❌ NimbusPost password is not configured");
                return;
            }
            
            if (config.getBaseUrl() == null || config.getBaseUrl().trim().isEmpty()) {
                logger.error("❌ NimbusPost base URL is not configured");
                return;
            }
            
            Map<String, String> authRequest = new HashMap<>();
            authRequest.put("email", config.getEmail().trim());
            authRequest.put("password", config.getPassword().trim());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
            headers.set("User-Agent", "LipiPrint-NagpalPrintHouse/1.0");
            
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(authRequest, headers);
            
            logger.info("🚀 Sending authentication request to NimbusPost...");
            
            try {
                ResponseEntity<String> response = restTemplate.postForEntity(authUrl, entity, String.class);
                
                logger.info("📡 Response Status: {}", response.getStatusCode());
                logger.info("📦 Response Body: {}", response.getBody());
                
                if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                    Map<String, Object> responseBody = objectMapper.readValue(response.getBody(), 
                        new TypeReference<Map<String, Object>>() {});
                    
                    // Log the full response structure for debugging
                    logger.info("📊 Full Response Structure: {}", responseBody);
                    
                    // ✅ ENHANCED: Extract token from response with multiple fallbacks
                    if (responseBody.containsKey("data")) {
                        Object data = responseBody.get("data");
                        if (data instanceof String) {
                            this.authToken = (String) data;
                        } else if (data instanceof Map) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> dataMap = (Map<String, Object>) data;
                            this.authToken = (String) dataMap.get("token");
                        }
                    } else if (responseBody.containsKey("token")) {
                        this.authToken = (String) responseBody.get("token");
                    } else if (responseBody.containsKey("access_token")) {
                        this.authToken = (String) responseBody.get("access_token");
                    } else if (responseBody.containsKey("auth_token")) {
                        this.authToken = (String) responseBody.get("auth_token");
                    }
                    
                    if (this.authToken != null && !this.authToken.trim().isEmpty()) {
                        this.tokenExpiry = LocalDateTime.now().plusHours(23); // Token valid for 23 hours
                        logger.info("✅ NimbusPost authentication SUCCESSFUL for Nagpal Print House");
                        logger.info("🎫 Token length: {} characters", this.authToken.length());
                        logger.info("⏰ Token expires at: {}", this.tokenExpiry);
                        logger.info("=====================================");
                    } else {
                        logger.error("❌ Authentication failed - No token found in response");
                        logger.error("Response keys: {}", responseBody.keySet());
                        logger.error("Full response: {}", responseBody);
                    }
                } else {
                    logger.error("❌ Authentication failed with HTTP status: {}", response.getStatusCode());
                    logger.error("Response body: {}", response.getBody());
                }
                
            } catch (HttpClientErrorException e) {
                logger.error("❌ HTTP Client Error during authentication: {}", e.getStatusCode());
                logger.error("Error body: {}", e.getResponseBodyAsString());
                logger.error("Possible causes: Invalid credentials, account suspended, or API endpoint changed");
            } catch (HttpServerErrorException e) {
                logger.error("❌ HTTP Server Error during authentication: {}", e.getStatusCode());
                logger.error("Error body: {}", e.getResponseBodyAsString());
                logger.error("Possible causes: NimbusPost server issues or maintenance");
            } catch (Exception e) {
                logger.error("❌ Network/Parse error during authentication: {}", e.getMessage(), e);
                logger.error("Possible causes: Network connectivity, JSON parsing, or timeout issues");
            }
            
        } catch (Exception e) {
            logger.error("❌ Configuration error for NimbusPost: {}", e.getMessage(), e);
        }
    }
    
    // ✅ ENHANCED: Token validation with expiry check and better logging
    private boolean isTokenValid() {
        if (authToken == null || authToken.trim().isEmpty()) {
            logger.debug("🔍 Token validation failed: Token is null or empty");
            return false;
        }
        
        if (tokenExpiry != null && LocalDateTime.now().isAfter(tokenExpiry)) {
            logger.warn("⏰ Token validation failed: Token has expired at {}", tokenExpiry);
            return false;
        }
        
        logger.debug("✅ Token validation passed: Token is valid until {}", tokenExpiry);
        return true;
    }
    
    // ✅ ENHANCED: Automatic re-authentication with retry logic
    private void ensureAuthenticated() {
        if (!isTokenValid()) {
            logger.info("🔄 Re-authenticating with NimbusPost...");
            authenticate();
            if (!isTokenValid()) {
                throw new RuntimeException("NimbusPost authentication failed after retry. Please check credentials and network connectivity.");
            }
        }
    }
    
    public boolean isEnabled() {
        return config != null && config.isEnabled();
    }
    
    // ✅ NEW: Comprehensive serviceability check
    public Map<String, Object> checkServiceability(String pickupPincode, String deliveryPincode, Double weight) {
        logger.info("🔍 Checking serviceability from {} to {}", pickupPincode, deliveryPincode);
        
        if (!isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        ensureAuthenticated();
        
        try {
            String serviceabilityUrl = config.getBaseUrl() + SERVICEABILITY_ENDPOINT;
            
            // ✅ VALIDATION: Ensure pincodes are valid
            if (pickupPincode == null || !pickupPincode.matches("\\d{6}")) {
                throw new RuntimeException("Invalid pickup pincode: " + pickupPincode);
            }
            
            if (deliveryPincode == null || !deliveryPincode.matches("\\d{6}")) {
                throw new RuntimeException("Invalid delivery pincode: " + deliveryPincode);
            }
            
            Map<String, Object> serviceabilityRequest = new HashMap<>();
            serviceabilityRequest.put("origin", pickupPincode);
            serviceabilityRequest.put("destination", deliveryPincode);
            serviceabilityRequest.put("payment_type", "prepaid");
            serviceabilityRequest.put("order_amount", "100.00");
            serviceabilityRequest.put("weight", String.valueOf((int)(weight * 1000)));
            serviceabilityRequest.put("length", "30");
            serviceabilityRequest.put("breadth", "25");
            serviceabilityRequest.put("height", "2");
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(authToken);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(serviceabilityRequest, headers);
            
            logger.info("🚀 Sending serviceability request: {}", serviceabilityRequest);
            ResponseEntity<String> response = restTemplate.postForEntity(serviceabilityUrl, entity, String.class);
            
            logger.info("📡 Serviceability Response Status: {}", response.getStatusCode());
            logger.info("📦 Serviceability Response Body: {}", response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
                
                logger.info("🔍 Serviceability response parsed: {}", responseBody);
                
                // Check if response indicates success
                if (Boolean.TRUE.equals(responseBody.get("status"))) {
                    // Check if any courier is available
                    if (responseBody.containsKey("data")) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> couriers = (List<Map<String, Object>>) responseBody.get("data");
                        if (couriers != null && !couriers.isEmpty()) {
                            Map<String, Object> result = new HashMap<>();
                            result.put("serviceable", true);
                            result.put("couriers", couriers);
                            result.put("count", couriers.size());
                            logger.info("✅ Serviceability confirmed: {} couriers available", couriers.size());
                            return result;
                        }
                    }
                }
                
                // Not serviceable or no couriers available
                Map<String, Object> result = new HashMap<>();
                result.put("serviceable", false);
                result.put("message", responseBody.getOrDefault("message", "No couriers available for this route"));
                result.put("error_details", responseBody);
                logger.warn("❌ Serviceability failed: {}", result.get("message"));
                return result;
            } else {
                logger.error("❌ Serviceability check failed with HTTP status: {}", response.getStatusCode());
                Map<String, Object> result = new HashMap<>();
                result.put("serviceable", false);
                result.put("message", "HTTP error: " + response.getStatusCode());
                return result;
            }
            
        } catch (Exception e) {
            logger.error("❌ Serviceability check failed: {}", e.getMessage(), e);
            Map<String, Object> result = new HashMap<>();
            result.put("serviceable", false);
            result.put("message", "Serviceability check failed: " + e.getMessage());
            return result;
        }
    }
    
    // ✅ ENHANCED: Delivery estimate with comprehensive error handling
    public Map<String, Object> getDeliveryEstimate(String pincode, Double weight) {
        logger.info("[NimbusPostService] Getting delivery estimate from Saharanpur to pincode: {}", pincode);
        
        if (!isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        // ✅ VALIDATION: Check pincode format
        if (pincode == null || !pincode.matches("\\d{6}")) {
            throw new RuntimeException("Invalid pincode format: " + pincode);
        }
        
        if (weight == null || weight <= 0) {
            throw new RuntimeException("Invalid weight: " + weight);
        }
        
        return checkServiceability("247001", pincode, weight);
    }
    
    // ✅ ENHANCED: Shipping rates with authentication retry
    public Map<String, Object> getShippingRates(Map<String, Object> request) {
        logger.info("[NimbusPostService] Getting shipping rates from Nagpal Print House: {}", request);
        
        if (!isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        // ✅ VALIDATION: Check required fields
        if (!request.containsKey("delivery_pincode")) {
            throw new RuntimeException("delivery_pincode is required");
        }
        
        String deliveryPincode = (String) request.get("delivery_pincode");
        if (!deliveryPincode.matches("\\d{6}")) {
            throw new RuntimeException("Invalid delivery pincode format: " + deliveryPincode);
        }
        
        Double weight = 0.2; // Default weight
        if (request.containsKey("weight")) {
            try {
                weight = Double.parseDouble(request.get("weight").toString()) / 1000.0; // Convert grams to kg
            } catch (NumberFormatException e) {
                logger.warn("Invalid weight format, using default: {}", request.get("weight"));
            }
        }
        
        return checkServiceability("247001", deliveryPincode, weight);
    }
    
    // ✅ ENHANCED: Order-based shipment creation with validation
    public ShipmentResponse createShipment(Order order, UserAddress deliveryAddress, 
                                         String customerName, String customerEmail) {
        logger.info("========================================");
        logger.info("CREATING SHIPMENT FROM NAGPAL PRINT HOUSE");
        logger.info("Order ID: {}", order.getId());
        logger.info("========================================");
        
        if (!isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        ensureAuthenticated();
        
        try {
            // ✅ DEBUG: Log input data
            logger.info("🔍 DEBUG Input Data:");
            logger.info("   Order ID: {}", order.getId());
            logger.info("   Order Amount: {}", order.getTotalAmount());
            logger.info("   Payment Method: {}", order.getPaymentMethod());
            logger.info("   Customer Name: {}", customerName);
            logger.info("   Customer Email: {}", customerEmail);
            
            if (deliveryAddress != null) {
                logger.info("🔍 DEBUG UserAddress:");
                logger.info("   Line1: '{}'", deliveryAddress.getLine1());
                logger.info("   Line2: '{}'", deliveryAddress.getLine2());
                logger.info("   City: '{}'", deliveryAddress.getCity());
                logger.info("   State: '{}'", deliveryAddress.getState());
                logger.info("   Pincode: '{}'", deliveryAddress.getPincode());
                logger.info("   Phone: '{}'", deliveryAddress.getPhone());
            } else {
                logger.error("❌ Delivery address is null!");
            }
            
            ShipmentRequest shipmentRequest = buildShipmentRequest(order, deliveryAddress, customerName, customerEmail);
            
            // ✅ NEW: Check serviceability first
            logger.info("🔍 Checking serviceability before creating shipment...");
            Map<String, Object> serviceabilityResult = checkServiceability(
                shipmentRequest.getPickupPincode(), 
                shipmentRequest.getDeliveryPincode(), 
                shipmentRequest.getWeight()
            );
            
            if (serviceabilityResult == null || !Boolean.TRUE.equals(serviceabilityResult.get("serviceable"))) {
                String errorMsg = "Delivery not serviceable to pincode: " + shipmentRequest.getDeliveryPincode();
                if (serviceabilityResult != null && serviceabilityResult.containsKey("message")) {
                    errorMsg = serviceabilityResult.get("message").toString();
                }
                logger.error("❌ Serviceability check failed: {}", errorMsg);
                throw new RuntimeException(errorMsg);
            }
            
            logger.info("✅ Serviceability confirmed, proceeding with shipment creation");
            return createShipment(shipmentRequest);
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Failed to create shipment for order {}: {}", order.getId(), e.getMessage(), e);
            throw new RuntimeException("Shipment creation failed: " + e.getMessage());
        }
    }
    
    // ✅ ENHANCED: Shipment creation with comprehensive logging
    public ShipmentResponse createShipment(ShipmentRequest shipmentRequest) {
        logger.info("🚀 Creating shipment with ShipmentRequest for Order: {}", shipmentRequest.getOrderId());
        
        if (!isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        ensureAuthenticated();
        
        try {
            String shipmentUrl = config.getBaseUrl() + SHIPMENT_ENDPOINT;
            Map<String, Object> nimbusPostRequest = buildNimbusPostShipmentRequest(shipmentRequest);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(authToken);
            headers.set("User-Agent", "LipiPrint-NagpalPrintHouse/1.0");
            
            logger.info("🚀 Sending shipment creation request...");
            logger.info("📡 URL: {}", shipmentUrl);
            logger.info("🎫 Using token: {}...{}", 
                authToken.substring(0, Math.min(10, authToken.length())),
                authToken.length() > 10 ? authToken.substring(authToken.length() - 10) : "");
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(nimbusPostRequest, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(shipmentUrl, entity, String.class);
            
            logger.info("📡 Shipment Response Status: {}", response.getStatusCode());
            logger.info("📦 Shipment Response Body: {}", response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
                
                ShipmentResponse shipmentResponse = parseShipmentResponse(responseBody);
                
                if (shipmentResponse.isStatus() && shipmentResponse.getAwbNumber() != null) {
                    logger.info("✅ SHIPMENT CREATED SUCCESSFULLY!");
                    logger.info("📋 AWB Number: {}", shipmentResponse.getAwbNumber());
                    logger.info("🚚 Courier: {}", shipmentResponse.getCourierName());
                    logger.info("========================================");
                } else {
                    logger.error("❌ Shipment creation failed: {}", shipmentResponse.getMessage());
                }
                
                return shipmentResponse;
            } else {
                logger.error("❌ HTTP Error: {}", response.getStatusCode());
                throw new RuntimeException("Failed to create shipment: " + response.getStatusCode());
            }
            
        } catch (HttpClientErrorException e) {
            logger.error("❌ HTTP Client Error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Shipment creation failed: " + e.getMessage());
        } catch (Exception e) {
            logger.error("❌ Shipment creation exception: {}", e.getMessage(), e);
            throw new RuntimeException("Shipment creation failed: " + e.getMessage());
        }
    }
    
    // ✅ FIXED: Build shipment request with proper validation and debugging
    private ShipmentRequest buildShipmentRequest(Order order, UserAddress deliveryAddress, 
                                               String customerName, String customerEmail) {
        ShipmentRequest request = new ShipmentRequest();
        
        // ✅ VALIDATION: Check required fields
        if (order == null) {
            throw new RuntimeException("Order is required");
        }
        
        if (deliveryAddress == null) {
            throw new RuntimeException("Delivery address is required");
        }
        
        if (deliveryAddress.getPincode() == null || deliveryAddress.getPincode().trim().isEmpty()) {
            throw new RuntimeException("Delivery pincode is required");
        }
        
        // ✅ VALIDATION: Ensure pincode is 6 digits
        String deliveryPincode = deliveryAddress.getPincode().trim();
        if (!deliveryPincode.matches("\\d{6}")) {
            throw new RuntimeException("Invalid delivery pincode format: " + deliveryPincode);
        }
        
        // Order details
        request.setOrderId(order.getId().toString());
        request.setOrderNumber("LP" + order.getId());
        request.setOrderAmount(order.getTotalAmount().toString());
        
        // ✅ FIXED: Handle null payment method properly
        String paymentMethod = "PREPAID"; // Default to prepaid
        if (order.getPaymentMethod() != null) {
            paymentMethod = order.getPaymentMethod().toString().toUpperCase();
        }
        request.setPaymentMethod(paymentMethod);
        
        // Pickup details for Nagpal Print House Saharanpur
        request.setPickupName("Nagpal Print House");
        request.setPickupAddress("Near Civil Court Sadar, Thana Road");
        request.setPickupCity("Saharanpur");
        request.setPickupState("Uttar Pradesh");
        request.setPickupPincode("247001"); // ✅ CONFIRMED: This should be your pickup pincode
        request.setPickupPhone("+91-9837775757");
        
        // ✅ FIXED: Customer delivery details with validation
        request.setDeliveryName(customerName != null && !customerName.trim().isEmpty() ? 
                               customerName.trim() : "Customer");
        request.setDeliveryPhone(deliveryAddress.getPhone() != null && !deliveryAddress.getPhone().trim().isEmpty() ? 
                                deliveryAddress.getPhone().trim() : "9999999999");
        request.setDeliveryEmail(customerEmail != null && !customerEmail.trim().isEmpty() ? 
                                customerEmail.trim() : "customer@example.com");
        
        // ✅ FIXED: Build complete address with validation
        String fullAddress = "";
        if (deliveryAddress.getLine1() != null && !deliveryAddress.getLine1().trim().isEmpty()) {
            fullAddress = deliveryAddress.getLine1().trim();
        }
        if (deliveryAddress.getLine2() != null && !deliveryAddress.getLine2().trim().isEmpty()) {
            if (!fullAddress.isEmpty()) {
                fullAddress += ", ";
            }
            fullAddress += deliveryAddress.getLine2().trim();
        }
        if (fullAddress.isEmpty()) {
            throw new RuntimeException("Delivery address is required");
        }
        request.setDeliveryAddress(fullAddress);
        
        // ✅ FIXED: Use address fields with fallback parsing and pincode validation
        String deliveryCity = deliveryAddress.getCity();
        String deliveryState = deliveryAddress.getState();
        
        // If city/state are null, try to extract from address
        if (deliveryCity == null || deliveryCity.trim().isEmpty()) {
            deliveryCity = extractCity(fullAddress);
        } else {
            deliveryCity = deliveryCity.trim();
        }
        
        if (deliveryState == null || deliveryState.trim().isEmpty()) {
            deliveryState = extractState(fullAddress);
        } else {
            deliveryState = deliveryState.trim();
        }
        
        // ✅ VALIDATION: Cross-check pincode with address if needed
        String extractedPincode = extractPincode(fullAddress);
        if (!extractedPincode.equals("000000") && !extractedPincode.equals(deliveryPincode)) {
            logger.warn("⚠️ Pincode mismatch: Field={}, Extracted from address={}", 
                       deliveryPincode, extractedPincode);
        }
        
        request.setDeliveryCity(deliveryCity);
        request.setDeliveryState(deliveryState);
        request.setDeliveryPincode(deliveryPincode); // ✅ Use validated pincode
        
        // Package details for document printing
        request.setWeight(0.2);
        request.setLength(30);
        request.setBreadth(25);
        request.setHeight(2);
        
        // Service details
        Double codAmount = 0.0;
        if ("COD".equalsIgnoreCase(paymentMethod)) {
            codAmount = order.getTotalAmount();
        }
        request.setCodAmount(codAmount);
        request.setProductDescription("Printed Documents - Nagpal Print House Saharanpur");
        request.setInvoiceNumber("LP" + order.getId());
        
        // ✅ ENHANCED: Debug the built request
        logger.info("📋 Built ShipmentRequest:");
        logger.info("   Order ID: {}", request.getOrderId());
        logger.info("   Order Number: {}", request.getOrderNumber());
        logger.info("   Order Amount: {}", request.getOrderAmount());
        logger.info("   Payment Method: {}", request.getPaymentMethod());
        logger.info("   Pickup Pincode: {}", request.getPickupPincode());
        logger.info("   Delivery Name: {}", request.getDeliveryName());
        logger.info("   Delivery Address: {}", request.getDeliveryAddress());
        logger.info("   Delivery City: {}", request.getDeliveryCity());
        logger.info("   Delivery State: {}", request.getDeliveryState());
        logger.info("   Delivery Pincode: {}", request.getDeliveryPincode());
        logger.info("   Delivery Phone: {}", request.getDeliveryPhone());
        logger.info("   COD Amount: {}", request.getCodAmount());
        
        return request;
    }
    
    // ✅ ENHANCED: Build NimbusPost API request with comprehensive validation
    private Map<String, Object> buildNimbusPostShipmentRequest(ShipmentRequest shipmentRequest) {
        Map<String, Object> request = new HashMap<>();
        
        // ✅ VALIDATION: Ensure required fields
        if (shipmentRequest.getDeliveryPincode() == null || shipmentRequest.getPickupPincode() == null) {
            throw new RuntimeException("Pickup and delivery pincodes are required");
        }
        
        if (shipmentRequest.getDeliveryName() == null || shipmentRequest.getDeliveryName().trim().isEmpty()) {
            throw new RuntimeException("Delivery name is required");
        }
        
        if (shipmentRequest.getDeliveryAddress() == null || shipmentRequest.getDeliveryAddress().trim().isEmpty()) {
            throw new RuntimeException("Delivery address is required");
        }
        
        // Order details
        request.put("order_number", shipmentRequest.getOrderNumber());
        request.put("shipping_charges", 30);
        
        // ✅ FIXED: Payment type mapping
        String paymentType = "prepaid";
        if (shipmentRequest.getPaymentMethod() != null && 
            shipmentRequest.getPaymentMethod().toUpperCase().contains("COD")) {
            paymentType = "cod";
        }
        request.put("payment_type", paymentType);
        
        request.put("order_amount", Double.parseDouble(shipmentRequest.getOrderAmount()));
        request.put("package_weight", (int)(shipmentRequest.getWeight() * 1000)); // Convert kg to grams
        request.put("package_length", shipmentRequest.getLength());
        request.put("package_breadth", shipmentRequest.getBreadth());
        request.put("package_height", shipmentRequest.getHeight());
        request.put("request_auto_pickup", "yes");
        
        // ✅ ENHANCED: Add COD amount if applicable
        if ("cod".equals(paymentType)) {
            request.put("cod_amount", shipmentRequest.getCodAmount());
        }
        
        // ✅ CRITICAL: Support contact fields
        request.put("support_email", "dev.lipiprint@gmail.com");
        request.put("support_phone", "9358319000");
        
        // ✅ FIXED: Consignee details with validation
        Map<String, Object> consignee = new HashMap<>();
        consignee.put("name", shipmentRequest.getDeliveryName());
        consignee.put("address", shipmentRequest.getDeliveryAddress());
        consignee.put("address_2", ""); // Additional address line (optional)
        consignee.put("city", shipmentRequest.getDeliveryCity());
        consignee.put("state", shipmentRequest.getDeliveryState());
        consignee.put("pincode", shipmentRequest.getDeliveryPincode()); // ✅ This should be the customer's pincode
        consignee.put("phone", shipmentRequest.getDeliveryPhone());
        consignee.put("email", shipmentRequest.getDeliveryEmail());
        request.put("consignee", consignee);
        
        // ✅ FIXED: Pickup details for Nagpal Print House
        Map<String, Object> pickup = new HashMap<>();
        pickup.put("warehouse_name", "Nagpal Print House");
        pickup.put("name", "Nagpal Print House");
        pickup.put("address", "Near Civil Court Sadar, Thana Road");
        pickup.put("address_2", ""); // Additional address line (optional)
        pickup.put("city", "Saharanpur");
        pickup.put("state", "Uttar Pradesh");
        pickup.put("pincode", "247001"); // ✅ Your pickup location pincode
        pickup.put("phone", "9837775757");
        pickup.put("email", "support@nagpalprinthouse.com");
        request.put("pickup", pickup);
        
        // Order items
        List<Map<String, Object>> orderItems = new ArrayList<>();
        Map<String, Object> item = new HashMap<>();
        item.put("name", "Printed Documents");
        item.put("qty", "1");
        item.put("price", Double.parseDouble(shipmentRequest.getOrderAmount()));
        item.put("sku", "DOC_PRINT");
        orderItems.add(item);
        request.put("order_items", orderItems);
        
        // ✅ ENHANCED: Log for debugging
        logger.info("📋 Complete shipment request payload:");
        logger.info("   Order Number: {}", request.get("order_number"));
        logger.info("   Payment Type: {}", paymentType);
        logger.info("   Order Amount: {}", request.get("order_amount"));
        logger.info("   Package Weight: {} grams", request.get("package_weight"));
        logger.info("   Pickup Pincode: {}", pickup.get("pincode"));
        logger.info("   Delivery Pincode: {}", consignee.get("pincode"));
        logger.info("   Delivery Name: {}", consignee.get("name"));
        logger.info("   Delivery City: {}", consignee.get("city"));
        logger.info("   Delivery State: {}", consignee.get("state"));
        logger.info("   Full Request: {}", request);
        
        return request;
    }
    
    // ✅ ENHANCED: Tracking with better error handling
    public TrackingResponse trackShipment(String awbNumber) {
        logger.info("[NimbusPostService] Tracking shipment: {}", awbNumber);
        
        if (!isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        // ✅ VALIDATION: Check AWB number format
        if (awbNumber == null || awbNumber.trim().isEmpty()) {
            throw new RuntimeException("AWB number is required");
        }
        
        awbNumber = awbNumber.trim();
        
        try {
            String trackUrl = config.getBaseUrl() + TRACKING_ENDPOINT + awbNumber;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (isTokenValid()) {
                headers.setBearerAuth(authToken);
            }
            
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            logger.info("🚀 Sending tracking request to: {}", trackUrl);
            ResponseEntity<String> response = restTemplate.exchange(
                trackUrl, HttpMethod.GET, entity, String.class);
            
            logger.info("📡 Tracking Response Status: {}", response.getStatusCode());
            logger.info("📦 Tracking Response Body: {}", response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
                
                TrackingResponse trackingResponse = parseTrackingResponse(responseBody);
                logger.info("[NimbusPostService] Tracking successful: {}", awbNumber);
                return trackingResponse;
            } else {
                throw new RuntimeException("Failed to track shipment: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Tracking failed for AWB {}: {}", awbNumber, e.getMessage(), e);
            throw new RuntimeException("Tracking failed: " + e.getMessage());
        }
    }
    
    // ✅ ENHANCED: Cancel shipment with validation
    public void cancelShipment(String awbNumber) {
        logger.info("[NimbusPostService] Cancelling shipment: {}", awbNumber);
        
        if (!isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        // ✅ VALIDATION: Check AWB number
        if (awbNumber == null || awbNumber.trim().isEmpty()) {
            throw new RuntimeException("AWB number is required for cancellation");
        }
        
        awbNumber = awbNumber.trim();
        ensureAuthenticated();
        
        try {
            String cancelUrl = config.getBaseUrl() + CANCEL_ENDPOINT;
            
            Map<String, String> cancelRequest = new HashMap<>();
            cancelRequest.put("awb", awbNumber);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(authToken);
            
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(cancelRequest, headers);
            
            logger.info("🚀 Sending cancellation request for AWB: {}", awbNumber);
            ResponseEntity<String> response = restTemplate.postForEntity(cancelUrl, entity, String.class);
            
            logger.info("📡 Cancellation Response Status: {}", response.getStatusCode());
            logger.info("📦 Cancellation Response Body: {}", response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("✅ Shipment cancelled successfully: {}", awbNumber);
            } else {
                throw new RuntimeException("Failed to cancel shipment: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Failed to cancel shipment {}: {}", awbNumber, e.getMessage(), e);
            throw new RuntimeException("Shipment cancellation failed: " + e.getMessage());
        }
    }
    
    // ✅ ENHANCED: Parse shipment response with comprehensive error handling
    private ShipmentResponse parseShipmentResponse(Map<String, Object> responseBody) {
        ShipmentResponse response = new ShipmentResponse();
        
        logger.info("📊 Parsing shipment response: {}", responseBody);
        
        if (responseBody == null) {
            response.setStatus(false);
            response.setMessage("Empty response from NimbusPost API");
            return response;
        }
        
        // Check if request was successful
        if (Boolean.TRUE.equals(responseBody.get("status"))) {
            response.setStatus(true);
            
            // Extract data from response
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
            
            if (data != null) {
                String awb = (String) data.get("awb");
                String courierName = (String) data.get("courier_name");
                String shipmentId = (String) data.get("shipment_id");
                
                logger.info("✅ Extracted data - AWB: {}, Courier: {}, ShipmentId: {}", 
                    awb, courierName, shipmentId);
                
                response.setAwbNumber(awb);
                response.setCourierName(courierName);
                response.setShipmentId(shipmentId);
                response.setOrderId((String) data.get("order_id"));
                response.setCourierId((String) data.get("courier_id"));
                response.setTrackingUrl((String) data.get("tracking_url"));
                response.setExpectedDeliveryDate((String) data.get("expected_delivery_date"));
                response.setLabelUrl((String) data.get("label_url"));
                response.setManifestUrl((String) data.get("manifest_url"));
                
                if (awb == null || awb.trim().isEmpty()) {
                    logger.warn("⚠️ AWB number is missing in response");
                    response.setMessage("AWB number not provided by courier service");
                } else {
                    response.setMessage("Shipment created successfully");
                }
            } else {
                logger.warn("⚠️ No 'data' field in successful response");
                response.setStatus(false);
                response.setMessage("Missing data field in response");
            }
        } else {
            // Request failed
            response.setStatus(false);
            String message = (String) responseBody.getOrDefault("message", "Unknown error occurred");
            response.setMessage(message);
            response.setErrorDetails(responseBody); // Store full error for debugging
            logger.error("❌ Shipment creation failed: {}", message);
        }
        
        return response;
    }
    
    // ✅ ENHANCED: Parse tracking response with comprehensive data extraction
    private TrackingResponse parseTrackingResponse(Map<String, Object> responseBody) {
        TrackingResponse response = new TrackingResponse();
        
        logger.info("📊 Parsing tracking response: {}", responseBody);
        
        if (responseBody == null) {
            response.setStatus(false);
            response.setMessage("Empty tracking response");
            return response;
        }
        
        if (Boolean.TRUE.equals(responseBody.get("status"))) {
            response.setStatus(true);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
            
            if (data != null) {
                String awb = (String) data.get("awb");
                String currentStatus = (String) data.get("status");
                String lastLocation = (String) data.get("last_location");
                
                response.setAwbNumber(awb);
                response.setCurrentStatus(currentStatus);
                response.setLastLocation(lastLocation);
                response.setExpectedDeliveryDate((String) data.get("expected_delivery"));
                response.setCourierName((String) data.get("courier_name"));
                response.setDeliveredDate((String) data.get("delivered_date"));
                
                // Parse tracking events if available
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> trackingDataRaw = (List<Map<String, Object>>) data.get("tracking_data");
                
                if (trackingDataRaw != null && !trackingDataRaw.isEmpty()) {
                    List<TrackingResponse.TrackingEvent> trackingEvents = new ArrayList<>();
                    for (Map<String, Object> eventData : trackingDataRaw) {
                        TrackingResponse.TrackingEvent event = new TrackingResponse.TrackingEvent();
                        event.setDate((String) eventData.get("date"));
                        event.setActivity((String) eventData.get("activity"));
                        event.setLocation((String) eventData.get("location"));
                        event.setStatus((String) eventData.get("status"));
                        event.setTimestamp((String) eventData.get("timestamp"));
                        event.setDescription((String) eventData.get("description"));
                        trackingEvents.add(event);
                    }
                    response.setTrackingData(trackingEvents);
                }
                
                logger.info("✅ Tracking parsed - AWB: {}, Status: {}, Location: {}", 
                    awb, currentStatus, lastLocation);
            } else {
                logger.warn("⚠️ No 'data' field in tracking response");
                response.setStatus(false);
                response.setMessage("Missing data field in tracking response");
            }
        } else {
            response.setStatus(false);
            String message = (String) responseBody.getOrDefault("message", "Unknown tracking error");
            response.setMessage(message);
            logger.error("❌ Tracking failed: {}", message);
        }
        
        return response;
    }
    
    // ✅ ENHANCED: Address parsing utilities with improved logic
    private String extractCity(String addressLine) {
        if (addressLine == null || addressLine.trim().isEmpty()) {
            return "Unknown";
        }
        
        // Clean the address
        String cleanAddress = addressLine.trim();
        
        // Split by comma and take the first meaningful part that's not just numbers
        String[] parts = cleanAddress.split("[,\\n\\r]+");
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty() && 
                !trimmed.matches("\\d+") && 
                !trimmed.toLowerCase().contains("near") &&
                !trimmed.toLowerCase().contains("opposite") &&
                trimmed.length() > 2) {
                return trimmed;
            }
        }
        
        // Fallback: split by spaces and find a meaningful word
        String[] words = cleanAddress.split("\\s+");
        for (String word : words) {
            String trimmed = word.trim();
            if (!trimmed.isEmpty() && 
                !trimmed.matches("\\d+") && 
                trimmed.length() > 3 &&
                !trimmed.toLowerCase().matches("near|opposite|house|no|street|road|lane")) {
                return trimmed;
            }
        }
        
        return "Unknown";
    }
    
    private String extractState(String addressLine) {
        if (addressLine == null || addressLine.trim().isEmpty()) {
            return "Unknown";
        }
        
        String addressLower = addressLine.toLowerCase();
        
        // Check for common state variations
        if (addressLower.contains("uttarakhand") || addressLower.contains("uk")) {
            return "Uttarakhand";
        } else if (addressLower.contains("uttar pradesh") || addressLower.contains("up")) {
            return "Uttar Pradesh";
        } else if (addressLower.contains("delhi") || addressLower.contains("new delhi")) {
            return "Delhi";
        } else if (addressLower.contains("haryana")) {
            return "Haryana";
        } else if (addressLower.contains("punjab")) {
            return "Punjab";
        } else if (addressLower.contains("rajasthan")) {
            return "Rajasthan";
        } else if (addressLower.contains("himachal pradesh") || addressLower.contains("hp")) {
            return "Himachal Pradesh";
        } else if (addressLower.contains("jammu") || addressLower.contains("kashmir")) {
            return "Jammu & Kashmir";
        } else if (addressLower.contains("chandigarh")) {
            return "Chandigarh";
        }
        
        // Default based on common northern states for your region
        return "Uttarakhand";
    }
    
    // ✅ NEW: Utility method to extract pincode from address
    private String extractPincode(String addressLine) {
        if (addressLine == null || addressLine.trim().isEmpty()) {
            return "000000";
        }
        
        // Look for 6-digit pincode pattern
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b(\\d{6})\\b");
        java.util.regex.Matcher matcher = pattern.matcher(addressLine);
        
        if (matcher.find()) {
            return matcher.group(1);
        }
        
        return "000000";
    }
    
    // ✅ NEW: Health check method
    public Map<String, Object> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            health.put("service", "NimbusPostService");
            health.put("enabled", isEnabled());
            health.put("authenticated", isTokenValid());
            health.put("baseUrl", config != null ? config.getBaseUrl() : "null");
            health.put("email", config != null ? config.getEmail() : "null");
            health.put("tokenExpiry", tokenExpiry);
            health.put("timestamp", LocalDateTime.now());
            
            if (isEnabled() && isTokenValid()) {
                health.put("status", "healthy");
            } else if (!isEnabled()) {
                health.put("status", "disabled");
            } else {
                health.put("status", "authentication_required");
            }
            
        } catch (Exception e) {
            health.put("status", "error");
            health.put("error", e.getMessage());
            logger.error("Health check failed: {}", e.getMessage());
        }
        
        return health;
    }
}