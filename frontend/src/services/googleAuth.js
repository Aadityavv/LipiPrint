import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import ApiService from './api';

class GoogleAuthService {
  constructor() {
    this.configureGoogleSignIn();
  }

  configureGoogleSignIn() {
    try {
      GoogleSignin.configure({
        // For now, we'll use a placeholder. In production, you need to:
        // 1. Go to Google Cloud Console
        // 2. Create OAuth 2.0 credentials
        // 3. Add your package name and SHA-1 fingerprint
        // 4. Get the Web Client ID from the credentials
        webClientId: '159519217125-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com',
        offlineAccess: true,
      });
    } catch (error) {
      console.warn('Google Sign-In configuration warning:', error);
    }
  }

  async signInWithGoogle() {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      const user = userCredential.user;
      
      // Get the Firebase ID token
      const firebaseToken = await user.getIdToken();
      
      // Send the token to your backend for verification and user creation/login
      const response = await this.authenticateWithBackend(firebaseToken, user);
      
      return response;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      // Handle specific Google Sign-In configuration errors
      if (error.code === 'DEVELOPER_ERROR') {
        throw new Error('Google Sign-In is not properly configured. Please contact support or try signing in with email/password.');
      }
      
      throw new Error(this.getErrorMessage(error));
    }
  }

  async authenticateWithBackend(firebaseToken, firebaseUser) {
    try {
      const response = await fetch(`${ApiService.baseURL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: firebaseToken,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.accessToken) {
        await ApiService.setToken(data.accessToken);
      }
      
      return data;
    } catch (error) {
      console.error('Backend authentication error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
    } catch (error) {
      console.error('Google Sign-Out Error:', error);
    }
  }

  getErrorMessage(error) {
    switch (error.code) {
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email using a different sign-in method.';
      case 'auth/credential-already-in-use':
        return 'This credential is already associated with a different user account.';
      default:
        return 'Google Sign-In failed. Please try again.';
    }
  }
}

export default new GoogleAuthService();