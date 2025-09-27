import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { createNavigationContainerRef } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import common screens
import SplashScreen from '../screens/common/SplashScreen';
import LoginScreen from '../screens/common/LoginScreen';
import SignUpScreen from '../screens/common/SignUpScreen';
import ForgotPasswordScreen from '../screens/common/ForgotPasswordScreen';
import TestConfettiScreen from '../screens/common/TestConfettiScreen';
import OrderTrackingScreen from '../screens/users/OrderTrackingScreen';

// Import user screens
import HomeScreen from '../screens/users/HomeScreen';
import UploadScreen from '../screens/users/UploadScreen';
import PrintOptionsScreen from '../screens/users/PrintOptionsScreen';
import DeliveryOptionsScreen from '../screens/users/DeliveryOptionsScreen';
import PaymentScreen from '../screens/users/PaymentScreen';
import OrderConfirmationScreen from '../screens/users/OrderConfirmationScreen';
import OrdersScreen from '../screens/users/OrdersScreen';
import ProfileScreen from '../screens/users/ProfileScreen';
import TrackOrderScreen from '../screens/users/TrackOrderScreen';
import DashboardScreen from '../screens/users/DashboardScreen';
import CheckoutScreen from '../screens/users/CheckoutScreen';
import ReviewOrderScreen from '../screens/users/ReviewOrderScreen';
import OnboardingScreen from '../screens/users/OnboardingScreen';
import TutorialScreen from '../screens/users/TutorialScreen';
import HelpCenterScreen from '../screens/users/HelpCenterScreen';
import HelpCentreScreen from '../screens/users/HelpCentreScreen';
import HelpSupportScreen from '../screens/users/HelpSupportScreen';
import ProfileCompletionScreen from '../screens/users/ProfileCompletionScreen';
import SettingsScreen from '../screens/users/SettingsScreen';
import PersonalInfoScreen from '../screens/users/PersonalInfoScreen';
import SavedAddressesScreen from '../screens/users/SavedAddressesScreen';
import CustomerSupportScreen from '../screens/users/CustomerSupportScreen';
import AboutScreen from '../screens/users/AboutScreen';
import InvoiceDetailScreen from '../screens/users/InvoiceDetailScreen';
import FilesScreen from '../screens/users/FilesScreen';
import NotificationsScreen from '../screens/users/NotificationsScreen';
import PrivacySecurityScreen from '../screens/users/PrivacySecurityScreen';

// Import admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AddEmployeeScreen from '../screens/admin/AddEmployeeScreen';
import UpdateServicesScreen from '../screens/admin/UpdateServicesScreen';
import AdminOrderDetailScreen from '../screens/admin/AdminOrderDetailScreen';
import AdminReconciliationScreen from '../screens/admin/AdminReconciliationScreen';
import FileManagerScreen from '../screens/admin/FileManagerScreen';
import AdminDiscountScreen from '../screens/admin/AdminDiscountScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Main Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === 'Upload') iconName = 'upload-file';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0058A3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: { display: 'none' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Upload" component={UploadScreen} />
    </Tab.Navigator>
  );
}

// Admin Tab Navigator
function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'dashboard';
          if (route.name === 'AdminOrders') iconName = 'assignment';
          else if (route.name === 'AdminUsers') iconName = 'people';
          else if (route.name === 'AdminAnalytics') iconName = 'analytics';
          else if (route.name === 'AdminSettings') iconName = 'settings';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0058A3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="AdminOrders" component={AdminOrdersScreen} options={{ tabBarLabel: 'Orders' }} />
      <Tab.Screen name="AdminUsers" component={AdminUsersScreen} options={{ tabBarLabel: 'Users' }} />
      <Tab.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} options={{ tabBarLabel: 'Analytics' }} />
      <Tab.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}

export const navigationRef = createNavigationContainerRef();

// Main Stack Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Common Screens */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="TestConfetti" component={TestConfettiScreen} />
        
        {/* User Screens */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
        <Stack.Screen name="PrintOptions" component={PrintOptionsScreen} />
        <Stack.Screen name="DeliveryOptions" component={DeliveryOptionsScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
        <Stack.Screen name="TrackOrderScreen" component={TrackOrderScreen} />
        <Stack.Screen name="OrdersScreen" component={OrdersScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="ReviewOrder" component={ReviewOrderScreen} />
        <Stack.Screen
  name="OrderTracking"
  component={OrderTrackingScreen}
  options={{
    headerShown: false,
    animation: 'slide_from_right',
  }}
/>

        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Tutorial" component={TutorialScreen} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="HelpCentreScreen" component={HelpCentreScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
        <Stack.Screen name="CustomerSupport" component={CustomerSupportScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="InvoiceDetailScreen" component={InvoiceDetailScreen} />
        <Stack.Screen name="FilesScreen" component={FilesScreen} />
        <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
        
        {/* Admin Screens */}
        <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
        <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
        <Stack.Screen name="UpdateServices" component={UpdateServicesScreen} />
        <Stack.Screen name="AdminOrderDetailScreen" component={AdminOrderDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminReconciliationScreen" component={AdminReconciliationScreen} />
        <Stack.Screen name="FileManagerScreen" component={FileManagerScreen} />
        <Stack.Screen name="AdminDiscountScreen" component={AdminDiscountScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
