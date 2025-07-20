package com.lipiprint.backend.dto;
import java.time.LocalDateTime;

public class OrderListDTO {
    private Long id;
    private String userName;
    private String status;
    private Double totalAmount;
    private LocalDateTime createdAt;
    private String deliveryType;

    public OrderListDTO() {}

    public OrderListDTO(Long id, String userName, String status, Double totalAmount, LocalDateTime createdAt, String deliveryType) {
        this.id = id;
        this.userName = userName;
        this.status = status;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
        this.deliveryType = deliveryType;
    }

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