package com.lipiprint.backend.dto;

public class OtpRequest {
    private String phone;
    private String otp;
// Add this field to your existing OtpRequest class
private String idToken; // Firebase ID token

// Add getter and setter
public String getIdToken() { return idToken; }
public void setIdToken(String idToken) { this.idToken = idToken; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
} 