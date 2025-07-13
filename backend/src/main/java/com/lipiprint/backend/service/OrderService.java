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

@Service
public class OrderService {
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
        Order savedOrder = orderRepository.save(order);
        if (razorpayOrderId != null) {
            paymentRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(payment -> {
                payment.setOrder(savedOrder);
                paymentRepository.save(payment);
            });
        }
        return savedOrder;
    }

    public Optional<Order> findById(Long id) {
        return orderRepository.findById(id);
    }

    public List<Order> findAll() {
        return orderRepository.findAll();
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
        RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amount); // amount in paise
        orderRequest.put("currency", currency);
        orderRequest.put("receipt", receipt);
        orderRequest.put("payment_capture", 1);
        JSONObject razorpayOrder = razorpay.orders.create(orderRequest).toJson();
        // Create Payment record
        Payment payment = new Payment();
        payment.setRazorpayOrderId(razorpayOrder.getString("id"));
        payment.setStatus(Payment.Status.PENDING);
        payment.setAmount(amount / 100.0);
        if (userId != null) {
            userService.findById(userId).ifPresent(payment::setUser);
        }
        paymentRepository.save(payment);
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
} 