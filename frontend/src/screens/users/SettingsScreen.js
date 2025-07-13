import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  Alert,
  Modal
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAlert from '../../components/CustomAlert';
import { useTheme } from '../../theme/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [alertOnConfirm, setAlertOnConfirm] = useState(null);
  const [alertShowCancel, setAlertShowCancel] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(false);
    // Navigate to login screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const showAlert = (title, message, type = 'info', onConfirm = null, showCancel = false) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertOnConfirm(() => onConfirm);
    setAlertShowCancel(showCancel);
    setAlertVisible(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    showAlert(
      'Account Deleted',
      'Your account has been permanently deleted.',
      'success',
      () => navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      }),
      false
    );
  };

  const renderSettingItem = (icon, title, subtitle, onPress, rightComponent = null) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Icon name={icon} size={20} color={theme.icon} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: theme.text }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || <Icon name="chevron-right" size={20} color="#ccc" />}
    </TouchableOpacity>
  );

  const renderSwitchItem = (icon, title, subtitle, value, onValueChange) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Icon name={icon} size={20} color={theme.icon} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: theme.text }]}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e9ecef', true: '#667eea' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.header}
        style={styles.headerGradient}
      >
        <Animatable.View animation="fadeInDown" delay={100} duration={500} style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={theme.headerText} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.headerText }]}>Settings</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="more-vert" size={24} color={theme.headerText} />
          </TouchableOpacity>
        </Animatable.View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Animatable.View animation="fadeInUp" delay={150} duration={500}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile</Text>
            <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
              <View style={styles.profileInfo}>
                <View style={[styles.profileAvatar, { backgroundColor: theme.icon }]}>
                  <Icon name="person" size={32} color={theme.buttonText} />
                </View>
                <View style={styles.profileDetails}>
                  <Text style={[styles.profileName, { color: theme.text }]}>John Doe</Text>
                  <Text style={[styles.profileEmail, { color: theme.text }]}>john.doe@example.com</Text>
                  <Text style={[styles.profilePhone, { color: theme.text }]}>+91 98765 43210</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Icon name="edit" size={16} color={theme.icon} />
                <Text style={[styles.editButtonText, { color: theme.icon }]}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animatable.View>

        {/* Preferences Section */}
        <Animatable.View animation="fadeInUp" delay={175} duration={500}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
              {renderSwitchItem(
                'notifications',
                'Push Notifications',
                'Get notified about print status and offers',
                notifications,
                setNotifications
              )}
              
            </View>
          </View>
        </Animatable.View>

        {/* Account Section */}
        <Animatable.View animation="fadeInUp" delay={200} duration={500}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
              {renderSettingItem(
                'person',
                'Personal Information',
                'Update your profile details',
                () => showAlert('Coming Soon', 'Personal information update feature coming soon!')
              )}
              {renderSettingItem(
                'lock',
                'Change Password',
                'Update your account password',
                () => showAlert('Coming Soon', 'Password change feature coming soon!')
              )}
              {renderSettingItem(
                'payment',
                'Payment Methods',
                'Manage your payment options',
                () => showAlert('Coming Soon', 'Payment methods feature coming soon!')
              )}
              {renderSettingItem(
                'receipt',
                'Billing History',
                'View your past invoices',
                () => showAlert('Coming Soon', 'Billing history feature coming soon!')
              )}
            </View>
          </View>
        </Animatable.View>

        {/* App Section */}
        <Animatable.View animation="fadeInUp" delay={225} duration={500}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>App</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
              {renderSettingItem(
                'help',
                'Help & Support',
                'Get help and contact support',
                () => showAlert('Coming Soon', 'Help & support feature coming soon!')
              )}
              {renderSettingItem(
                'info',
                'About LipiPrint',
                'App version and information',
                () => showAlert('About LipiPrint', 'Version 1.0.0\n\nLipiPrint - Your Smart Printing Solution')
              )}
              {renderSettingItem(
                'star',
                'Rate App',
                'Rate us on the app store',
                () => showAlert('Rate App', 'Thank you for using LipiPrint! Please rate us on the app store.')
              )}
              {renderSettingItem(
                'share',
                'Share App',
                'Share with friends and family',
                () => showAlert('Share App', 'Share feature coming soon!')
              )}
            </View>
          </View>
        </Animatable.View>

        {/* Privacy Section */}
        <Animatable.View animation="fadeInUp" delay={250} duration={500}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Privacy & Security</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
              {renderSettingItem(
                'security',
                'Privacy Policy',
                'Read our privacy policy',
                () => showAlert('Privacy Policy', 'Privacy policy details coming soon!')
              )}
              {renderSettingItem(
                'description',
                'Terms of Service',
                'Read our terms of service',
                () => showAlert('Terms of Service', 'Terms of service details coming soon!')
              )}
              {renderSettingItem(
                'delete',
                'Clear Cache',
                'Clear app cache and data',
                () => showAlert('Cache Cleared', 'App cache has been cleared successfully!')
              )}
            </View>
          </View>
        </Animatable.View>

        {/* Danger Zone */}
        <Animatable.View animation="fadeInUp" delay={275} duration={500}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Danger Zone</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
              {renderSettingItem(
                'logout',
                'Logout',
                'Sign out of your account',
                () => setShowLogoutModal(true)
              )}
              {renderSettingItem(
                'delete-forever',
                'Delete Account',
                'Permanently delete your account',
                () => setShowDeleteModal(true),
                <Icon name="delete-forever" size={20} color="#F44336" />
              )}
            </View>
          </View>
        </Animatable.View>

        {/* App Version */}
        <Animatable.View animation="fadeInUp" delay={300} duration={500}>
          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { color: theme.text }]}>LipiPrint v1.0.0</Text>
            <Text style={[styles.copyrightText, { color: theme.text }]}>© 2024 LipiPrint. All rights reserved.</Text>
          </View>
        </Animatable.View>
      </ScrollView>

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="logout" size={32} color="#667eea" />
              <Text style={styles.modalTitle}>Logout</Text>
              <Text style={styles.modalSubtitle}>Are you sure you want to logout?</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleLogout}
              >
                <Text style={styles.modalButtonTextConfirm}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="delete-forever" size={32} color="#F44336" />
              <Text style={styles.modalTitle}>Delete Account</Text>
              <Text style={styles.modalSubtitle}>
                This action cannot be undone. All your data will be permanently deleted.
              </Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.modalButtonTextDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertOnConfirm}
        showCancel={alertShowCancel}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonCancel: {
    backgroundColor: '#f8f9fa',
  },
  modalButtonConfirm: {
    backgroundColor: '#667eea',
  },
  modalButtonDelete: {
    backgroundColor: '#F44336',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalButtonTextDelete: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
}); 