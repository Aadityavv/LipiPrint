# Google Sign-In Setup Guide

## Current Status
Google Sign-In is currently disabled due to configuration issues. The buttons show "Coming Soon" until proper setup is completed.

## Error Details
The `DEVELOPER_ERROR` indicates that the Google Sign-In configuration is incomplete. This is because:

1. The `google-services.json` file has an empty `oauth_client` array
2. No Web Client ID is configured
3. OAuth 2.0 credentials are not set up in Google Cloud Console

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `lipiprint-c2066`
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**

### 2. Configure OAuth Client

#### For Android:
1. Choose **Android** as application type
2. **Package name**: `com.LipiPrint`
3. **SHA-1 certificate fingerprint**: 
   - For debug: Get from `keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android`
   - For release: Get from your release keystore
4. Click **Create**

#### For Web (Required for React Native):
1. Choose **Web application** as application type
2. **Name**: LipiPrint Web Client
3. **Authorized redirect URIs**: Add your domain (if any)
4. Click **Create**
5. **Copy the Client ID** - this is your Web Client ID

### 3. Update Configuration Files

#### Update google-services.json:
```json
{
  "project_info": {
    "project_number": "159519217125",
    "project_id": "lipiprint-c2066",
    "storage_bucket": "lipiprint-c2066.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:159519217125:android:a9c4dc6d54def8708c0b0c",
        "android_client_info": {
          "package_name": "com.LipiPrint"
        }
      },
      "oauth_client": [
        {
          "client_id": "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
          "client_type": 1,
          "android_info": {
            "package_name": "com.LipiPrint",
            "certificate_hash": "YOUR_SHA1_FINGERPRINT"
          }
        },
        {
          "client_id": "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "AIzaSyB9l4M0HF3ulC34ryjvQimKbIGsNix4kts"
        }
      ]
    }
  ]
}
```

#### Update googleAuth.js:
```javascript
configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From step 2
    offlineAccess: true,
  });
}
```

### 4. Enable Google Sign-In

Once configuration is complete:

1. Update `googleAuth.js` with the correct Web Client ID
2. Replace the placeholder in `google-services.json`
3. In `LoginScreen.js` and `SignUpScreen.js`, change:
   ```javascript
   // From:
   onPress={() => showAlert('Coming Soon', 'Google Sign-In will be available soon...', 'info')}
   disabled={true}
   
   // To:
   onPress={handleGoogleSignIn}
   disabled={isLoading}
   ```

### 5. Test Configuration

1. Clean and rebuild the app
2. Test Google Sign-In on both Android and iOS
3. Verify that users can sign in with Google accounts

## Troubleshooting

### Common Issues:
1. **DEVELOPER_ERROR**: Configuration not complete
2. **SIGN_IN_REQUIRED**: User needs to sign in again
3. **NETWORK_ERROR**: Check internet connection
4. **INVALID_ACCOUNT**: Wrong package name or SHA-1

### Debug Steps:
1. Check SHA-1 fingerprint matches exactly
2. Verify package name is correct
3. Ensure Web Client ID is properly set
4. Check that Google Sign-In API is enabled in Google Cloud Console

## Current Workaround

Until Google Sign-In is properly configured, users can:
- Sign in with email/password
- Use the forgot password feature with email OTP
- All other app features work normally

The Google Sign-In buttons are disabled with a "Coming Soon" message to avoid user confusion.