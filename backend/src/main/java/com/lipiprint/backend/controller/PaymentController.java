package com.lipiprint.backend.controller;

import com.lipiprint.backend.entity.Payment;
import com.lipiprint.backend.entity.Order;
import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.service.PaymentService;
import com.lipiprint.backend.service.OrderService;
import com.lipiprint.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    @Autowired
    private PaymentService paymentService;
    @Autowired
    private OrderService orderService;
    @Autowired
    private UserService userService;

    // Razorpay webhook endpoint
    @PostMapping("/webhook")
    public ResponseEntity<?> handleRazorpayWebhook(@RequestBody Map<String, Object> payload) {
        // This is a simplified example. In production, verify signature and event type.
        String event = (String) payload.get("event");
        Map<String, Object> paymentEntity = (Map<String, Object>) payload.get("payload");
        if (paymentEntity == null) return ResponseEntity.badRequest().body("Missing payload");
        Map<String, Object> payment = (Map<String, Object>) paymentEntity.get("payment");
        if (payment == null) return ResponseEntity.badRequest().body("Missing payment");
        Map<String, Object> paymentData = (Map<String, Object>) payment.get("entity");
        if (paymentData == null) return ResponseEntity.badRequest().body("Missing payment entity");
        String razorpayOrderId = (String) paymentData.get("order_id");
        String razorpayPaymentId = (String) paymentData.get("id");
        Double amount = paymentData.get("amount") != null ? Double.valueOf(paymentData.get("amount").toString()) / 100.0 : null;
        String status = (String) paymentData.get("status");
        Payment paymentRecord = paymentService.findByRazorpayOrderId(razorpayOrderId).orElseGet(Payment::new);
        paymentRecord.setRazorpayOrderId(razorpayOrderId);
        paymentRecord.setRazorpayPaymentId(razorpayPaymentId);
        paymentRecord.setAmount(amount);
        if ("captured".equals(status)) {
            paymentRecord.setStatus(Payment.Status.SUCCESS);
        } else if ("failed".equals(status)) {
            paymentRecord.setStatus(Payment.Status.FAILED);
        } else {
            paymentRecord.setStatus(Payment.Status.PENDING);
        }
        paymentService.save(paymentRecord);
        return ResponseEntity.ok("Webhook processed");
    }

    // Admin: Orders with failed/missing payments
    @GetMapping("/orders-with-failed-payments")
    public ResponseEntity<List<Order>> getOrdersWithFailedPayments() {
        List<Payment> failedPayments = paymentService.findPaymentsWithOrderAndStatus(Payment.Status.FAILED);
        List<Order> orders = failedPayments.stream().map(Payment::getOrder).filter(o -> o != null).toList();
        return ResponseEntity.ok(orders);
    }

    // Admin: Payments received but no order created
    @GetMapping("/payments-without-order")
    public ResponseEntity<List<Payment>> getPaymentsWithoutOrder() {
        List<Payment> payments = paymentService.findPaymentsWithNoOrder(Payment.Status.SUCCESS);
        return ResponseEntity.ok(payments);
    }
} 