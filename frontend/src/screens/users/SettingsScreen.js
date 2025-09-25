import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';
import ApiService from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [darkMode, setDarkMode] = useState(isDark);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    loadUserSettings();
    loadUserInfo();
  }, []);

  const loadUserSettings = async () => {
    try {
      // Load settings from AsyncStorage or API
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNotifications(settings.notifications ?? true);
        setOrderUpdates(settings.orderUpdates ?? true);
        setPromotionalEmails(settings.promotionalEmails ?? false);
        setSmsNotifications(settings.smsNotifications ?? true);
        setEmailNotifications(settings.emailNotifications ?? true);
        setPushNotifications(settings.pushNotifications ?? true);
        setAutoSave(settings.autoSave ?? true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadUserInfo = async () => {
    try {
      const user = await ApiService.getCurrentUser();
      setUserInfo(user);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        notifications,
        orderUpdates,
        promotionalEmails,
        smsNotifications,
        emailNotifications,
        pushNotifications,
        autoSave,
        darkMode,
      };
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
      
      // If dark mode changed, toggle theme
      if (darkMode !== isDark) {
        toggleTheme();
      }
      
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    try {
      await ApiService.request('/user/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      
      Alert.alert('Success', 'Password changed successfully');
      setShowChangePasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password. Please check your current password.');
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    // Logout logic is handled in ProfileScreen
    navigation.goBack();
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setNotifications(true);
            setOrderUpdates(true);
            setPromotionalEmails(false);
            setSmsNotifications(true);
            setEmailNotifications(true);
            setPushNotifications(true);
            setAutoSave(true);
            setDarkMode(false);
            Alert.alert('Success', 'Settings reset to default');
          },
        },
      ]
    );
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear app cache and temporary files. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage cache (keep auth token)
              const authToken = await AsyncStorage.getItem('authToken');
              await AsyncStorage.clear();
              if (authToken) {
                await AsyncStorage.setItem('authToken', authToken);
              }
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Receive push notifications',
          type: 'switch',
          value: pushNotifications,
          onValueChange: setPushNotifications,
          icon: 'notifications',
          iconColor: '#FF9800',
        },
        {
          id: 'orderUpdates',
          title: 'Order Updates',
          subtitle: 'Get notified about order status changes',
          type: 'switch',
          value: orderUpdates,
          onValueChange: setOrderUpdates,
          icon: 'track-changes',
          iconColor: '#4CAF50',
        },
        {
          id: 'smsNotifications',
          title: 'SMS Notifications',
          subtitle: 'Receive SMS updates',
          type: 'switch',
          value: smsNotifications,
          onValueChange: setSmsNotifications,
          icon: 'sms',
          iconColor: '#2196F3',
        },
        {
          id: 'emailNotifications',
          title: 'Email Notifications',
          subtitle: 'Receive email updates',
          type: 'switch',
          value: emailNotifications,
          onValueChange: setEmailNotifications,
          icon: 'email',
          iconColor: '#9C27B0',
        },
        {
          id: 'promotionalEmails',
          title: 'Promotional Emails',
          subtitle: 'Receive promotional offers and updates',
          type: 'switch',
          value: promotionalEmails,
          onValueChange: setPromotionalEmails,
          icon: 'campaign',
          iconColor: '#FF5722',
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          id: 'darkMode',
          title: 'Dark Mode',
          subtitle: 'Switch between light and dark theme',
          type: 'switch',
          value: darkMode,
          onValueChange: setDarkMode,
          icon: 'dark-mode',
          iconColor: '#607D8B',
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          id: 'changePassword',
          title: 'Change Password',
          subtitle: 'Update your account password',
          type: 'action',
          icon: 'lock',
          iconColor: '#F44336',
          onPress: () => setShowChangePasswordModal(true),
        },
        {
          id: 'autoSave',
          title: 'Auto Save',
          subtitle: 'Automatically save your progress',
          type: 'switch',
          value: autoSave,
          onValueChange: setAutoSave,
          icon: 'save',
          iconColor: '#4CAF50',
        },
      ],
    },
    {
      title: 'Storage & Data',
      items: [
        {
          id: 'clearCache',
          title: 'Clear Cache',
          subtitle: 'Free up storage space',
          type: 'action',
          icon: 'storage',
          iconColor: '#FF9800',
          onPress: clearCache,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'logout',
          title: 'Logout',
          subtitle: 'Sign out of your account',
          type: 'action',
          icon: 'logout',
          iconColor: '#FF5722',
          onPress: () => setShowLogoutModal(true),
        },
      ],
    },
  ];

  const renderSettingItem = (item) => (
    <Animatable.View key={item.id} animation="fadeInUp" duration={300} style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '20' }]}>
          <Icon name={item.icon} size={20} color={item.iconColor} />
        </View>
        <View style={styles.settingItemContent}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
        </View>
      </View>
      <View style={styles.settingItemRight}>
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: '#e0e0e0', true: '#667eea' }}
            thumbColor={item.value ? '#fff' : '#f4f3f4'}
          />
        ) : (
          <TouchableOpacity onPress={item.onPress}>
            <Icon name="chevron-right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </Animatable.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#22194f', '#22194f']}
        style={styles.headerGradient}
      >
        <Heading
          title="Settings"
          subtitle="Customize your app experience"
          left={
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          }
          variant="primary"
        />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {userInfo && (
          <Animatable.View animation="fadeInDown" duration={500} style={styles.userInfoCard}>
            <View style={styles.userInfoContent}>
              <View style={styles.userAvatar}>
                <Text style={styles.userInitial}>{userInfo.name?.charAt(0) || 'U'}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{userInfo.name || 'User'}</Text>
                <Text style={styles.userEmail}>{userInfo.email || userInfo.phone}</Text>
              </View>
            </View>
          </Animatable.View>
        )}

        {settingsSections.map((section, sectionIndex) => (
          <Animatable.View
            key={section.title}
            animation="fadeInUp"
            delay={sectionIndex * 100}
            duration={500}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            <View style={[styles.sectionContent, { backgroundColor: theme.card }]}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderSettingItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: theme.separator }]} />
                  )}
                </View>
              ))}
            </View>
          </Animatable.View>
        ))}

        <Animatable.View animation="fadeInUp" delay={600} duration={500} style={styles.actionButtons}>
          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.saveButtonGradient}>
              <Icon name="save" size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
            <Text style={styles.resetButtonText}>Reset to Default</Text>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Current Password"
                placeholderTextColor={theme.textSecondary}
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                secureTextEntry
              />
              
              <TextInput
                style={[styles.passwordInput, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="New Password"
                placeholderTextColor={theme.textSecondary}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                secureTextEntry
              />
              
              <TextInput
                style={[styles.passwordInput, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Confirm New Password"
                placeholderTextColor={theme.textSecondary}
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                secureTextEntry
              />
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalConfirmButton} onPress={handleChangePassword}>
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalConfirmButtonGradient}>
                  <Text style={styles.modalConfirmButtonText}>Change Password</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Icon name="logout" size={32} color="#667eea" />
              <Text style={[styles.modalTitle, { color: theme.text }]}>Logout</Text>
              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                Are you sure you want to logout?
              </Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalConfirmButton} onPress={handleLogout}>
                <LinearGradient colors={['#FF5722', '#D32F2F']} style={styles.modalConfirmButtonGradient}>
                  <Text style={styles.modalConfirmButtonText}>Logout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingItemContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  settingItemRight: {
    marginLeft: 12,
  },
  separator: {
    height: 1,
    marginLeft: 68,
  },
  actionButtons: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FF5722',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  modalBody: {
    padding: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalConfirmButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});