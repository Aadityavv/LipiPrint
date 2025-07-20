package com.lipiprint.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private Long id;
    @NotNull(message = "User is required")
    private UserDTO user;
    @NotNull(message = "At least one print job is required")
    private List<PrintJobDTO> printJobs;
    @NotBlank(message = "Status is required")
    private String status;
    @NotNull(message = "Total amount is required")
    private Double totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @NotBlank(message = "Delivery type is required")
    private String deliveryType;
    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;
    // Add razorpayOrderId for payment linking
    private String razorpayOrderId;
    private String orderNote;
    private Double subtotal;
    private Double discount;
    private Double gst;
    private Double delivery;
    private Double grandTotal;
} 