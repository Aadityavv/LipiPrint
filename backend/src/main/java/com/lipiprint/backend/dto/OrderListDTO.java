package com.lipiprint.backend.dto;

import java.time.LocalDateTime;
import com.lipiprint.backend.entity.Order;

public class OrderListDTO {
    private Long id;
    private String userName;
    private String status;
    private Double totalAmount;
    private LocalDateTime createdAt;
    private String deliveryType;

    public OrderListDTO() {}

    // ✅ FIXED: Constructor that accepts Order.DeliveryType enum
    public OrderListDTO(Long id, String userName, String status, Double totalAmount, 
                       LocalDateTime createdAt, Order.DeliveryType deliveryType) {
        this.id = id;
        this.userName = userName;
        this.status = status;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
        this.deliveryType = deliveryType != null ? deliveryType.name() : null; // ✅ Convert enum to String
    }

    // Alternative constructor for String input (if needed elsewhere)
    public OrderListDTO(Long id, String userName, String status, Double totalAmount, 
                       LocalDateTime createdAt, String deliveryType) {
        this.id = id;
        this.userName = userName;
        this.status = status;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
        this.deliveryType = deliveryType;
    }

    // ✅ All getters and setters remain the same
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public String getDeliveryType() { return deliveryType; }
    public void setDeliveryType(String deliveryType) { this.deliveryType = deliveryType; }
}
