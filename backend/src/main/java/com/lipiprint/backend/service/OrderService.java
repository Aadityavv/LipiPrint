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
        
        // *** PROCESS SHIPMENT FOR DELIVERY ORDERS ***
        processShipment(savedOrder);
        
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

        // Create a temporary UserAddress object from the delivery address string
        UserAddress address = new UserAddress();
        String fullAddress = order.getDeliveryAddress().trim();
        
        // Split the address into parts (assuming comma-separated format)
        String[] parts = fullAddress.split(",");
        
        if (parts.length >= 3) {
            address.setLine1(parts[0].trim());
            address.setLine2(parts[1].trim());
            address.setLine3(parts[2].trim());
        } else if (parts.length == 2) {
            address.setLine1(parts[0].trim());
            address.setLine2(parts[1].trim());
            address.setLine3("Bareilly, UP 243001"); // Default
        } else {
            address.setLine1(fullAddress);
            address.setLine2("Bareilly");
            address.setLine3("Bareilly, UP 243001");
        }
        
        // Set default phone if user exists
        if (order.getUser() != null && order.getUser().getPhone() != null) {
            address.setPhone(order.getUser().getPhone());
        } else {
            address.setPhone("9999999999"); // Default phone
        }
        
        return address;
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

    public void retryShipmentCreation(Long orderId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            order.setShippingCreated(false); // Reset flag
            order.setAwbNumber(null); // Clear previous attempt
            processShipment(order);
        } else {
            throw new RuntimeException("Order not found");
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
