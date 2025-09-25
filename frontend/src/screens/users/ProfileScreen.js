import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import ApiService from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import LottieView from 'lottie-react-native';
import DataAnalysisLottie from '../../assets/animations/Isometric data analysis.json';
import CustomAlert from '../../components/CustomAlert';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const [userInfo, setUserInfo] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [alertOnConfirm, setAlertOnConfirm] = useState(null);
  const [alertShowCancel, setAlertShowCancel] = useState(false);
  const [menuItems, setMenuItems] = useState([
    {
      id: 'personal',
      title: 'Personal Information',
      icon: 'person',
      color: '#0058A3',
    },
    {
      id: 'addresses',
      title: 'Saved Addresses',
      icon: 'location-on',
      color: '#4CAF50',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      color: '#607D8B',
    },
    {
      id: 'helpCenter',
      title: 'Help Center',
      icon: 'help',
      color: '#FF9800',
    },
    {
      id: 'tutorial',
      title: 'Tutorial',
      icon: 'school',
      color: '#4CAF50',
    },
    {
      id: 'support',
      title: 'Customer Support',
      icon: 'support-agent',
      color: '#F44336',
    },
    {
      id: 'about',
      title: 'About LipiPrint',
      icon: 'info',
      color: '#607D8B',
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'logout',
      color: '#FF5722',
    },
  ]);

  useEffect(() => {
    loadProfileData();
  }, []);

  // Add 'Uploaded Files' to menuItems only if not already present
  useEffect(() => {
    setMenuItems(prev => {
      if (prev.some(item => item.id === 'files')) return prev;
      return [
        ...prev.slice(0, 1),
        {
          id: 'files',
          title: 'Uploaded Files',
          icon: 'folder',
          color: '#0058A3',
        },
        ...prev.slice(1)
      ];
    });
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user info and statistics in parallel
      const [userData, statsData] = await Promise.all([
        ApiService.getCurrentUser(),
        ApiService.getUserStatistics()
      ]);
      
      setUserInfo(userData);
      setUserStats(statsData);
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
    });
  };

  const showAlert = (title, message, type = 'info', onConfirm = null, showCancel = false) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertOnConfirm(onConfirm);
    setAlertShowCancel(showCancel);
    setAlertVisible(true);
  };

  const handleLogout = async () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout? You will need to sign in again to access your account.',
      'warning',
      async () => {
        try {
          await ApiService.logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Splash' }],
          });
        } catch (error) {
          console.error('Logout error:', error);
          showAlert('Logout Failed', 'Failed to logout. Please try again.', 'error');
        }
      },
      true
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <LottieView
          source={DataAnalysisLottie}
          autoPlay
          loop
          speed={1.2}
          style={{ width: 200, height: 200 }}
        />
        <Text style={{ color: '#22194f', fontWeight: 'bold', fontSize: 18, marginTop: 18 }}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={48} color="#FF5722" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfileData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="person-off" size={48} color="#FF5722" />
        <Text style={styles.errorText}>User information not available</Text>
      </View>
    );
  }

  const stats = [
    { 
      label: 'Total Orders', 
      value: userStats?.totalOrders?.toString() || '0', 
      icon: 'receipt' 
    },
    { 
      label: 'Total Spent', 
      value: formatCurrency(userStats?.totalSpent), 
      icon: 'account-balance-wallet' 
    },
    { 
      label: 'Total Saved', 
      value: formatCurrency(userStats?.totalSaved), 
      icon: 'savings' 
    },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#667eea']}
          tintColor="#667eea"
        />
      }
    >
      <LinearGradient
        colors={['#22194f', '#22194f']}
        style={styles.headerGradient}
      >
        <Animatable.View animation="fadeInDown" delay={100} duration={500} style={styles.header}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitial}>{userInfo.name?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{userInfo.name || 'User'}</Text>
          <Text style={styles.userEmail}>{userInfo.email || 'No email'}</Text>
          <Text style={styles.userPhone}>{userInfo.phone || 'No phone'}</Text>
        </Animatable.View>
      </LinearGradient>

      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.userInfo}>
            <Text style={styles.userPhone}>{userInfo.phone || 'No phone'}</Text>
            <View style={styles.memberBadge}>
              <Icon name="star" size={12} color="#FFD700" />
              <Text style={styles.memberText}>
                Member since {formatDate(userInfo.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Icon name={stat.icon} size={24} color="#0058A3" />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* GSTIN Info - Only show if user has business role or GSTIN */}
      {userInfo.role === 'ADMIN' && (
        <View style={styles.gstinCard}>
          <View style={styles.gstinHeader}>
            <Icon name="business" size={20} color="#0058A3" />
            <Text style={styles.gstinTitle}>Business Account</Text>
          </View>
          <Text style={styles.gstinNumber}>GSTIN: {userInfo.gstin || 'Not available'}</Text>
          <Text style={styles.gstinNote}>
            You can claim GST benefits on your orders
          </Text>
        </View>
      )}

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => {
              if (item.id === 'logout') {
                handleLogout();
              } else if (item.id === 'settings') {
                navigation.navigate('Settings');
              } else if (item.id === 'helpCenter') {
                navigation.navigate('HelpCentreScreen');
              } else if (item.id === 'personal') {
                navigation.navigate('PersonalInfo');
              } else if (item.id === 'addresses') {
                navigation.navigate('SavedAddresses');
              } else if (item.id === 'tutorial') {
                navigation.navigate('Tutorial');
              } else if (item.id === 'support') {
                navigation.navigate('CustomerSupport');
              } else if (item.id === 'about') {
                navigation.navigate('About');
              } else if (item.id === 'files') {
                navigation.navigate('FilesScreen');
              } else {
                // Navigate to respective screens
                console.log(`Navigate to ${item.title}`);
              }
            }}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Icon name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>LipiPrint v1.0.0</Text>
        <Text style={styles.copyrightText}>© 2025 LipiPrint. All rights reserved.</Text>
      </View>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertOnConfirm}
        showCancel={alertShowCancel}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
  },
  userPhone: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
  },
  userCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -20,
  },
  memberText: {
    fontSize: 15,
    color: '#FFA500',
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statCard: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    width: (width - 60) / 3,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  gstinCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gstinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  gstinTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  gstinNumber: {
    fontSize: 14,
    color: '#0058A3',
    fontWeight: '600',
    marginBottom: 5,
  },
  gstinNote: {
    fontSize: 12,
    color: '#666',
  },
  menuContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 18,
    color: '#667eea',
    marginTop: 20,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF5722',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#667eea',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});
