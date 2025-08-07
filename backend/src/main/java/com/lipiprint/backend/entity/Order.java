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

    // *** NEW NIMBUSPOST FIELDS ***
    @Column(name = "awb_number")
    private String awbNumber;

    @Column(name = "courier_name")
    private String courierName;

    @Column(name = "tracking_url")
    private String trackingUrl;

    @Column(name = "expected_delivery_date")
    private LocalDateTime expectedDeliveryDate;

    @Column(name = "shipment_id")
    private String shipmentId;

    @Column(name = "courier_id")
    private String courierId;

    @Column(name = "shipping_created")
    private Boolean shippingCreated = false;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Order() {}

    // *** EXISTING GETTERS AND SETTERS ***
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public PrintJob getPrintJob() { return printJobs.isEmpty() ? null : printJobs.get(0); }
    public void setPrintJob(PrintJob printJob) {
        if (printJob != null) {
            printJob.setOrder(this);
            if (printJobs.isEmpty()) {
                printJobs.add(printJob);
            } else {
                printJobs.set(0, printJob);
            }
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

    // *** NEW NIMBUSPOST GETTERS AND SETTERS ***
    public String getAwbNumber() { return awbNumber; }
    public void setAwbNumber(String awbNumber) { this.awbNumber = awbNumber; }

    public String getCourierName() { return courierName; }
    public void setCourierName(String courierName) { this.courierName = courierName; }

    public String getTrackingUrl() { return trackingUrl; }
    public void setTrackingUrl(String trackingUrl) { this.trackingUrl = trackingUrl; }

    public LocalDateTime getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(LocalDateTime expectedDeliveryDate) { this.expectedDeliveryDate = expectedDeliveryDate; }

    public String getShipmentId() { return shipmentId; }
    public void setShipmentId(String shipmentId) { this.shipmentId = shipmentId; }

    public String getCourierId() { return courierId; }
    public void setCourierId(String courierId) { this.courierId = courierId; }

    public Boolean getShippingCreated() { return shippingCreated; }
    public void setShippingCreated(Boolean shippingCreated) { this.shippingCreated = shippingCreated; }

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payment payment;

    // *** UTILITY METHODS ***
    public boolean isDeliveryOrder() {
        return "DELIVERY".equalsIgnoreCase(deliveryType);
    }

    public boolean hasShippingInfo() {
        return awbNumber != null && !awbNumber.trim().isEmpty();
    }

    public Map<String, Object> toActivityMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("type", "order");
        map.put("action", status != null ? status.name() : "");
        map.put("user", user != null ? user.getName() : "");
        map.put("time", createdAt != null ? createdAt.toString() : "");
        map.put("awb_number", awbNumber);
        map.put("courier_name", courierName);
        return map;
    }
    public Payment getPayment() { return payment; }
public void setPayment(Payment payment) { 
    this.payment = payment;
    if (payment != null) {
        payment.setOrder(this);
    }
}

}
