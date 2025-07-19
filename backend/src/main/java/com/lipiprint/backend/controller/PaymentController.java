package com.lipiprint.backend.controller;

import com.lipiprint.backend.entity.Payment;
import com.lipiprint.backend.entity.Order;
import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.service.PaymentService;
import com.lipiprint.backend.service.OrderService;
import com.lipiprint.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import jakarta.servlet.http.HttpServletRequest;
import java.io.BufferedReader;
import java.security.SignatureException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    @Autowired
    private PaymentService paymentService;
    @Autowired
    private OrderService orderService;
    @Autowired
    private UserService userService;

    @Value("${razorpay.key_secret}")
    private String razorpayKeySecret;

    // Razorpay webhook endpoint
    @PostMapping("/webhook")
    public ResponseEntity<?> handleRazorpayWebhook(HttpServletRequest request, @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        try {
            // Read raw body
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }
            String payload = sb.toString();
            // Verify signature
            if (signature == null || !verifyRazorpaySignature(payload, signature, razorpayKeySecret)) {
                return ResponseEntity.status(400).body("Invalid or missing Razorpay signature");
            }
            // Parse payload as JSON
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> body = mapper.readValue(payload, Map.class);
            String event = (String) body.get("event");
            Map<String, Object> paymentEntity = (Map<String, Object>) body.get("payload");
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
                // Update order status if linked
                if (paymentRecord.getOrder() != null) {
                    Order order = paymentRecord.getOrder();
                    order.setStatus(Order.Status.PROCESSING);
                    orderService.save(order, razorpayOrderId);
                }
            } else if ("failed".equals(status)) {
                paymentRecord.setStatus(Payment.Status.FAILED);
                if (paymentRecord.getOrder() != null) {
                    Order order = paymentRecord.getOrder();
                    order.setStatus(Order.Status.CANCELLED);
                    orderService.save(order, razorpayOrderId);
                }
            } else {
                paymentRecord.setStatus(Payment.Status.PENDING);
            }
            paymentService.save(paymentRecord);
            return ResponseEntity.ok("Webhook processed");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Webhook error: " + e.getMessage());
        }
    }

    private boolean verifyRazorpaySignature(String payload, String actualSignature, String secret) throws SignatureException {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] hash = sha256_HMAC.doFinal(payload.getBytes());
            String generatedSignature = new String(Base64.getEncoder().encode(hash));
            return generatedSignature.equals(actualSignature);
        } catch (Exception e) {
            throw new SignatureException("Failed to verify Razorpay signature", e);
        }
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