package com.lipiprint.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class TrackingResponse {
    private boolean status;
    private String message;
    
    @JsonProperty("awb_number")
    private String awbNumber;
    
    @JsonProperty("current_status")
    private String currentStatus;
    
    @JsonProperty("delivered_date")
    private String deliveredDate;
    
    @JsonProperty("expected_delivery_date")
    private String expectedDeliveryDate;
    
    @JsonProperty("tracking_data")
    private List<TrackingEvent> trackingData;
    
    // ✅ ADDED: Missing fields for NimbusPost integration
    @JsonProperty("last_location")
    private String lastLocation;
    
    @JsonProperty("courier_name")
    private String courierName;

    // Constructors
    public TrackingResponse() {}

    // ✅ COMPLETE: All Getters and Setters
    public boolean isStatus() { return status; }
    public void setStatus(boolean status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getAwbNumber() { return awbNumber; }
    public void setAwbNumber(String awbNumber) { this.awbNumber = awbNumber; }

    public String getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(String currentStatus) { this.currentStatus = currentStatus; }

    public String getDeliveredDate() { return deliveredDate; }
    public void setDeliveredDate(String deliveredDate) { this.deliveredDate = deliveredDate; }

    public String getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(String expectedDeliveryDate) { 
        this.expectedDeliveryDate = expectedDeliveryDate; 
    }

    public List<TrackingEvent> getTrackingData() { return trackingData; }
    public void setTrackingData(List<TrackingEvent> trackingData) { this.trackingData = trackingData; }

    // ✅ ADDED: Missing getters/setters for new fields
    public String getLastLocation() { return lastLocation; }
    public void setLastLocation(String lastLocation) { this.lastLocation = lastLocation; }

    public String getCourierName() { return courierName; }
    public void setCourierName(String courierName) { this.courierName = courierName; }

    // ✅ ADDED: Convenience methods for parsing compatibility
    public void setStatus(String statusString) {
        if ("true".equalsIgnoreCase(statusString) || "success".equalsIgnoreCase(statusString)) {
            this.status = true;
        } else if ("false".equalsIgnoreCase(statusString) || "failed".equalsIgnoreCase(statusString)) {
            this.status = false;
        } else {
            this.currentStatus = statusString;
        }
    }

    public void setExpectedDelivery(String expectedDelivery) {
        this.expectedDeliveryDate = expectedDelivery;
    }

    @Override
    public String toString() {
        return "TrackingResponse{" +
                "status=" + status +
                ", message='" + message + '\'' +
                ", awbNumber='" + awbNumber + '\'' +
                ", currentStatus='" + currentStatus + '\'' +
                ", lastLocation='" + lastLocation + '\'' +
                ", expectedDeliveryDate='" + expectedDeliveryDate + '\'' +
                ", courierName='" + courierName + '\'' +
                '}';
    }

    // ✅ ENHANCED: Complete TrackingEvent inner class
    public static class TrackingEvent {
        private String date;
        private String activity;
        private String location;
        
        @JsonProperty("status")
        private String status;
        
        @JsonProperty("timestamp")
        private String timestamp;
        
        @JsonProperty("description")
        private String description;

        public TrackingEvent() {}

        // ✅ COMPLETE: All getters and setters
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public String getActivity() { return activity; }
        public void setActivity(String activity) { this.activity = activity; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        @Override
        public String toString() {
            return "TrackingEvent{" +
                    "date='" + date + '\'' +
                    ", activity='" + activity + '\'' +
                    ", location='" + location + '\'' +
                    ", status='" + status + '\'' +
                    ", timestamp='" + timestamp + '\'' +
                    ", description='" + description + '\'' +
                    '}';
        }
    }
}
