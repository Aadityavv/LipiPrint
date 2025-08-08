package com.lipiprint.backend.controller;

import com.lipiprint.backend.dto.TrackingResponse;
import com.lipiprint.backend.service.OrderService;
import com.lipiprint.backend.service.NimbusPostService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ShippingController {
    
    private static final Logger logger = LoggerFactory.getLogger(ShippingController.class);
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private NimbusPostService nimbusPostService;
    
    @PostMapping("/estimate-delivery")
    public ResponseEntity<?> estimateDelivery(@RequestBody Map<String, Object> request) {
        try {
            logger.info("[ShippingController] Delivery estimate requested from Saharanpur: {}", request);
            
            String pincode = (String) request.get("pincode");
            Double weight = request.get("weight") != null ? 
                ((Number) request.get("weight")).doubleValue() : 0.2;
            
            if (pincode == null || pincode.trim().length() != 6) {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "Valid 6-digit pincode is required")
                );
            }
            
            // Try to get real estimate from NimbusPost
            try {
                Map<String, Object> estimate = nimbusPostService.getDeliveryEstimate(pincode, weight);
                logger.info("[ShippingController] NimbusPost estimate from Saharanpur: {}", estimate);
                return ResponseEntity.ok(estimate);
            } catch (Exception nimbusError) {
                logger.warn("[ShippingController] NimbusPost unavailable, using LipiPrint Saharanpur fallback: {}", nimbusError.getMessage());
                
                // Fallback estimates for your LipiPrint Saharanpur business
                Map<String, Object> fallbackEstimate = createSaharanpurFallbackEstimate(pincode);
                return ResponseEntity.ok(fallbackEstimate);
            }
            
        } catch (Exception e) {
            logger.error("[ShippingController] Estimate delivery failed from Saharanpur: {}", e.getMessage());
            return ResponseEntity.status(500).body(
                Map.of("error", "Failed to calculate delivery estimate from Saharanpur")
            );
        }
    }
    
    @PostMapping("/rates")
    public ResponseEntity<?> getShippingRates(@RequestBody Map<String, Object> request) {
        try {
            logger.info("[ShippingController] Shipping rates requested from LipiPrint Saharanpur: {}", request);
            
            // Try NimbusPost first, fallback to fixed rates
            try {
                Map<String, Object> rates = nimbusPostService.getShippingRates(request);
                return ResponseEntity.ok(rates);
            } catch (Exception e) {
                logger.warn("[ShippingController] Using fallback rates for LipiPrint Saharanpur");
                
                // Fallback to fixed rates for your Saharanpur business
                Map<String, Object> fallbackRates = Map.of(
                    "standardDelivery", 30,
                    "expressDelivery", 50,
                    "estimatedDays", 2,
                    "note", "Fixed rates for LipiPrint Saharanpur",
                    "origin", "Saharanpur, Uttar Pradesh"
                );
                return ResponseEntity.ok(fallbackRates);
            }
            
        } catch (Exception e) {
            logger.error("[ShippingController] Get rates failed for Saharanpur: {}", e.getMessage());
            return ResponseEntity.status(500).body(
                Map.of("error", "Failed to get shipping rates from Saharanpur")
            );
        }
    }
    
    @PostMapping("/retry/{orderId}")
    public ResponseEntity<?> retryShipmentCreation(@PathVariable Long orderId) {
        try {
            logger.info("[ShippingController] Retry shipment creation for order: {} from LipiPrint Saharanpur", orderId);
            
            boolean success = orderService.retryShipmentCreation(orderId);
            
            if (success) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Shipment creation retry initiated from Saharanpur",
                    "origin", "LipiPrint Saharanpur"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Failed to retry shipment creation from Saharanpur"
                ));
            }
            
        } catch (Exception e) {
            logger.error("[ShippingController] Retry shipment failed for order {} from Saharanpur: {}", orderId, e.getMessage());
            return ResponseEntity.status(500).body(
                Map.of("error", "Retry shipment creation failed from Saharanpur")
            );
        }
    }
    
    @GetMapping("/track/{orderId}")
    public ResponseEntity<?> trackOrder(@PathVariable Long orderId) {
        try {
            logger.info("[ShippingController] Track order requested: {} from LipiPrint Saharanpur", orderId);
            TrackingResponse tracking = orderService.getOrderTracking(orderId);
            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            logger.error("Failed to track order {} from Saharanpur: {}", orderId, e.getMessage());
            return ResponseEntity.badRequest().body("Tracking failed: " + e.getMessage());
        }
    }
    
    @GetMapping("/track/awb/{awbNumber}")
    public ResponseEntity<?> trackByAwb(@PathVariable String awbNumber) {
        try {
            logger.info("[ShippingController] Track AWB requested: {} from LipiPrint Saharanpur", awbNumber);
            TrackingResponse tracking = orderService.getTrackingByAwb(awbNumber);
            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            logger.error("Failed to track AWB {} from Saharanpur: {}", awbNumber, e.getMessage());
            return ResponseEntity.badRequest().body("Tracking failed: " + e.getMessage());
        }
    }
    
    @GetMapping("/serviceability/{pincode}")
    public ResponseEntity<?> checkServiceability(@PathVariable String pincode) {
        try {
            logger.info("[ShippingController] Serviceability check from Saharanpur to: {}", pincode);
            
            if (pincode == null || pincode.trim().length() != 6) {
                return ResponseEntity.badRequest().body(
                    Map.of("serviceable", false, "error", "Invalid pincode")
                );
            }
            
            // Check if delivery is possible from Saharanpur
            Map<String, Object> serviceability = checkSaharanpurServiceability(pincode);
            return ResponseEntity.ok(serviceability);
            
        } catch (Exception e) {
            logger.error("[ShippingController] Serviceability check failed from Saharanpur: {}", e.getMessage());
            return ResponseEntity.status(500).body(
                Map.of("serviceable", false, "error", "Serviceability check failed")
            );
        }
    }
    
    // *** HELPER METHODS FOR SAHARANPUR-BASED DELIVERY ***
    
    private Map<String, Object> createSaharanpurFallbackEstimate(String pincode) {
        Map<String, Object> estimate = new HashMap<>();
        
        // Calculate delivery days based on pincode (distance from Saharanpur)
        int estimatedDays = calculateDeliveryDaysFromSaharanpur(pincode);
        int deliveryPrice = calculateDeliveryPriceFromSaharanpur(pincode);
        
        estimate.put("estimatedDays", estimatedDays);
        estimate.put("price", deliveryPrice);
        estimate.put("courierPartner", "NimbusPost Network");
        estimate.put("serviceType", "Standard Delivery");
        estimate.put("origin", "LipiPrint Saharanpur, UP");
        estimate.put("note", "Estimated delivery time from Saharanpur");
        estimate.put("supportedPincode", true);
        estimate.put("expressAvailable", estimatedDays <= 3);
        
        return estimate;
    }
    
    private Map<String, Object> checkSaharanpurServiceability(String pincode) {
        Map<String, Object> serviceability = new HashMap<>();
        
        // Most pincodes in India are serviceable from Saharanpur via NimbusPost
        boolean isServiceable = !isRestrictedPincode(pincode);
        int estimatedDays = calculateDeliveryDaysFromSaharanpur(pincode);
        
        serviceability.put("serviceable", isServiceable);
        serviceability.put("estimatedDays", estimatedDays);
        serviceability.put("origin", "Saharanpur, Uttar Pradesh 247001");
        serviceability.put("destination", pincode);
        serviceability.put("codAvailable", estimatedDays <= 4); // COD for nearby areas
        serviceability.put("expressAvailable", estimatedDays <= 2);
        
        if (!isServiceable) {
            serviceability.put("reason", "Delivery not available to this pincode from Saharanpur");
        }
        
        return serviceability;
    }
    
    private int calculateDeliveryDaysFromSaharanpur(String pincode) {
        // Delivery estimates based on distance from Saharanpur (UP 247001)
        String region = getPincodeRegion(pincode);
        
        switch (region) {
            case "LOCAL_SAHARANPUR": // Saharanpur city and nearby
                return 1;
            case "UP_WEST": // Western UP (Meerut, Ghaziabad, Noida)
                return 1;
            case "DELHI_NCR": // Delhi, Gurgaon, Faridabad
                return 1;
            case "UP_CENTRAL": // Lucknow, Kanpur, Allahabad
                return 2;
            case "UTTARAKHAND": // Dehradun, Haridwar, Nainital
                return 2;
            case "HARYANA": // Chandigarh, Ambala, Karnal
                return 2;
            case "PUNJAB": // Amritsar, Ludhiana, Jalandhar
                return 2;
            case "RAJASTHAN": // Jaipur, Jodhpur, Udaipur
                return 3;
            case "MP": // Madhya Pradesh - Bhopal, Indore
                return 3;
            case "GUJARAT": // Ahmedabad, Surat, Vadodara
                return 4;
            case "MAHARASHTRA": // Mumbai, Pune, Nagpur
                return 4;
            case "WEST_BENGAL": // Kolkata, Durgapur
                return 4;
            case "KARNATAKA": // Bangalore, Mysore
                return 5;
            case "TAMIL_NADU": // Chennai, Coimbatore
                return 5;
            case "KERALA": // Kochi, Trivandrum
                return 6;
            case "NORTHEAST": // Assam, Manipur, etc.
                return 7;
            default:
                return 3; // Default estimate
        }
    }
    
    private int calculateDeliveryPriceFromSaharanpur(String pincode) {
        String region = getPincodeRegion(pincode);
        
        // Pricing based on distance from Saharanpur
        switch (region) {
            case "LOCAL_SAHARANPUR":
                return 20; // Local delivery
            case "UP_WEST":
            case "DELHI_NCR":
                return 25; // Very close
            case "UP_CENTRAL":
            case "UTTARAKHAND":
            case "HARYANA":
            case "PUNJAB":
                return 30; // Regional
            case "RAJASTHAN":
            case "MP":
                return 35; // Extended region
            case "GUJARAT":
            case "MAHARASHTRA":
            case "WEST_BENGAL":
                return 40; // Distant states
            case "KARNATAKA":
            case "TAMIL_NADU":
                return 50; // South India
            case "KERALA":
                return 55; // Far south
            case "NORTHEAST":
                return 60; // Northeast India
            default:
                return 30; // Default price
        }
    }
    
    private String getPincodeRegion(String pincode) {
        // Pincode mapping for regions relative to Saharanpur (247001)
        
        if (pincode.startsWith("247")) return "LOCAL_SAHARANPUR";
        
        // Delhi NCR
        if (pincode.startsWith("11") || pincode.startsWith("12") || pincode.startsWith("122")) 
            return "DELHI_NCR";
            
        // UP Western (close to Saharanpur)
        if (pincode.startsWith("201") || pincode.startsWith("250") || 
            pincode.startsWith("245") || pincode.startsWith("246")) 
            return "UP_WEST";
            
        // UP Central
        if (pincode.startsWith("22") || pincode.startsWith("26") || 
            pincode.startsWith("27") || pincode.startsWith("28")) 
            return "UP_CENTRAL";
            
        // Uttarakhand (including Dehradun 248xxx)
        if (pincode.startsWith("24")) return "UTTARAKHAND";
        
        // Haryana
        if (pincode.startsWith("12") || pincode.startsWith("13") || pincode.startsWith("16")) 
            return "HARYANA";
            
        // Punjab
        if (pincode.startsWith("14") || pincode.startsWith("15")) return "PUNJAB";
        
        // Rajasthan
        if (pincode.startsWith("30") || pincode.startsWith("31") || 
            pincode.startsWith("32") || pincode.startsWith("33")) 
            return "RAJASTHAN";
            
        // Madhya Pradesh
        if (pincode.startsWith("45") || pincode.startsWith("46") || 
            pincode.startsWith("47") || pincode.startsWith("48")) 
            return "MP";
            
        // Gujarat
        if (pincode.startsWith("36") || pincode.startsWith("38") || pincode.startsWith("39")) 
            return "GUJARAT";
            
        // Maharashtra
        if (pincode.startsWith("4") && (
            pincode.startsWith("40") || pincode.startsWith("41") || 
            pincode.startsWith("42") || pincode.startsWith("43") || pincode.startsWith("44"))) 
            return "MAHARASHTRA";
            
        // West Bengal
        if (pincode.startsWith("7")) return "WEST_BENGAL";
        
        // Karnataka
        if (pincode.startsWith("5")) return "KARNATAKA";
        
        // Tamil Nadu
        if (pincode.startsWith("6")) return "TAMIL_NADU";
        
        // Kerala
        if (pincode.startsWith("67") || pincode.startsWith("68") || pincode.startsWith("69")) 
            return "KERALA";
            
        // Northeast
        if (pincode.startsWith("78") || pincode.startsWith("79") || 
            pincode.startsWith("81") || pincode.startsWith("82")) 
            return "NORTHEAST";
            
        return "OTHER";
    }
    
    private boolean isRestrictedPincode(String pincode) {
        // Very remote areas where delivery might not be available from Saharanpur
        return pincode.startsWith("797") || // Mizoram remote areas
               pincode.startsWith("798") || // Nagaland remote areas
               pincode.startsWith("792"); // Manipur remote areas
    }
}
