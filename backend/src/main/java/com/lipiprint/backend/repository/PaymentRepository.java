package com.lipiprint.backend.repository;

import com.lipiprint.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
    List<Payment> findByStatus(Payment.Status status);
    List<Payment> findByOrderIsNullAndStatus(Payment.Status status);
    List<Payment> findByOrderIsNull();
    List<Payment> findByOrderIsNotNullAndStatus(Payment.Status status);
} 