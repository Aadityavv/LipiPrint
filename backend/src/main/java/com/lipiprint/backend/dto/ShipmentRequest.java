    package com.lipiprint.backend.dto;

    import com.fasterxml.jackson.annotation.JsonProperty;

    public class ShipmentRequest {
        
        // Order identification
        @JsonProperty("order_id")
        private String orderId;
        
        @JsonProperty("order_number")
        private String orderNumber;
        
        @JsonProperty("invoice_number")
        private String invoiceNumber;
        
        @JsonProperty("order_date")
        private String orderDate;
        
        // Payment details
        @JsonProperty("order_amount")
        private String orderAmount;
        
        @JsonProperty("payment_method")
        private String paymentMethod;
        
        @JsonProperty("payment_mode")
        private String paymentMode;
        
        @JsonProperty("payment_type")
        private String paymentType;
        
        @JsonProperty("cod_amount")
        private Double codAmount;
        
        @JsonProperty("cod_charges")
        private String codCharges;
        
        @JsonProperty("total_order_value")
        private String totalOrderValue;
        
        @JsonProperty("shipping_charges")
        private String shippingCharges;
        
        @JsonProperty("discount")
        private String discount;
        
        // Pickup details (LipiPrint Saharanpur)
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
        
        @JsonProperty("pickup_location")
        private String pickupLocation;
        
        @JsonProperty("request_auto_pickup")
        private String requestAutoPickup;
        
        // Delivery/Consignee details
        @JsonProperty("delivery_name")
        private String deliveryName;
        
        @JsonProperty("delivery_phone")
        private String deliveryPhone;
        
        @JsonProperty("delivery_email")
        private String deliveryEmail;
        
        @JsonProperty("delivery_address")
        private String deliveryAddress;
        
        @JsonProperty("delivery_city")
        private String deliveryCity;
        
        @JsonProperty("delivery_state")
        private String deliveryState;
        
        @JsonProperty("delivery_pincode")
        private String deliveryPincode;
        
        // NimbusPost also uses consignee fields
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
        
        // Package details
        @JsonProperty("weight")
        private Double weight;
        
        @JsonProperty("length")
        private Integer length;
        
        @JsonProperty("breadth")
        private Integer breadth;
        
        @JsonProperty("height")
        private Integer height;
        
        @JsonProperty("package_weight")
        private String packageWeight;
        
        @JsonProperty("package_length")
        private String packageLength;
        
        @JsonProperty("package_breadth")
        private String packageBreadth;
        
        @JsonProperty("package_height")
        private String packageHeight;
        
        // Product details
        @JsonProperty("product_description")
        private String productDescription;
        
        // Business details
        @JsonProperty("channel_id")
        private String channelId;
        
        @JsonProperty("reseller_name")
        private String resellerName;
        
        @JsonProperty("company_name")
        private String companyName;
        
        @JsonProperty("marketplace")
        private String marketplace;
        
        // Constructors
        public ShipmentRequest() {}
        
        // Getters and Setters for all fields
        
        // Order fields
        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        
        public String getOrderNumber() { return orderNumber; }
        public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
        
        public String getInvoiceNumber() { return invoiceNumber; }
        public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
        
        public String getOrderDate() { return orderDate; }
        public void setOrderDate(String orderDate) { this.orderDate = orderDate; }
        
        // Payment fields
        public String getOrderAmount() { return orderAmount; }
        public void setOrderAmount(String orderAmount) { this.orderAmount = orderAmount; }
        
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        
        public String getPaymentMode() { return paymentMode; }
        public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
        
        public String getPaymentType() { return paymentType; }
        public void setPaymentType(String paymentType) { this.paymentType = paymentType; }
        
        public Double getCodAmount() { return codAmount; }
        public void setCodAmount(Double codAmount) { this.codAmount = codAmount; }
        
        public String getCodCharges() { return codCharges; }
        public void setCodCharges(String codCharges) { this.codCharges = codCharges; }
        
        public String getTotalOrderValue() { return totalOrderValue; }
        public void setTotalOrderValue(String totalOrderValue) { this.totalOrderValue = totalOrderValue; }
        
        public String getShippingCharges() { return shippingCharges; }
        public void setShippingCharges(String shippingCharges) { this.shippingCharges = shippingCharges; }
        
        public String getDiscount() { return discount; }
        public void setDiscount(String discount) { this.discount = discount; }
        
        // Pickup fields (LipiPrint Saharanpur)
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
        
        public String getPickupLocation() { return pickupLocation; }
        public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }
        
        public String getRequestAutoPickup() { return requestAutoPickup; }
        public void setRequestAutoPickup(String requestAutoPickup) { this.requestAutoPickup = requestAutoPickup; }
        
        // Delivery fields
        public String getDeliveryName() { return deliveryName; }
        public void setDeliveryName(String deliveryName) { this.deliveryName = deliveryName; }
        
        public String getDeliveryPhone() { return deliveryPhone; }
        public void setDeliveryPhone(String deliveryPhone) { this.deliveryPhone = deliveryPhone; }
        
        public String getDeliveryEmail() { return deliveryEmail; }
        public void setDeliveryEmail(String deliveryEmail) { this.deliveryEmail = deliveryEmail; }
        
        public String getDeliveryAddress() { return deliveryAddress; }
        public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
        
        public String getDeliveryCity() { return deliveryCity; }
        public void setDeliveryCity(String deliveryCity) { this.deliveryCity = deliveryCity; }
        
        public String getDeliveryState() { return deliveryState; }
        public void setDeliveryState(String deliveryState) { this.deliveryState = deliveryState; }
        
        public String getDeliveryPincode() { return deliveryPincode; }
        public void setDeliveryPincode(String deliveryPincode) { this.deliveryPincode = deliveryPincode; }
        
        // Consignee fields (NimbusPost format)
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
        
        // Package fields
        public Double getWeight() { return weight; }
        public void setWeight(Double weight) { this.weight = weight; }
        
        public Integer getLength() { return length; }
        public void setLength(Integer length) { this.length = length; }
        
        public Integer getBreadth() { return breadth; }
        public void setBreadth(Integer breadth) { this.breadth = breadth; }
        
        public Integer getHeight() { return height; }
        public void setHeight(Integer height) { this.height = height; }
        
        public String getPackageWeight() { return packageWeight; }
        public void setPackageWeight(String packageWeight) { this.packageWeight = packageWeight; }
        
        public String getPackageLength() { return packageLength; }
        public void setPackageLength(String packageLength) { this.packageLength = packageLength; }
        
        public String getPackageBreadth() { return packageBreadth; }
        public void setPackageBreadth(String packageBreadth) { this.packageBreadth = packageBreadth; }
        
        public String getPackageHeight() { return packageHeight; }
        public void setPackageHeight(String packageHeight) { this.packageHeight = packageHeight; }
        
        // Product fields
        public String getProductDescription() { return productDescription; }
        public void setProductDescription(String productDescription) { this.productDescription = productDescription; }
        
        // Business fields
        public String getChannelId() { return channelId; }
        public void setChannelId(String channelId) { this.channelId = channelId; }
        
        public String getResellerName() { return resellerName; }
        public void setResellerName(String resellerName) { this.resellerName = resellerName; }
        
        public String getCompanyName() { return companyName; }
        public void setCompanyName(String companyName) { this.companyName = companyName; }
        
        public String getMarketplace() { return marketplace; }
        public void setMarketplace(String marketplace) { this.marketplace = marketplace; }
    }
