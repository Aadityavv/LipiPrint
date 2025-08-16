package com.lipiprint.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class ShipmentResponse {
    private boolean status;
    private String message;
    
    @JsonProperty("order_id")
    private String orderId;
    
    @JsonProperty("shipment_id")
    private String shipmentId;
    
    @JsonProperty("awb_number")
    private String awbNumber;
    
    @JsonProperty("courier_id")
    private String courierId;
    
    @JsonProperty("courier_name")
    private String courierName;
    
    @JsonProperty("expected_delivery_date")
    private String expectedDeliveryDate;
    
    @JsonProperty("label_url")
    private String labelUrl;
    
    @JsonProperty("manifest_url")
    private String manifestUrl;
    
    @JsonProperty("tracking_url")
    private String trackingUrl;
    
    // ✅ ADD: Error details field for debugging
    @JsonProperty("error_details")
    private Map<String, Object> errorDetails;

    // Constructors
    public ShipmentResponse() {}

    // ✅ COMPLETE: All Getters and Setters
    public boolean isStatus() { return status; }
    public void setStatus(boolean status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getShipmentId() { return shipmentId; }
    public void setShipmentId(String shipmentId) { this.shipmentId = shipmentId; }

    public String getAwbNumber() { return awbNumber; }
    public void setAwbNumber(String awbNumber) { this.awbNumber = awbNumber; }

    public String getCourierId() { return courierId; }
    public void setCourierId(String courierId) { this.courierId = courierId; }

    public String getCourierName() { return courierName; }
    public void setCourierName(String courierName) { this.courierName = courierName; }

    public String getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(String expectedDeliveryDate) { 
        this.expectedDeliveryDate = expectedDeliveryDate; 
    }

    public String getLabelUrl() { return labelUrl; }
    public void setLabelUrl(String labelUrl) { this.labelUrl = labelUrl; }

    public String getManifestUrl() { return manifestUrl; }
    public void setManifestUrl(String manifestUrl) { this.manifestUrl = manifestUrl; }

    public String getTrackingUrl() { return trackingUrl; }
    public void setTrackingUrl(String trackingUrl) { this.trackingUrl = trackingUrl; }
    
    // ✅ ADD: Error details getter and setter
    public Map<String, Object> getErrorDetails() { return errorDetails; }
    public void setErrorDetails(Map<String, Object> errorDetails) { this.errorDetails = errorDetails; }

    @Override
    public String toString() {
        return "ShipmentResponse{" +
                "status=" + status +
                ", message='" + message + '\'' +
                ", orderId='" + orderId + '\'' +
                ", shipmentId='" + shipmentId + '\'' +
                ", awbNumber='" + awbNumber + '\'' +
                ", courierId='" + courierId + '\'' +
                ", courierName='" + courierName + '\'' +
                ", expectedDeliveryDate='" + expectedDeliveryDate + '\'' +
                ", trackingUrl='" + trackingUrl + '\'' +
                ", errorDetails=" + errorDetails +
                '}';
    }
}