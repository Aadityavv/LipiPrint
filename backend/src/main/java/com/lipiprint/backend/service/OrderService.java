package com.lipiprint.backend.service;

import com.lipiprint.backend.entity.Order;
import com.lipiprint.backend.entity.UserAddress;
import com.lipiprint.backend.repository.OrderRepository;
import com.lipiprint.backend.repository.UserAddressRepository;
import com.lipiprint.backend.dto.ShipmentResponse;
import com.lipiprint.backend.dto.TrackingResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import java.util.Map;
import com.lipiprint.backend.entity.Payment;
import com.lipiprint.backend.repository.PaymentRepository;
import com.lipiprint.backend.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.lipiprint.backend.entity.User;
import java.util.ArrayList;
import com.lipiprint.backend.service.ScheduledStatusUpdateService;
import com.lipiprint.backend.dto.OrderListDTO;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class OrderService {
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private UserAddressRepository userAddressRepository;

    // *** NEW NIMBUSPOST SERVICE ***
    @Autowired
    private NimbusPostService nimbusPostService;

    @Value("${razorpay.key_id}")
    private String razorpayKeyId;

    @Value("${razorpay.key_secret}")
    private String razorpayKeySecret;

    public Order save(Order order, String razorpayOrderId) {
        logger.info("[OrderService] save called with order: {}, razorpayOrderId: {}", order, razorpayOrderId);
        Order savedOrder = orderRepository.save(order);
        
        if (razorpayOrderId != null) {
            paymentRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(payment -> {
                payment.setOrder(savedOrder);
                paymentRepository.save(payment);
                logger.info("[OrderService] Linked payment {} to order {}", payment.getId(), savedOrder.getId());
            });
        }
        
        // Removed automatic shipment creation on save
        logger.info("[OrderService] Order saved: {}", savedOrder);
        return savedOrder;
    }
    
    public Order save(Order order, String razorpayOrderId, String razorpayPaymentId) {
        logger.info("[OrderService] save called with order: {}, razorpayOrderId: {}, razorpayPaymentId: {}", 
                   order, razorpayOrderId, razorpayPaymentId);
        Order savedOrder = orderRepository.save(order);
        
        if (razorpayOrderId != null) {
            Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseGet(() -> {
                    Payment newPayment = new Payment();
                    newPayment.setRazorpayOrderId(razorpayOrderId);
                    newPayment.setStatus(Payment.Status.PENDING);
                    return newPayment;
                });
            
            // Update payment with payment ID if available
            if (razorpayPaymentId != null) {
                payment.setRazorpayPaymentId(razorpayPaymentId);
                payment.setStatus(Payment.Status.SUCCESS);
            }
            
            payment.setOrder(savedOrder);
            paymentRepository.save(payment);
            logger.info("[OrderService] Linked payment {} to order {}", payment.getId(), savedOrder.getId());
        }
        
        logger.info("[OrderService] Order saved: {}", savedOrder);
        return savedOrder;
    }

    // *** NEW NIMBUSPOST INTEGRATION METHODS ***
    private void processShipment(Order order) {
        // Only create shipment for delivery orders and if not already created
        if (order.isDeliveryOrder() && !Boolean.TRUE.equals(order.getShippingCreated()) && nimbusPostService.isEnabled()) {
            try {
                // Get delivery address from the order's delivery address string
                UserAddress deliveryAddress = parseDeliveryAddress(order);
                if (deliveryAddress == null) {
                    logger.warn("No valid delivery address found for order {}", order.getId());
                    return;
                }
                
                // Get customer details
                String customerName = order.getUser() != null ? order.getUser().getName() : "Customer";
                String customerEmail = order.getUser() != null ? order.getUser().getEmail() : "customer@lipiprint.com";
                
                // Create shipment
                ShipmentResponse shipmentResponse = nimbusPostService.createShipment(
                    order, deliveryAddress, customerName, customerEmail);
                
                if (shipmentResponse != null && shipmentResponse.isStatus()) {
                    // Update order with shipping details
                    order.setAwbNumber(shipmentResponse.getAwbNumber());
                    order.setCourierName(shipmentResponse.getCourierName());
                    order.setTrackingUrl(shipmentResponse.getLabelUrl());
                    order.setShipmentId(shipmentResponse.getShipmentId());
                    order.setCourierId(shipmentResponse.getCourierId());
                    order.setShippingCreated(true);
                    
                    // Parse expected delivery date if available
                    if (shipmentResponse.getExpectedDeliveryDate() != null && !shipmentResponse.getExpectedDeliveryDate().isEmpty()) {
                        try {
                            LocalDateTime expectedDate = parseDeliveryDate(shipmentResponse.getExpectedDeliveryDate());
                            order.setExpectedDeliveryDate(expectedDate);
                        } catch (Exception e) {
                            logger.warn("Failed to parse expected delivery date '{}': {}", 
                                shipmentResponse.getExpectedDeliveryDate(), e.getMessage());
                        }
                    }
                    
                    // Save updated order
                    orderRepository.save(order);
                    
                    logger.info("Shipment created successfully for order {} with AWB: {}", 
                        order.getId(), shipmentResponse.getAwbNumber());
                    
                } else {
                    logger.error("Failed to create shipment for order {}: {}", 
                        order.getId(), shipmentResponse != null ? shipmentResponse.getMessage() : "Unknown error");
                }
                
            } catch (Exception e) {
                logger.error("Failed to create NimbusPost shipment for order {}: {}", order.getId(), e.getMessage());
                // Don't fail the order creation, just log the error
            }
        }
    }

    private UserAddress parseDeliveryAddress(Order order) {
        if (order.getDeliveryAddress() == null || order.getDeliveryAddress().trim().isEmpty()) {
            return null;
        }

        // ✅ UPDATED: Create UserAddress with proper field mapping
        UserAddress address = new UserAddress();
        String fullAddress = order.getDeliveryAddress().trim();
        
        // Split the address into parts (assuming comma-separated format)
        String[] parts = fullAddress.split(",");
        
        if (parts.length >= 3) {
            address.setLine1(parts[0].trim());
            address.setLine2(parts[1].trim());
            address.setLine3(parts[2].trim());
            
            // ✅ NEW: Extract city, state, pincode from line3 or use defaults
            if (parts.length >= 6) {
                // Format: line1, line2, line3, city, state, pincode
                address.setCity(parts[3].trim());
                address.setState(parts[4].trim());
                address.setPincode(parts[5].trim());
            } else {
                // ✅ BETTER: Parse from line3 or extract from order if available
                extractLocationFromLine3(address, parts[2].trim());
            }
        } else {
            // Handle insufficient parts
            address.setLine1(fullAddress);
            address.setLine2("Saharanpur");
            address.setLine3("Saharanpur, UP 247001");
            address.setCity("Saharanpur");
            address.setState("Uttar Pradesh");
            address.setPincode("247001");
        }
        
        // Set phone from order
        if (order.getPhone() != null && !order.getPhone().trim().isEmpty()) {
            address.setPhone(order.getPhone());
        } else if (order.getUser() != null && order.getUser().getPhone() != null) {
            address.setPhone(order.getUser().getPhone());
        } else {
            address.setPhone("9999999999"); // Default phone
        }
        
        return address;
    }

    // ✅ NEW HELPER METHOD
    private void extractLocationFromLine3(UserAddress address, String line3) {
        // Extract pincode using regex
        java.util.regex.Pattern pincodePattern = java.util.regex.Pattern.compile("\\b(\\d{6})\\b");
        java.util.regex.Matcher matcher = pincodePattern.matcher(line3);
        
        if (matcher.find()) {
            address.setPincode(matcher.group(1));
        } else {
            address.setPincode("247001"); // Default to Saharanpur
        }
        
        // Extract state and city from line3
        String line3Lower = line3.toLowerCase();
        if (line3Lower.contains("up") || line3Lower.contains("uttar pradesh")) {
            address.setState("Uttar Pradesh");
        } else if (line3Lower.contains("uttarakhand")) {
            address.setState("Uttarakhand");
        } else if (line3Lower.contains("delhi")) {
            address.setState("Delhi");
        } else {
            address.setState("Uttar Pradesh"); // Default
        }
        
        // Extract city (first word before comma or state)
        String[] cityParts = line3.split("[,\\s]+");
        if (cityParts.length > 0) {
            address.setCity(cityParts[0].trim());
        } else {
            address.setCity("Saharanpur"); // Default
        }
    }

    private LocalDateTime parseDeliveryDate(String dateString) {
        try {
            // Try different date formats that NimbusPost might return
            String[] formats = {
                "yyyy-MM-dd",
                "dd-MM-yyyy",
                "yyyy-MM-dd HH:mm:ss",
                "dd-MM-yyyy HH:mm:ss"
            };
            
            for (String format : formats) {
                try {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
                    if (format.contains("HH:mm:ss")) {
                        return LocalDateTime.parse(dateString, formatter);
                    } else {
                        return LocalDateTime.parse(dateString + " 00:00:00", 
                            DateTimeFormatter.ofPattern(format + " HH:mm:ss"));
                    }
                } catch (Exception ignored) {
                    // Try next format
                }
            }
        } catch (Exception e) {
            logger.warn("Could not parse delivery date: {}", dateString);
        }
        
        // Default to 3 days from now if parsing fails
        return LocalDateTime.now().plusDays(3);
    }

    // *** NEW TRACKING METHODS ***
    public TrackingResponse getOrderTracking(Long orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
            
        if (order.hasShippingInfo()) {
            return nimbusPostService.trackShipment(order.getAwbNumber());
        }
        
        throw new RuntimeException("No tracking available for this order. Order may be for pickup or shipping not yet created.");
    }

    public TrackingResponse getTrackingByAwb(String awbNumber) {
        if (awbNumber == null || awbNumber.trim().isEmpty()) {
            throw new RuntimeException("AWB number cannot be empty");
        }
        return nimbusPostService.trackShipment(awbNumber);
    }

    public boolean retryShipmentCreation(Long orderId) {
        try {
            logger.info("[OrderService] Retrying shipment creation for LipiPrint Saharanpur order: {}", orderId);
            
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (!orderOpt.isPresent()) {
                logger.error("[OrderService] Order not found for retry: {}", orderId);
                return false;
            }
            
            Order order = orderOpt.get();
            
            // Validate order can be retried
            if (!order.isDeliveryOrder()) {
                logger.warn("[OrderService] Cannot retry shipment for pickup order: {}", orderId);
                return false;
            }
            
            if (order.getStatus() == Order.Status.CANCELLED || 
                order.getStatus() == Order.Status.DELIVERED) {
                logger.warn("[OrderService] Cannot retry shipment for order {} with status: {}", orderId, order.getStatus());
                return false;
            }
            
            // Reset shipping flags for retry
            order.setShippingCreated(false);
            order.setAwbNumber(null);
            order.setCourierName(null);
            order.setTrackingUrl(null);
            order.setShipmentId(null);
            order.setCourierId(null);
            order.setExpectedDeliveryDate(null);
            
            // Save order with reset flags
            orderRepository.save(order);
            
            // Attempt to create shipment again
            processShipment(order);
            
            // Check if shipment was successfully created
            Order updatedOrder = orderRepository.findById(orderId).orElse(order);
            boolean success = Boolean.TRUE.equals(updatedOrder.getShippingCreated()) && 
                             updatedOrder.getAwbNumber() != null && 
                             !updatedOrder.getAwbNumber().isEmpty();
            
            if (success) {
                logger.info("[OrderService] Shipment retry successful for order {}: AWB = {}", 
                    orderId, updatedOrder.getAwbNumber());
            } else {
                logger.error("[OrderService] Shipment retry failed for order {}", orderId);
            }
            
            return success;
            
        } catch (Exception e) {
            logger.error("[OrderService] Failed to retry shipment creation for order {}: {}", orderId, e.getMessage());
            return false;
        }
    }

    // *** EXISTING METHODS REMAIN UNCHANGED ***
    public Optional<Order> findById(Long id) {
        return orderRepository.findById(id);
    }

    public List<Order> findAll() {
        return orderRepository.findAll();
    }

    public Page<Order> findAllPaged(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }
    
    public Page<Order> findAllByStatusPaged(String status, Pageable pageable) {
        try {
            return orderRepository.findByStatus(Order.Status.valueOf(status.toUpperCase()), pageable);
        } catch (Exception e) {
            return Page.empty();
        }
    }
    
    public Page<Order> findAllByUserPaged(User user, Pageable pageable) {
        try {
            return orderRepository.findByUserId(user.getId(), pageable);
        } catch (Exception e) {
            return Page.empty();
        }
    }

    public List<Order> findAllByStatus(String status) {
        try {
            return orderRepository.findAll().stream()
                .filter(o -> o.getStatus() != null && o.getStatus().name().equalsIgnoreCase(status))
                .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    public void cancelShipment(Long orderId) {
        try {
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
                
            if (order.getAwbNumber() != null && nimbusPostService.isEnabled()) {
                nimbusPostService.cancelShipment(order.getAwbNumber());
                order.setAwbNumber(null);
                order.setShippingCreated(false);
                orderRepository.save(order);
                logger.info("[OrderService] Shipment cancelled for order: {}", orderId);
            }
        } catch (Exception e) {
            logger.error("[OrderService] Failed to cancel shipment for order {}: {}", orderId, e.getMessage());
            throw new RuntimeException("Failed to cancel shipment: " + e.getMessage());
        }
    }

    public List<Order> findPendingShipments() {
        return orderRepository.findAll().stream()
            .filter(order -> order.isDeliveryOrder() && 
                            !Boolean.TRUE.equals(order.getShippingCreated()) &&
                            order.getStatus() != Order.Status.CANCELLED)
            .toList();
    }

    public void updateOrderStatus(Long orderId, Order.Status newStatus) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        
        Order.Status oldStatus = order.getStatus();
        order.setStatus(newStatus);
        orderRepository.save(order);
        
        // Trigger shipment only when transitioning to COMPLETED for delivery orders
        if (newStatus == Order.Status.COMPLETED && order.canBeShipped()) {
            processShipment(order);
        }
        
        logger.info("[OrderService] Order {} status updated: {} -> {}", orderId, oldStatus, newStatus);
    }
    
    // ✅ NEW: Update order status from NimbusPost webhook/API
    public boolean updateOrderStatusFromNimbusPost(String awbNumber, String nimbusStatus, String activity, 
                                                   String currentLocation, String eventTime) {
        try {
            logger.info("[OrderService] Updating order status from NimbusPost - AWB: {}, Status: {}", awbNumber, nimbusStatus);
            
            // Find order by AWB number
            List<Order> orders = orderRepository.findAll().stream()
                .filter(order -> awbNumber.equals(order.getAwbNumber()))
                .toList();
            
            if (orders.isEmpty()) {
                logger.warn("[OrderService] No order found for AWB: {}", awbNumber);
                return false;
            }
            
            Order order = orders.get(0); // Take first one (should be unique)
            Order.Status oldStatus = order.getStatus();
            
            // Map NimbusPost status to order status
            Order.Status newStatus = mapNimbusPostStatusToOrderStatus(nimbusStatus, activity);
            
            if (newStatus == null) {
                logger.warn("[OrderService] Unable to map NimbusPost status '{}' with activity '{}' to Order status", 
                    nimbusStatus, activity);
                return false;
            }
            
            // Update order status
            order.setStatus(newStatus);
            orderRepository.save(order);
            
            logger.info("[OrderService] Order {} (AWB: {}) status updated from NimbusPost: {} -> {} (NimbusPost: {})", 
                order.getId(), awbNumber, oldStatus, newStatus, nimbusStatus);
            
            return true;
            
        } catch (Exception e) {
            logger.error("[OrderService] Failed to update order status from NimbusPost - AWB: {}, Error: {}", 
                awbNumber, e.getMessage());
            return false;
        }
    }
    
    // ✅ NEW: Map NimbusPost status to Order status
    private Order.Status mapNimbusPostStatusToOrderStatus(String nimbusStatus, String activity) {
        if (nimbusStatus == null) return null;
        
        String nimbusLower = nimbusStatus.toLowerCase();
        String activityLower = activity != null ? activity.toLowerCase() : "";
        
        // Handle "Out for delivery" specifically based on status/activity
        if (nimbusLower.contains("out") || nimbusLower.contains("delivery") || 
            activityLower.contains("out for delivery") || activityLower.contains("dispatched")) {
            return Order.Status.OUT_FOR_DELIVERY;
        }
        
        // Handle other statuses
        if (nimbusLower.contains("delivered") || nimbusLower.contains("completed")) {
            return Order.Status.DELIVERED;
        }
        
        if (nimbusLower.contains("shipped") || nimbusLower.contains("dispatched")) {
            return Order.Status.SHIPPED;
        }
        
        if (nimbusLower.contains("pending") || nimbusLower.contains("picked up")) {
            return Order.Status.PROCESSING;
        }
        
        return null; // Unknown status, no update
    }
    
    // ✅ NEW: Update all order statuses from NimbusPost (for scheduled task integration)
    public List<Order> updateOrderStatusesFromNimbusPost() {
        try {
            logger.info("[OrderService] Triggering manual update for all shipped order statuses via NimbusPost");
            
            // Get all orders with shipping info
            List<Order> shippedOrders = orderRepository.findAll().stream()
                .filter(Order::hasShippingInfo)
                .filter(o -> Boolean.TRUE.equals(o.getShippingCreated()))
                .toList();
                
            int updatedCount = 0;
            for (Order order : shippedOrders) {
                try {
                    if (updateOrderStatusIfChanged(order)) {
                        updatedCount++;
                        logger.info("[OrderService] Updated order {} from manual NimbusPost check", order.getId());
                    }
                } catch (Exception e) {
                    logger.error("[OrderService] Error updating order {}: {}", order.getId(), e.getMessage());
                }
            }
            
            logger.info("[OrderService] Completed manual status update: {} orders updated out of {}", 
                updatedCount, shippedOrders.size());
            return shippedOrders;
            
        } catch (Exception e) {
            logger.error("[OrderService] Failed to trigger order status updates: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
    
    // ✅ NEW: Update single order status manually
    public boolean updateSingleOrderStatus(Long orderId) {
        try {
            logger.info("[OrderService] Triggering manual update for order {} status", orderId);
            
            return orderRepository.findById(orderId)
                .map(order -> {
                    if (!order.hasShippingInfo() || !Boolean.TRUE.equals(order.getShippingCreated())) {
                        logger.warn("[OrderService] Order {} has no shipping info or not shipped yet", orderId);
                        return false;
                    }
                    return updateOrderStatusIfChanged(order);
                })
                .orElse(false);
                
        } catch (Exception e) {
            logger.error("[OrderService] Failed to trigger update for order {}: {}", orderId, e.getMessage());
            return false;
        }
    }
    
    // ✅ HELPER: Update order status if changed in NimbusPost API
    private boolean updateOrderStatusIfChanged(Order order) {
        try {
            logger.debug("[OrderService] Checking status for order {} with AWB: {}", 
                order.getId(), order.getAwbNumber());
            
            // Get latest status from NimbusPost API
            TrackingResponse trackingResponse = nimbusPostService.trackShipment(order.getAwbNumber());
            
            if (trackingResponse == null || !Boolean.TRUE.equals(trackingResponse.isStatus())) {
                logger.warn("[OrderService] Failed to get tracking info for order {} AWB: {}", 
                    order.getId(), order.getAwbNumber());
                return false;
            }
            
            String nimbusStatus = trackingResponse.getCurrentStatus();
            String activity = trackingResponse.getTrackingData() != null && !trackingResponse.getTrackingData().isEmpty() 
                ? trackingResponse.getTrackingData().get(0).getActivity()
                : null;
            
            if (nimbusStatus == null) {
                logger.debug("[OrderService] No status returned from NimbusPost for order {} AWB: {}", 
                    order.getId(), order.getAwbNumber());
                return false;
            }
            
            // Update using the service method (reuses existing logic)
            return updateOrderStatusFromNimbusPost(
                order.getAwbNumber(), 
                nimbusStatus, 
                activity, 
                trackingResponse.getLastLocation(), 
                trackingResponse.getTrackingData() != null && !trackingResponse.getTrackingData().isEmpty()
                    ? trackingResponse.getTrackingData().get(0).getDate()
                    : null
            );
            
        } catch (Exception e) {
            logger.error("[OrderService] Error tracking order {} AWB: {} - Error: {}", 
                order.getId(), order.getAwbNumber(), e.getMessage());
            return false;
        }
    }

    public JSONObject createRazorpayOrder(int amount, String currency, String receipt, Long userId) throws RazorpayException {
        logger.info("[OrderService] createRazorpayOrder called with amount={}, currency={}, receipt={}, userId={}", amount, currency, receipt, userId);
        RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amount);
        orderRequest.put("currency", currency);
        orderRequest.put("receipt", receipt);
        orderRequest.put("payment_capture", 1);
        JSONObject razorpayOrder = razorpay.orders.create(orderRequest).toJson();
        logger.info("[OrderService] Razorpay order created: {}", razorpayOrder);
        
        Payment payment = new Payment();
        payment.setRazorpayOrderId(razorpayOrder.getString("id"));
        payment.setStatus(Payment.Status.PENDING);
        payment.setAmount(amount / 100.0);
        if (userId != null) {
            userService.findById(userId).ifPresent(payment::setUser);
        }
        paymentRepository.save(payment);
        logger.info("[OrderService] Payment record created: {}", payment);
        return razorpayOrder;
    }

    public List<Map<String, Object>> getOrderTrendsLast7Days() {
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Object[] row : orderRepository.getOrderCountByDayLast7Days()) {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("date", row[0]);
            map.put("count", row[1]);
            result.add(map);
        }
        return result;
    }

    public List<Map<String, Object>> getRevenueTrendsLast7Days() {
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        var statuses = java.util.Arrays.asList("COMPLETED", "DELIVERED");
        for (Object[] row : orderRepository.getRevenueByDayLast7Days(statuses)) {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("date", row[0]);
            map.put("revenue", row[1]);
            result.add(map);
        }
        return result;
    }

    public long getTotalOrderCount() {
        return orderRepository.count();
    }

    public long getPendingOrderCount() {
        return orderRepository.countByStatus(com.lipiprint.backend.entity.Order.Status.PENDING);
    }

    public double getTotalRevenue() {
        return orderRepository.sumTotalAmountByStatuses(java.util.Arrays.asList(com.lipiprint.backend.entity.Order.Status.COMPLETED, com.lipiprint.backend.entity.Order.Status.DELIVERED));
    }

    public Page<OrderListDTO> findAllListPaged(Pageable pageable) {
        return orderRepository.findAllForList(pageable);
    }
    
    public Page<OrderListDTO> findAllListByUserPaged(User user, Pageable pageable) {
        return orderRepository.findAllForListByUser(user.getId(), pageable);
    }
    
    public Page<OrderListDTO> findAllListByStatusPaged(String status, Pageable pageable) {
        return orderRepository.findAllForListByStatus(status, pageable);
    }
    
    public Page<OrderListDTO> findAllListByUserAndStatusPaged(User user, String status, Pageable pageable) {
        return orderRepository.findAllForListByUserAndStatus(user.getId(), status, pageable);
    }
}
