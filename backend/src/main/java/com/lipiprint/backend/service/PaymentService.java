package com.lipiprint.backend.service;

import com.lipiprint.backend.entity.Payment;
import com.lipiprint.backend.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {
    @Autowired
    private PaymentRepository paymentRepository;

    public Payment save(Payment payment) {
        return paymentRepository.save(payment);
    }

    public Optional<Payment> findById(Long id) {
        return paymentRepository.findById(id);
    }

    public Optional<Payment> findByRazorpayOrderId(String razorpayOrderId) {
        return paymentRepository.findByRazorpayOrderId(razorpayOrderId);
    }

    public Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId) {
        return paymentRepository.findByRazorpayPaymentId(razorpayPaymentId);
    }

    public List<Payment> findByStatus(Payment.Status status) {
        return paymentRepository.findByStatus(status);
    }

    public List<Payment> findPaymentsWithNoOrder(Payment.Status status) {
        return paymentRepository.findByOrderIsNullAndStatus(status);
    }

    public List<Payment> findPaymentsWithNoOrder() {
        return paymentRepository.findByOrderIsNull();
    }

    public List<Payment> findPaymentsWithOrderAndStatus(Payment.Status status) {
        return paymentRepository.findByOrderIsNotNullAndStatus(status);
    }
} 