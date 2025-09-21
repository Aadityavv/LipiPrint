# Email Integration Setup Guide

## Current Status
The email OTP system is currently set up but only logs OTPs to the console. For production, you need to integrate with a real email service.

## Recommended Email Services

### Option 1: SendGrid (Recommended)
1. **Sign up**: Go to [SendGrid](https://sendgrid.com/)
2. **Get API Key**: 
   - Go to Settings > API Keys
   - Create a new API key with "Mail Send" permissions
3. **Update Backend**:
   - Add SendGrid dependency to `pom.xml`
   - Update `EmailOtpService` to use SendGrid API
   - Add SendGrid API key to environment variables

### Option 2: AWS SES
1. **Set up AWS Account**: Go to [AWS Console](https://console.aws.amazon.com/)
2. **Verify Email Domain**: In SES console, verify your domain
3. **Get Credentials**: Create IAM user with SES permissions
4. **Update Backend**: Similar to SendGrid integration

### Option 3: Gmail SMTP (Simple)
1. **Enable 2FA**: On your Gmail account
2. **Generate App Password**: Google Account > Security > App passwords
3. **Update Backend**: Use SMTP configuration

## Quick Setup with Gmail SMTP

### 1. Update Backend Dependencies
Add to `backend/pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

### 2. Update Application Properties
Add to `backend/src/main/resources/application.properties`:
```properties
# Email Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${EMAIL_USERNAME}
spring.mail.password=${EMAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### 3. Environment Variables
Add to your `.env` file:
```
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 4. Update EmailOtpService
The service will be updated to use Spring Mail instead of console logging.

## Testing
1. Set up email credentials
2. Test forgot password flow
3. Check email inbox for OTP
4. Verify OTP works correctly

## Production Considerations
- Use a dedicated email service (SendGrid/AWS SES)
- Set up proper email templates
- Add rate limiting for OTP requests
- Monitor email delivery rates
- Set up email bounce handling