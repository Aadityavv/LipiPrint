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
            
            // Validate configuration
            if (config.getEmail() == null || config.getEmail().trim().isEmpty()) {
                logger.error("❌ NimbusPost email is not configured");
                return;
            }
            
            if (config.getPassword() == null || config.getPassword().trim().isEmpty()) {
                logger.error("❌ NimbusPost password is not configured");
                return;
            }
            
            Map<String, String> authRequest = new HashMap<>();
            authRequest.put("email", config.getEmail());
            authRequest.put("password", config.getPassword());
            
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
                
                if (response.getStatusCode() == HttpStatus.OK) {
                    Map<String, Object> responseBody = objectMapper.readValue(response.getBody(), 
                        new TypeReference<Map<String, Object>>() {});
                    
                    // Log the full response structure for debugging
                    logger.info("📊 Full Response Structure: {}", responseBody);
                    
                    // Extract token from response
                    if (responseBody.containsKey("data")) {
                        this.authToken = (String) responseBody.get("data");
                    } else if (responseBody.containsKey("token")) {
                        this.authToken = (String) responseBody.get("token");
                    } else if (responseBody.containsKey("access_token")) {
                        this.authToken = (String) responseBody.get("access_token");
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
                    }
                } else {
                    logger.error("❌ Authentication failed with HTTP status: {}", response.getStatusCode());
                    logger.error("Response body: {}", response.getBody());
                }
                
            } catch (HttpClientErrorException e) {
                logger.error("❌ HTTP Client Error during authentication: {}", e.getStatusCode());
                logger.error("Error body: {}", e.getResponseBodyAsString());
            } catch (HttpServerErrorException e) {
                logger.error("❌ HTTP Server Error during authentication: {}", e.getStatusCode());
                logger.error("Error body: {}", e.getResponseBodyAsString());
            } catch (Exception e) {
                logger.error("❌ Network/Parse error during authentication: {}", e.getMessage(), e);
            }
            
        } catch (Exception e) {
            logger.error("❌ Configuration error for NimbusPost: {}", e.getMessage(), e);
        }
    }
    
    // ✅ ENHANCED: Token validation with expiry check
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
    
    // ✅ ENHANCED: Automatic re-authentication
    private void ensureAuthenticated() {
        if (!isTokenValid()) {
            logger.info("🔄 Re-authenticating with NimbusPost...");
            authenticate();
            if (!isTokenValid()) {
                throw new RuntimeException("NimbusPost authentication failed after retry");
            }
        }
    }
    
    public boolean isEnabled() {
        return config.isEnabled();
    }
    
    // ✅ ENHANCED: Delivery estimate with better error handling
    public Map<String, Object> getDeliveryEstimate(String pincode, Double weight) {
        logger.info("[NimbusPostService] Getting delivery estimate from Saharanpur to pincode: {}", pincode);
        
        if (!config.isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        ensureAuthenticated();
        
        try {
            String serviceabilityUrl = config.getBaseUrl() + SERVICEABILITY_ENDPOINT;
            
            Map<String, Object> serviceabilityRequest = new HashMap<>();
            serviceabilityRequest.put("origin", "247001"); // Saharanpur pincode
            serviceabilityRequest.put("destination", pincode);
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
            ResponseEntity<String> response = restTemplate.postForEntity(serviceabilityUrl, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
                logger.info("[NimbusPostService] Delivery estimate successful: {}", responseBody);
                return responseBody;
            } else {
                throw new RuntimeException("Failed to get delivery estimate: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Delivery estimate failed: {}", e.getMessage());
            throw new RuntimeException("Delivery estimate failed: " + e.getMessage());
        }
    }
    
    // ✅ ENHANCED: Shipping rates with authentication retry
    public Map<String, Object> getShippingRates(Map<String, Object> request) {
        logger.info("[NimbusPostService] Getting shipping rates from Nagpal Print House: {}", request);
        
        if (!config.isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        ensureAuthenticated();
        
        try {
            String serviceabilityUrl = config.getBaseUrl() + SERVICEABILITY_ENDPOINT;
            
            Map<String, Object> serviceabilityRequest = new HashMap<>();
            serviceabilityRequest.put("origin", "247001");
            serviceabilityRequest.put("destination", request.get("delivery_pincode"));
            serviceabilityRequest.put("payment_type", request.getOrDefault("payment_type", "prepaid"));
            serviceabilityRequest.put("order_amount", request.getOrDefault("order_amount", "100.00"));
            serviceabilityRequest.put("weight", request.getOrDefault("weight", "200"));
            serviceabilityRequest.put("length", request.getOrDefault("length", "30"));
            serviceabilityRequest.put("breadth", request.getOrDefault("breadth", "25"));
            serviceabilityRequest.put("height", request.getOrDefault("height", "2"));
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(authToken);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(serviceabilityRequest, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(serviceabilityUrl, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
                logger.info("[NimbusPostService] Shipping rates successful: {}", responseBody);
                return responseBody;
            } else {
                throw new RuntimeException("Failed to get shipping rates: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Shipping rates failed: {}", e.getMessage());
            throw new RuntimeException("Shipping rates failed: " + e.getMessage());
        }
    }
    
    // ✅ ENHANCED: Shipment creation with comprehensive logging
    public ShipmentResponse createShipment(ShipmentRequest shipmentRequest) {
        logger.info("========================================");
        logger.info("CREATING SHIPMENT FROM NAGPAL PRINT HOUSE");
        logger.info("Order ID: {}", shipmentRequest.getOrderId());
        logger.info("========================================");
        
        if (!config.isEnabled()) {
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
            
            if (response.getStatusCode() == HttpStatus.OK) {
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
    
    // ✅ ENHANCED: Tracking with better error handling
    public TrackingResponse trackShipment(String awbNumber) {
        logger.info("[NimbusPostService] Tracking shipment: {}", awbNumber);
        
        if (!config.isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        try {
            String trackUrl = config.getBaseUrl() + TRACKING_ENDPOINT + awbNumber;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (isTokenValid()) {
                headers.setBearerAuth(authToken);
            }
            
            HttpEntity<?> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                trackUrl, HttpMethod.GET, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
                
                TrackingResponse trackingResponse = parseTrackingResponse(responseBody);
                logger.info("[NimbusPostService] Tracking successful: {}", awbNumber);
                return trackingResponse;
            } else {
                throw new RuntimeException("Failed to track shipment: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Tracking failed: {}", e.getMessage());
            throw new RuntimeException("Tracking failed: " + e.getMessage());
        }
    }
    
    // ✅ ENHANCED: Order-based shipment creation
    public ShipmentResponse createShipment(Order order, UserAddress deliveryAddress, 
                                         String customerName, String customerEmail) {
        logger.info("[NimbusPostService] Creating shipment for order: {}", order.getId());
        
        if (!isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        ensureAuthenticated();
        
        try {
            ShipmentRequest shipmentRequest = buildShipmentRequest(order, deliveryAddress, customerName, customerEmail);
            return createShipment(shipmentRequest);
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Failed to create shipment for order {}: {}", order.getId(), e.getMessage());
            throw new RuntimeException("Shipment creation failed: " + e.getMessage());
        }
    }
    
    // ✅ ENHANCED: Cancel shipment
    public void cancelShipment(String awbNumber) {
        logger.info("[NimbusPostService] Cancelling shipment: {}", awbNumber);
        
        if (!isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        ensureAuthenticated();
        
        try {
            String cancelUrl = config.getBaseUrl() + CANCEL_ENDPOINT;
            
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
    
    // ✅ ENHANCED: Build shipment request for Nagpal Print House
    private ShipmentRequest buildShipmentRequest(Order order, UserAddress deliveryAddress, 
                                               String customerName, String customerEmail) {
        ShipmentRequest request = new ShipmentRequest();
        
        // Order details
        request.setOrderId(order.getId().toString());
        request.setOrderNumber("LP" + order.getId());
        request.setOrderAmount(order.getTotalAmount().toString());
        request.setPaymentMethod(order.getPaymentMethod() != null ? 
            order.getPaymentMethod().toString() : "PREPAID");
        
        // Pickup details for Nagpal Print House Saharanpur
        request.setPickupName("Nagpal Print House");
        request.setPickupAddress("Near Civil Court Sadar, Thana Road");
        request.setPickupCity("Saharanpur");
        request.setPickupState("Uttar Pradesh");
        request.setPickupPincode("247001");
        request.setPickupPhone("+91-9837775757");
        
        // Customer delivery details
        request.setDeliveryName(customerName);
        request.setDeliveryPhone(deliveryAddress.getPhone());
        request.setDeliveryEmail(customerEmail);
        
        // Complete address parsing
        String fullAddress = deliveryAddress.getLine1();
        if (deliveryAddress.getLine2() != null && !deliveryAddress.getLine2().trim().isEmpty()) {
            fullAddress += ", " + deliveryAddress.getLine2();
        }
        request.setDeliveryAddress(fullAddress);
        request.setDeliveryCity(extractCity(deliveryAddress.getLine3()));
        request.setDeliveryState(extractState(deliveryAddress.getLine3()));
        request.setDeliveryPincode(extractPincode(deliveryAddress.getLine3()));
        
        // Package details for document printing
        request.setWeight(0.2);
        request.setLength(30);
        request.setBreadth(25);
        request.setHeight(2);
        
        // Service details
        Double codAmount = 0.0;
        if (order.getPaymentMethod() == Order.PaymentMethod.COD) {
            codAmount = order.getTotalAmount();
        }
        request.setCodAmount(codAmount);
        request.setProductDescription("Printed Documents - Nagpal Print House Saharanpur");
        request.setInvoiceNumber("LP" + order.getId());
        
        return request;
    }
    
    // ✅ ENHANCED: Build NimbusPost API request
    private Map<String, Object> buildNimbusPostShipmentRequest(ShipmentRequest shipmentRequest) {
        Map<String, Object> request = new HashMap<>();
        
        // Order details
        request.put("order_number", shipmentRequest.getOrderNumber());
        request.put("shipping_charges", 30);
        request.put("payment_type", shipmentRequest.getPaymentMethod().toLowerCase().contains("cod") ? "cod" : "prepaid");
        request.put("order_amount", Double.parseDouble(shipmentRequest.getOrderAmount()));
        request.put("package_weight", (int)(shipmentRequest.getWeight() * 1000));
        request.put("package_length", shipmentRequest.getLength());
        request.put("package_breadth", shipmentRequest.getBreadth());
        request.put("package_height", shipmentRequest.getHeight());
        request.put("request_auto_pickup", "yes");
        
        // ✅ CRITICAL: Support contact fields
        request.put("support_email", "nagpalprinthouse@gmail.com");
        request.put("support_phone", "9358319000");
        
        // Consignee details
        Map<String, Object> consignee = new HashMap<>();
        consignee.put("name", shipmentRequest.getDeliveryName());
        consignee.put("address", shipmentRequest.getDeliveryAddress());
        consignee.put("address_2", "");
        consignee.put("city", shipmentRequest.getDeliveryCity());
        consignee.put("state", shipmentRequest.getDeliveryState());
        consignee.put("pincode", shipmentRequest.getDeliveryPincode());
        consignee.put("phone", shipmentRequest.getDeliveryPhone());
        request.put("consignee", consignee);
        
        // Pickup details for Nagpal Print House
        Map<String, Object> pickup = new HashMap<>();
        pickup.put("warehouse_name", "Nagpal Print House");
        pickup.put("name", "Nagpal Print House");
        pickup.put("address", "Near Civil Court Sadar, Thana Road");
        pickup.put("city", "Saharanpur");
        pickup.put("state", "Uttar Pradesh");
        pickup.put("pincode", "247001");
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
        
        logger.info("📋 Complete shipment request payload: {}", request);
        
        return request;
    }
    
    // ✅ ENHANCED: Parse shipment response
    private ShipmentResponse parseShipmentResponse(Map<String, Object> responseBody) {
        ShipmentResponse response = new ShipmentResponse();
        
        logger.info("📊 Parsing shipment response: {}", responseBody);
        
        if (responseBody != null && Boolean.TRUE.equals(responseBody.get("status"))) {
            response.setStatus(true);
            
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
                }
            } else {
                logger.warn("⚠️ No 'data' field in successful response");
                response.setStatus(false);
                response.setMessage("Missing data field in response");
            }
        } else {
            response.setStatus(false);
            String message = (String) responseBody.getOrDefault("message", "Unknown error");
            response.setMessage(message);
            logger.error("❌ Shipment creation failed: {}", message);
        }
        
        return response;
    }
    
    // ✅ ENHANCED: Parse tracking response
    private TrackingResponse parseTrackingResponse(Map<String, Object> responseBody) {
        TrackingResponse response = new TrackingResponse();
        
        logger.info("📊 Parsing tracking response: {}", responseBody);
        
        if (responseBody != null && Boolean.TRUE.equals(responseBody.get("status"))) {
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
    
    // ✅ ENHANCED: Address parsing utilities
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
        String addressLower = addressLine.toLowerCase();
        if (addressLower.contains("up") || addressLower.contains("uttar pradesh")) {
            return "Uttar Pradesh";
        } else if (addressLower.contains("uttarakhand")) {
            return "Uttarakhand";
        } else if (addressLower.contains("delhi")) {
            return "Delhi";
        } else if (addressLower.contains("haryana")) {
            return "Haryana";
        } else if (addressLower.contains("punjab")) {
            return "Punjab";
        } else if (addressLower.contains("rajasthan")) {
            return "Rajasthan";
        }
        return "Unknown";
    }
}
