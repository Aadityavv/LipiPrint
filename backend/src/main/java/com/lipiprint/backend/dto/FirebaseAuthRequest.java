package com.lipiprint.backend.dto;

public class FirebaseAuthRequest {
    private String idToken;
    private String phoneNumber;

    // Constructors
    public FirebaseAuthRequest() {}
    
    public FirebaseAuthRequest(String idToken, String phoneNumber) {
        this.idToken = idToken;
        this.phoneNumber = phoneNumber;
    }

    // Getters and Setters
    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }
    
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
}
