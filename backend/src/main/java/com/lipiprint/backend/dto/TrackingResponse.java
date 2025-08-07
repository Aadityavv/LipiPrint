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

    // Constructors
    public TrackingResponse() {}

    // Getters and Setters
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
    public void setExpectedDeliveryDate(String expectedDeliveryDate) { this.expectedDeliveryDate = expectedDeliveryDate; }

    public List<TrackingEvent> getTrackingData() { return trackingData; }
    public void setTrackingData(List<TrackingEvent> trackingData) { this.trackingData = trackingData; }

    // Inner class for tracking events
    public static class TrackingEvent {
        private String date;
        private String activity;
        private String location;

        public TrackingEvent() {}

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public String getActivity() { return activity; }
        public void setActivity(String activity) { this.activity = activity; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
    }
}
