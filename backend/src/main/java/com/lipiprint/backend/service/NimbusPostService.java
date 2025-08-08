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
    
    // ✅ VERIFIED: Correct API endpoints from official NimbusPost collection
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
    private ObjectMapper objectMapper = new ObjectMapper();
    
    @PostConstruct
    public void authenticate() {
        if (!config.isEnabled()) {
            logger.info("NimbusPost integration is disabled for Nagpal Print House Saharanpur");
            return;
        }
        
        try {
            String authUrl = config.getBaseUrl() + LOGIN_ENDPOINT;
            
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
                    
                    // ✅ CORRECT: NimbusPost returns token in 'data' field
                    this.authToken = (String) responseBody.get("data");
                    logger.info("NimbusPost authentication successful for Nagpal Print House Saharanpur");
                } else {
                    logger.error("NimbusPost authentication failed with status: {}", response.getStatusCode());
                }
            } catch (Exception e) {
                logger.error("NimbusPost API call failed for Saharanpur: {}", e.getMessage());
                // Don't throw exception to prevent app startup failure
            }
            
        } catch (Exception e) {
            logger.error("NimbusPost configuration error for Nagpal Print House Saharanpur: {}", e.getMessage());
        }
    }
    
    public boolean isEnabled() {
        return config.isEnabled();
    }
    
    // ✅ VERIFIED: Using correct /courier/serviceability endpoint
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
            String serviceabilityUrl = config.getBaseUrl() + SERVICEABILITY_ENDPOINT;
            
            // ✅ VERIFIED: Correct request format for serviceability API
            Map<String, Object> serviceabilityRequest = new HashMap<>();
            serviceabilityRequest.put("origin", "247001"); // ✅ CORRECT: Saharanpur pincode
            serviceabilityRequest.put("destination", pincode);
            serviceabilityRequest.put("payment_type", "prepaid");
            serviceabilityRequest.put("order_amount", "100.00"); // Default amount for estimate
            serviceabilityRequest.put("weight", String.valueOf((int)(weight * 1000))); // Convert kg to grams
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
    
    // ✅ VERIFIED: Using correct serviceability endpoint
    public Map<String, Object> getShippingRates(Map<String, Object> request) {
        logger.info("[NimbusPostService] Getting shipping rates from Nagpal Print House Saharanpur: {}", request);
        
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
            String serviceabilityUrl = config.getBaseUrl() + SERVICEABILITY_ENDPOINT;
            
            // ✅ VERIFIED: Correct request format
            Map<String, Object> serviceabilityRequest = new HashMap<>();
            serviceabilityRequest.put("origin", "247001"); // ✅ CORRECT: Saharanpur pincode
            serviceabilityRequest.put("destination", request.get("delivery_pincode"));
            serviceabilityRequest.put("payment_type", request.getOrDefault("payment_type", "prepaid"));
            serviceabilityRequest.put("order_amount", request.getOrDefault("order_amount", "100.00"));
            serviceabilityRequest.put("weight", request.getOrDefault("weight", "200")); // grams
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
    
    // ✅ VERIFIED: Using correct /shipments endpoint
    public ShipmentResponse createShipment(ShipmentRequest shipmentRequest) {
        logger.info("[NimbusPostService] Creating shipment from Nagpal Print House Saharanpur: {}", shipmentRequest.getOrderId());
        
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
            String shipmentUrl = config.getBaseUrl() + SHIPMENT_ENDPOINT;
            
            // ✅ VERIFIED: Convert ShipmentRequest to NimbusPost format
            Map<String, Object> nimbusPostRequest = buildNimbusPostShipmentRequest(shipmentRequest);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(authToken);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(nimbusPostRequest, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(shipmentUrl, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
                
                // ✅ ENHANCED: Parse response with better error handling
                ShipmentResponse shipmentResponse = parseShipmentResponse(responseBody);
                
                logger.info("[NimbusPostService] Shipment created successfully from Saharanpur: {}", 
                    shipmentResponse.getAwbNumber());
                return shipmentResponse;
            } else {
                throw new RuntimeException("Failed to create shipment: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Shipment creation failed from Saharanpur: {}", e.getMessage());
            throw new RuntimeException("Shipment creation failed: " + e.getMessage());
        }
    }
    
    // ✅ VERIFIED: Using correct tracking endpoint
    public TrackingResponse trackShipment(String awbNumber) {
        logger.info("[NimbusPostService] Tracking shipment from Saharanpur: {}", awbNumber);
        
        if (!config.isEnabled()) {
            throw new RuntimeException("NimbusPost is not enabled");
        }
        
        try {
            String trackUrl = config.getBaseUrl() + TRACKING_ENDPOINT + awbNumber;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (authToken != null) {
                headers.setBearerAuth(authToken);
            }
            
            HttpEntity<?> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                trackUrl, HttpMethod.GET, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = objectMapper.readValue(response.getBody(),
                    new TypeReference<Map<String, Object>>() {});
                
                TrackingResponse trackingResponse = parseTrackingResponse(responseBody);
                
                logger.info("[NimbusPostService] Tracking successful from Saharanpur: {}", awbNumber);
                return trackingResponse;
            } else {
                throw new RuntimeException("Failed to track shipment: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Tracking failed from Saharanpur: {}", e.getMessage());
            throw new RuntimeException("Tracking failed: " + e.getMessage());
        }
    }
    
    // ✅ ENHANCED: Complete overload method for Order-based shipment creation
    public ShipmentResponse createShipment(Order order, UserAddress deliveryAddress, 
                                         String customerName, String customerEmail) {
        logger.info("[NimbusPostService] Creating shipment for Nagpal Print House order: {}", order.getId());
        
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
            ShipmentRequest shipmentRequest = buildShipmentRequest(order, deliveryAddress, customerName, customerEmail);
            return createShipment(shipmentRequest);
            
        } catch (Exception e) {
            logger.error("[NimbusPostService] Failed to create shipment for order {}: {}", order.getId(), e.getMessage());
            throw new RuntimeException("Shipment creation failed: " + e.getMessage());
        }
    }
    
    // ✅ VERIFIED: Updated cancel endpoint
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
    
    // ✅ CORRECTED: Updated for Saharanpur location with complete field mapping
    private ShipmentRequest buildShipmentRequest(Order order, UserAddress deliveryAddress, 
                                               String customerName, String customerEmail) {
        ShipmentRequest request = new ShipmentRequest();
        
        // Order details
        request.setOrderId(order.getId().toString());
        request.setOrderNumber("LP" + order.getId());
        request.setOrderAmount(order.getTotalAmount().toString());
        request.setPaymentMethod(order.getPaymentMethod() != null ? 
            order.getPaymentMethod().toString() : "PREPAID");
        
        // ✅ CORRECTED: Pickup details for Nagpal Print House Saharanpur
        request.setPickupName("Nagpal Print House");
        request.setPickupAddress("Near Civil Court Sadar, Thana Road");
        request.setPickupCity("Saharanpur");
        request.setPickupState("Uttar Pradesh");
        request.setPickupPincode("247001");
        request.setPickupPhone("+91-9876543210");
        
        // Customer delivery details
        request.setDeliveryName(customerName);
        request.setDeliveryPhone(deliveryAddress.getPhone());
        request.setDeliveryEmail(customerEmail);
        
        // ✅ Complete address parsing
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
        request.setLength(30);  // A4/A3 document package
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
    
    // ✅ VERIFIED: Convert internal ShipmentRequest to NimbusPost API format
// ✅ FIXED: Add missing support contact fields
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
    
    // ✅ CRITICAL FIX: Add mandatory support contact fields
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
    
    // Pickup details for Nagpal Print House Saharanpur
    Map<String, Object> pickup = new HashMap<>();
    pickup.put("warehouse_name", "Nagpal Print House");
    pickup.put("name", "Nagpal Print House");
    pickup.put("address", "Near Civil Court Sadar, Thana Road");
    pickup.put("city", "Saharanpur");
    pickup.put("state", "Uttar Pradesh");
    pickup.put("pincode", "247001");
    pickup.put("phone", "9876543210");
    // ✅ OPTIONAL: Add email to pickup as well
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
    
    // ✅ ADD: Log the complete request for debugging
    logger.info("[NimbusPostService] Complete shipment request: {}", request);
    
    return request;
}
    
private ShipmentResponse parseShipmentResponse(Map<String, Object> responseBody) {
        ShipmentResponse response = new ShipmentResponse();
        
        // ✅ ADD: Log the full response for debugging
        logger.info("[NimbusPostService] Full shipment response: {}", responseBody);
        
        if (responseBody != null && Boolean.TRUE.equals(responseBody.get("status"))) {
            response.setStatus(true);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
            
            if (data != null) {
                // ✅ ENHANCED: Safe extraction with logging
                String awb = (String) data.get("awb");
                String courierName = (String) data.get("courier_name");
                String shipmentId = (String) data.get("shipment_id");
                String orderId = (String) data.get("order_id");
                String courierId = (String) data.get("courier_id");
                String trackingUrl = (String) data.get("tracking_url");
                String expectedDeliveryDate = (String) data.get("expected_delivery_date");
                String labelUrl = (String) data.get("label_url");
                String manifestUrl = (String) data.get("manifest_url");
                
                logger.info("[NimbusPostService] Extracted - AWB: {}, Courier: {}, ShipmentId: {}", 
                    awb, courierName, shipmentId);
                
                response.setAwbNumber(awb);
                response.setCourierName(courierName);
                response.setShipmentId(shipmentId);
                response.setOrderId(orderId);
                response.setCourierId(courierId);
                response.setTrackingUrl(trackingUrl);
                response.setExpectedDeliveryDate(expectedDeliveryDate);
                response.setLabelUrl(labelUrl);
                response.setManifestUrl(manifestUrl);
                
                // ✅ ADD: Validation check
                if (awb == null || awb.trim().isEmpty()) {
                    logger.warn("[NimbusPostService] AWB number is null or empty in response");
                    response.setMessage("AWB number not provided by courier service");
                }
            } else {
                logger.warn("[NimbusPostService] No 'data' field in successful response");
                response.setStatus(false);
                response.setMessage("Missing data field in response");
            }
        } else {
            response.setStatus(false);
            String message = (String) responseBody.getOrDefault("message", "Unknown error");
            response.setMessage(message);
            logger.error("[NimbusPostService] Shipment creation failed: {}", message);
        }
        
        return response;
    }
    
    // ✅ ENHANCED: Complete tracking response parsing with error handling
    private TrackingResponse parseTrackingResponse(Map<String, Object> responseBody) {
        TrackingResponse response = new TrackingResponse();
        
        logger.info("[NimbusPostService] Full tracking response: {}", responseBody);
        
        if (responseBody != null && Boolean.TRUE.equals(responseBody.get("status"))) {
            response.setStatus(true);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
            
            if (data != null) {
                String awb = (String) data.get("awb");
                String currentStatus = (String) data.get("status");
                String lastLocation = (String) data.get("last_location");
                String expectedDelivery = (String) data.get("expected_delivery");
                String courierName = (String) data.get("courier_name");
                String deliveredDate = (String) data.get("delivered_date");
                
                response.setAwbNumber(awb);
                response.setCurrentStatus(currentStatus);
                response.setLastLocation(lastLocation);
                response.setExpectedDeliveryDate(expectedDelivery);
                response.setCourierName(courierName);
                response.setDeliveredDate(deliveredDate);
                
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
                
                logger.info("[NimbusPostService] Tracking parsed - AWB: {}, Status: {}, Location: {}", 
                    awb, currentStatus, lastLocation);
            } else {
                logger.warn("[NimbusPostService] No 'data' field in tracking response");
                response.setStatus(false);
                response.setMessage("Missing data field in tracking response");
            }
        } else {
            response.setStatus(false);
            String message = (String) responseBody.getOrDefault("message", "Unknown tracking error");
            response.setMessage(message);
            logger.error("[NimbusPostService] Tracking failed: {}", message);
        }
        
        return response;
    }
    
    // ✅ UTILITY: Helper methods for address parsing
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
