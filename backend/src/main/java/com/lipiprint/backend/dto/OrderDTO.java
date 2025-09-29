package com.lipiprint.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.lipiprint.backend.service.PricingService;

@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderDTO {
    
    private Long id;
    
    @Valid
    private UserDTO user;
    
    @NotNull(message = "Print jobs are required")
    @Size(min = 1, message = "At least one print job is required")
    @Valid
    private List<PrintJobDTO> printJobs;
    
    private String status;
    
    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Total amount must be greater than 0")
    private Double totalAmount;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @NotBlank(message = "Delivery type is required")
    private String deliveryType;
    
    // ✅ UPDATED: Support both string and structured address formats
    private String deliveryAddress; // Display format for compatibility
    
    // ✅ NEW: Structured address data
    @JsonProperty("deliveryAddressData")
    private Map<String, Object> deliveryAddressData;
    
    // ✅ BACKUP: Alternative field name
    @JsonProperty("addressData") 
    private Map<String, Object> addressData;
    
    private String phone;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String orderNote;
    
    // Pricing fields
    private Double subtotal;
    private Double discount;
    private Double discountedSubtotal;
    private Double gst;
    private Double delivery;
    private Double grandTotal;
    private List<PricingService.BreakdownItem> breakdown;
    
    // *** NIMBUSPOST SHIPPING FIELDS ***
    @JsonProperty("awb_number")
    private String awbNumber;
    
    @JsonProperty("courier_name")
    private String courierName;
    
    @JsonProperty("tracking_url")
    private String trackingUrl;
    
    @JsonProperty("expected_delivery_date")
    private LocalDateTime expectedDeliveryDate;
    
    @JsonProperty("shipment_id")
    private String shipmentId;
    
    @JsonProperty("courier_id")
    private String courierId;
    
    @JsonProperty("shipping_created")
    private Boolean shippingCreated;

    // *** PICKUP DETAILS FIELDS ***
    @JsonProperty("pickup_name")
    private String pickupName;

    @JsonProperty("pickup_address")
    private String pickupAddress;

    @JsonProperty("pickup_city")
    private String pickupCity;

    @JsonProperty("pickup_state")
    private String pickupState;

    @JsonProperty("pickup_pincode")
    private String pickupPincode;

    @JsonProperty("pickup_phone")
    private String pickupPhone;

    @JsonProperty("pickup_scheduled_date")
    private LocalDateTime pickupScheduledDate;

    @JsonProperty("pickup_status")
    private String pickupStatus;

    // Admin tracking fields
    private String printedByAdminName;
    private String processedByAdminName;
    private String completedByAdminName;
    private LocalDateTime printedAt;
    private LocalDateTime processedAt;
    private LocalDateTime completedAt;

    // Default constructor
    public OrderDTO() {}

    // Full constructor
    public OrderDTO(Long id, UserDTO user, List<PrintJobDTO> printJobs, String status, 
                   Double totalAmount, LocalDateTime createdAt, LocalDateTime updatedAt,
                   String deliveryType, String deliveryAddress, String razorpayOrderId, 
                   String razorpayPaymentId, String orderNote, Double subtotal, Double discount, 
                   Double discountedSubtotal, Double gst, Double delivery, Double grandTotal, 
                   List<PricingService.BreakdownItem> breakdown) {
        this.id = id;
        this.user = user;
        this.printJobs = printJobs;
        this.status = status;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deliveryType = deliveryType;
        this.deliveryAddress = deliveryAddress;
        this.razorpayOrderId = razorpayOrderId;
        this.razorpayPaymentId = razorpayPaymentId;
        this.orderNote = orderNote;
        this.subtotal = subtotal;
        this.discount = discount;
        this.discountedSubtotal = discountedSubtotal;
        this.gst = gst;
        this.delivery = delivery;
        this.grandTotal = grandTotal;
        this.breakdown = breakdown;
    }

    // ✅ ENHANCED: Get structured address data from multiple possible sources
    public Map<String, Object> getStructuredDeliveryAddress() {
        if (deliveryAddressData != null && !deliveryAddressData.isEmpty()) {
            return deliveryAddressData;
        }
        if (addressData != null && !addressData.isEmpty()) {
            return addressData;
        }
        return null;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UserDTO getUser() { return user; }
    public void setUser(UserDTO user) { this.user = user; }

    public List<PrintJobDTO> getPrintJobs() { return printJobs; }
    public void setPrintJobs(List<PrintJobDTO> printJobs) { this.printJobs = printJobs; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

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

    // ✅ NEW: Structured address getters and setters
    public Map<String, Object> getDeliveryAddressData() { return deliveryAddressData; }
    public void setDeliveryAddressData(Map<String, Object> deliveryAddressData) { this.deliveryAddressData = deliveryAddressData; }

    public Map<String, Object> getAddressData() { return addressData; }
    public void setAddressData(Map<String, Object> addressData) { this.addressData = addressData; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }
    
    public String getRazorpayPaymentId() {
        return razorpayPaymentId;
    }

    public void setRazorpayPaymentId(String razorpayPaymentId) {
        this.razorpayPaymentId = razorpayPaymentId;
    }

    public String getOrderNote() { return orderNote; }
    public void setOrderNote(String orderNote) { this.orderNote = orderNote; }

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

    public List<PricingService.BreakdownItem> getBreakdown() { return breakdown; }
    public void setBreakdown(List<PricingService.BreakdownItem> breakdown) { this.breakdown = breakdown; }
    
    // *** NIMBUSPOST SHIPPING GETTERS AND SETTERS ***
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

    // *** PICKUP DETAILS GETTERS AND SETTERS ***
    public String getPickupName() { return pickupName; }
    public void setPickupName(String pickupName) { this.pickupName = pickupName; }

    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }

    public String getPickupCity() { return pickupCity; }
    public void setPickupCity(String pickupCity) { this.pickupCity = pickupCity; }

    public String getPickupState() { return pickupState; }
    public void setPickupState(String pickupState) { this.pickupState = pickupState; }

    public String getPickupPincode() { return pickupPincode; }
    public void setPickupPincode(String pickupPincode) { this.pickupPincode = pickupPincode; }

    public String getPickupPhone() { return pickupPhone; }
    public void setPickupPhone(String pickupPhone) { this.pickupPhone = pickupPhone; }

    public LocalDateTime getPickupScheduledDate() { return pickupScheduledDate; }
    public void setPickupScheduledDate(LocalDateTime pickupScheduledDate) { this.pickupScheduledDate = pickupScheduledDate; }

    public String getPickupStatus() { return pickupStatus; }
    public void setPickupStatus(String pickupStatus) { this.pickupStatus = pickupStatus; }

    // Admin tracking getters and setters
    public String getPrintedByAdminName() { return printedByAdminName; }
    public void setPrintedByAdminName(String printedByAdminName) { this.printedByAdminName = printedByAdminName; }

    public String getProcessedByAdminName() { return processedByAdminName; }
    public void setProcessedByAdminName(String processedByAdminName) { this.processedByAdminName = processedByAdminName; }

    public String getCompletedByAdminName() { return completedByAdminName; }
    public void setCompletedByAdminName(String completedByAdminName) { this.completedByAdminName = completedByAdminName; }

    public LocalDateTime getPrintedAt() { return printedAt; }
    public void setPrintedAt(LocalDateTime printedAt) { this.printedAt = printedAt; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    @Override
    public String toString() {
        return "OrderDTO{" +
                "id=" + id +
                ", user=" + user +
                ", printJobs=" + printJobs +
                ", status='" + status + '\'' +
                ", totalAmount=" + totalAmount +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", deliveryType='" + deliveryType + '\'' +
                ", deliveryAddress='" + deliveryAddress + '\'' +
                ", deliveryAddressData=" + deliveryAddressData +
                ", addressData=" + addressData +
                ", phone='" + phone + '\'' +
                ", razorpayOrderId='" + razorpayOrderId + '\'' +
                ", orderNote='" + orderNote + '\'' +
                ", subtotal=" + subtotal +
                ", discount=" + discount +
                ", discountedSubtotal=" + discountedSubtotal +
                ", gst=" + gst +
                ", delivery=" + delivery +
                ", grandTotal=" + grandTotal +
                ", breakdown=" + breakdown +
                '}';
    }
    
}