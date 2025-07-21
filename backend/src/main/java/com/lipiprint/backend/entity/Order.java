package com.lipiprint.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "orders")
public class Order {
    public enum Status {
        PENDING, PROCESSING, COMPLETED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<PrintJob> printJobs = new java.util.ArrayList<>();

    @Enumerated(EnumType.STRING)
    private Status status;

    private Double totalAmount;
    private Double subtotal;
    private Double discount;
    private Double discountedSubtotal;
    private Double gst;
    private Double delivery;
    private Double grandTotal;
    @Transient
    private java.util.List<com.lipiprint.backend.service.PricingService.BreakdownItem> breakdown;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String deliveryType;
    private String deliveryAddress;

    private String orderNote;

    private String razorpayOrderId;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Order() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public PrintJob getPrintJob() { return printJobs.get(0); } // Assuming only one print job for now
    public void setPrintJob(PrintJob printJob) {
        if (printJobs.isEmpty()) {
            printJobs.add(printJob);
        } else {
            printJobs.set(0, printJob);
        }
    }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getDeliveryType() { return deliveryType; }
    public void setDeliveryType(String deliveryType) { this.deliveryType = deliveryType; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public java.util.List<PrintJob> getPrintJobs() { return printJobs; }
    public void setPrintJobs(java.util.List<PrintJob> printJobs) { this.printJobs = printJobs; }

    public String getOrderNote() { return orderNote; }
    public void setOrderNote(String orderNote) { this.orderNote = orderNote; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
    public Double getDiscount() { return discount; }
    public void setDiscount(Double discount) { this.discount = discount; }
    public Double getDiscountedSubtotal() { return discountedSubtotal; }
    public void setDiscountedSubtotal(Double discountedSubtotal) { this.discountedSubtotal = discountedSubtotal; }
    public Double getGst() { return gst; }
    public void setGst(Double gst) { this.gst = gst; }
    public Double getDelivery() { return delivery; }
    public void setDelivery(Double delivery) { this.delivery = delivery; }
    public Double getGrandTotal() { return grandTotal; }
    public void setGrandTotal(Double grandTotal) { this.grandTotal = grandTotal; }

    public java.util.List<com.lipiprint.backend.service.PricingService.BreakdownItem> getBreakdown() { return breakdown; }
    public void setBreakdown(java.util.List<com.lipiprint.backend.service.PricingService.BreakdownItem> breakdown) { this.breakdown = breakdown; }

    public Map<String, Object> toActivityMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("type", "order");
        map.put("action", status != null ? status.name() : "");
        map.put("user", user != null ? user.getName() : "");
        map.put("time", createdAt != null ? createdAt.toString() : "");
        return map;
    }

    // Getters and setters
    // ... (omitted for brevity)
} 