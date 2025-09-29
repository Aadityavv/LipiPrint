package com.lipiprint.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PickupDetailsResponse {
    private boolean status;
    private String message;
    private String awbNumber;
    private String pickupName;
    private String pickupAddress;
    private String pickupCity;
    private String pickupState;
    private String pickupPincode;
    private String pickupPhone;
    private LocalDateTime pickupScheduledDate;
    private String pickupStatus;
    private String courierName;
    private String courierId;
    private Map<String, Object> additionalInfo;
    private List<Map<String, Object>> pickupHistory;

    // Default constructor
    public PickupDetailsResponse() {}

    // Getters and Setters
    public boolean isStatus() {
        return status;
    }

    public void setStatus(boolean status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getAwbNumber() {
        return awbNumber;
    }

    public void setAwbNumber(String awbNumber) {
        this.awbNumber = awbNumber;
    }

    public String getPickupName() {
        return pickupName;
    }

    public void setPickupName(String pickupName) {
        this.pickupName = pickupName;
    }

    public String getPickupAddress() {
        return pickupAddress;
    }

    public void setPickupAddress(String pickupAddress) {
        this.pickupAddress = pickupAddress;
    }

    public String getPickupCity() {
        return pickupCity;
    }

    public void setPickupCity(String pickupCity) {
        this.pickupCity = pickupCity;
    }

    public String getPickupState() {
        return pickupState;
    }

    public void setPickupState(String pickupState) {
        this.pickupState = pickupState;
    }

    public String getPickupPincode() {
        return pickupPincode;
    }

    public void setPickupPincode(String pickupPincode) {
        this.pickupPincode = pickupPincode;
    }

    public String getPickupPhone() {
        return pickupPhone;
    }

    public void setPickupPhone(String pickupPhone) {
        this.pickupPhone = pickupPhone;
    }

    public LocalDateTime getPickupScheduledDate() {
        return pickupScheduledDate;
    }

    public void setPickupScheduledDate(LocalDateTime pickupScheduledDate) {
        this.pickupScheduledDate = pickupScheduledDate;
    }

    public String getPickupStatus() {
        return pickupStatus;
    }

    public void setPickupStatus(String pickupStatus) {
        this.pickupStatus = pickupStatus;
    }

    public String getCourierName() {
        return courierName;
    }

    public void setCourierName(String courierName) {
        this.courierName = courierName;
    }

    public String getCourierId() {
        return courierId;
    }

    public void setCourierId(String courierId) {
        this.courierId = courierId;
    }

    public Map<String, Object> getAdditionalInfo() {
        return additionalInfo;
    }

    public void setAdditionalInfo(Map<String, Object> additionalInfo) {
        this.additionalInfo = additionalInfo;
    }

    public List<Map<String, Object>> getPickupHistory() {
        return pickupHistory;
    }

    public void setPickupHistory(List<Map<String, Object>> pickupHistory) {
        this.pickupHistory = pickupHistory;
    }

    @Override
    public String toString() {
        return "PickupDetailsResponse{" +
                "status=" + status +
                ", message='" + message + '\'' +
                ", awbNumber='" + awbNumber + '\'' +
                ", pickupName='" + pickupName + '\'' +
                ", pickupAddress='" + pickupAddress + '\'' +
                ", pickupCity='" + pickupCity + '\'' +
                ", pickupState='" + pickupState + '\'' +
                ", pickupPincode='" + pickupPincode + '\'' +
                ", pickupPhone='" + pickupPhone + '\'' +
                ", pickupScheduledDate=" + pickupScheduledDate +
                ", pickupStatus='" + pickupStatus + '\'' +
                ", courierName='" + courierName + '\'' +
                ", courierId='" + courierId + '\'' +
                '}';
    }
}