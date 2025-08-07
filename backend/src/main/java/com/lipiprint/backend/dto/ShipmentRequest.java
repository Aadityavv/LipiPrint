package com.lipiprint.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ShipmentRequest {
    @JsonProperty("order_number")
    private String orderNumber;
    
    @JsonProperty("shipping_charges")
    private String shippingCharges;
    
    @JsonProperty("discount")
    private String discount;
    
    @JsonProperty("cod_charges")
    private String codCharges;
    
    @JsonProperty("payment_type")
    private String paymentType;
    
    @JsonProperty("order_amount")
    private String orderAmount;
    
    @JsonProperty("package_weight")
    private String packageWeight;
    
    @JsonProperty("package_length")
    private String packageLength;
    
    @JsonProperty("package_breadth")
    private String packageBreadth;
    
    @JsonProperty("package_height")
    private String packageHeight;
    
    @JsonProperty("request_auto_pickup")
    private String requestAutoPickup;
    
    @JsonProperty("consignee")
    private String consignee;
    
    @JsonProperty("consignee_address1")
    private String consigneeAddress1;
    
    @JsonProperty("consignee_address2")
    private String consigneeAddress2;
    
    @JsonProperty("consignee_address3")
    private String consigneeAddress3;
    
    @JsonProperty("consignee_pincode")
    private String consigneePincode;
    
    @JsonProperty("consignee_state")
    private String consigneeState;
    
    @JsonProperty("consignee_city")
    private String consigneeCity;
    
    @JsonProperty("consignee_phone")
    private String consigneePhone;
    
    @JsonProperty("consignee_email")
    private String consigneeEmail;
    
    @JsonProperty("pickup_location")
    private String pickupLocation;
    
    @JsonProperty("invoice_number")
    private String invoiceNumber;
    
    @JsonProperty("order_date")
    private String orderDate;
    
    @JsonProperty("channel_id")
    private String channelId;
    
    @JsonProperty("reseller_name")
    private String resellerName;
    
    @JsonProperty("company_name")
    private String companyName;
    
    @JsonProperty("order_id")
    private String orderId;
    
    @JsonProperty("total_order_value")
    private String totalOrderValue;
    
    @JsonProperty("payment_mode")
    private String paymentMode;
    
    @JsonProperty("marketplace")
    private String marketplace;

    // Constructors
    public ShipmentRequest() {}

    // Getters and Setters
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getShippingCharges() { return shippingCharges; }
    public void setShippingCharges(String shippingCharges) { this.shippingCharges = shippingCharges; }

    public String getDiscount() { return discount; }
    public void setDiscount(String discount) { this.discount = discount; }

    public String getCodCharges() { return codCharges; }
    public void setCodCharges(String codCharges) { this.codCharges = codCharges; }

    public String getPaymentType() { return paymentType; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }

    public String getOrderAmount() { return orderAmount; }
    public void setOrderAmount(String orderAmount) { this.orderAmount = orderAmount; }

    public String getPackageWeight() { return packageWeight; }
    public void setPackageWeight(String packageWeight) { this.packageWeight = packageWeight; }

    public String getPackageLength() { return packageLength; }
    public void setPackageLength(String packageLength) { this.packageLength = packageLength; }

    public String getPackageBreadth() { return packageBreadth; }
    public void setPackageBreadth(String packageBreadth) { this.packageBreadth = packageBreadth; }

    public String getPackageHeight() { return packageHeight; }
    public void setPackageHeight(String packageHeight) { this.packageHeight = packageHeight; }

    public String getRequestAutoPickup() { return requestAutoPickup; }
    public void setRequestAutoPickup(String requestAutoPickup) { this.requestAutoPickup = requestAutoPickup; }

    public String getConsignee() { return consignee; }
    public void setConsignee(String consignee) { this.consignee = consignee; }

    public String getConsigneeAddress1() { return consigneeAddress1; }
    public void setConsigneeAddress1(String consigneeAddress1) { this.consigneeAddress1 = consigneeAddress1; }

    public String getConsigneeAddress2() { return consigneeAddress2; }
    public void setConsigneeAddress2(String consigneeAddress2) { this.consigneeAddress2 = consigneeAddress2; }

    public String getConsigneeAddress3() { return consigneeAddress3; }
    public void setConsigneeAddress3(String consigneeAddress3) { this.consigneeAddress3 = consigneeAddress3; }

    public String getConsigneePincode() { return consigneePincode; }
    public void setConsigneePincode(String consigneePincode) { this.consigneePincode = consigneePincode; }

    public String getConsigneeState() { return consigneeState; }
    public void setConsigneeState(String consigneeState) { this.consigneeState = consigneeState; }

    public String getConsigneeCity() { return consigneeCity; }
    public void setConsigneeCity(String consigneeCity) { this.consigneeCity = consigneeCity; }

    public String getConsigneePhone() { return consigneePhone; }
    public void setConsigneePhone(String consigneePhone) { this.consigneePhone = consigneePhone; }

    public String getConsigneeEmail() { return consigneeEmail; }
    public void setConsigneeEmail(String consigneeEmail) { this.consigneeEmail = consigneeEmail; }

    public String getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public String getOrderDate() { return orderDate; }
    public void setOrderDate(String orderDate) { this.orderDate = orderDate; }

    public String getChannelId() { return channelId; }
    public void setChannelId(String channelId) { this.channelId = channelId; }

    public String getResellerName() { return resellerName; }
    public void setResellerName(String resellerName) { this.resellerName = resellerName; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getTotalOrderValue() { return totalOrderValue; }
    public void setTotalOrderValue(String totalOrderValue) { this.totalOrderValue = totalOrderValue; }

    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }

    public String getMarketplace() { return marketplace; }
    public void setMarketplace(String marketplace) { this.marketplace = marketplace; }
}
