package com.lipiprint.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserCreateRequest {
    @NotBlank
    private String name;

    @NotBlank
    @Size(min = 10, max = 15)
    private String phone;

    @NotBlank
    @Email
    private String email;

    private String gstin; // Optional
    @NotBlank
    private String userType; // 'student' or 'professional'

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }
    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }
} 