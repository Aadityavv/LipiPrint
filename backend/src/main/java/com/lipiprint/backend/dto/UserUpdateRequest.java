package com.lipiprint.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserUpdateRequest {
    @NotBlank
    @Size(min = 1, max = 100)
    private String name;

    @NotBlank
    @Email
    private String email;

    // Optional fields for future use
    private String gstin;
    private String userType;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }
    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }
}