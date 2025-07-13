package com.lipiprint.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "binding_options")
public class BindingOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type; // 'spiral', 'staple', etc.
    private BigDecimal perPagePrice;
    private BigDecimal minPrice;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public BigDecimal getPerPagePrice() { return perPagePrice; }
    public void setPerPagePrice(BigDecimal perPagePrice) { this.perPagePrice = perPagePrice; }
    public BigDecimal getMinPrice() { return minPrice; }
    public void setMinPrice(BigDecimal minPrice) { this.minPrice = minPrice; }
} 