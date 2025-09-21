package com.lipiprint.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EmailOtpVerifyRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 4, max = 6)
    private String otp;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
}