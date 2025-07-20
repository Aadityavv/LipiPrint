package com.lipiprint.backend.service;

import com.lipiprint.backend.entity.Order;
import com.lipiprint.backend.repository.OrderRepository;
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

@Service
public class OrderService {
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserService userService;

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
        logger.info("[OrderService] Order saved: {}", savedOrder);
        return savedOrder;
    }

    public Optional<Order> findById(Long id) {
        return orderRepository.findById(id);
    }

    public List<Order> findAll() {
        return orderRepository.findAll();
    }

    // Add paged methods
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

    // Razorpay order creation
    public JSONObject createRazorpayOrder(int amount, String currency, String receipt, Long userId) throws RazorpayException {
        logger.info("[OrderService] createRazorpayOrder called with amount={}, currency={}, receipt={}, userId={}", amount, currency, receipt, userId);
        RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amount); // amount in paise
        orderRequest.put("currency", currency);
        orderRequest.put("receipt", receipt);
        orderRequest.put("payment_capture", 1);
        JSONObject razorpayOrder = razorpay.orders.create(orderRequest).toJson();
        logger.info("[OrderService] Razorpay order created: {}", razorpayOrder);
        // Create Payment record
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
} 