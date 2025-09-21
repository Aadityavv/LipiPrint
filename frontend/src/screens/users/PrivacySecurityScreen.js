import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../../theme/ThemeContext';
import CustomAlert from '../../components/CustomAlert';

export default function PrivacySecurityScreen({ navigation }) {
  const { theme } = useTheme();
  const [settings, setSettings] = useState({
    dataCollection: true,
    analytics: true,
    marketing: false,
    locationTracking: false,
    biometricAuth: false,
    twoFactorAuth: false,
  });
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');

  const showAlert = (title, message, type = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChangePassword = () => {
    showAlert('Change Password', 'Password change feature coming soon! We will send you an OTP to your email to reset your password.', 'info');
  };

  const handleTwoFactorAuth = () => {
    showAlert('Two-Factor Authentication', 'Two-factor authentication feature coming soon! This will add an extra layer of security to your account.', 'info');
  };

  const handleDataExport = () => {
    showAlert('Data Export', 'Data export feature coming soon! You will be able to download all your data in a secure format.', 'info');
  };

  const handleDeleteAccount = () => {
    showAlert('Delete Account', 'Account deletion is a permanent action. Please contact our support team for assistance with account deletion.', 'error');
  };

  const privacySections = [
    {
      title: 'Data & Privacy',
      items: [
        {
          key: 'dataCollection',
          title: 'Data Collection',
          description: 'Allow collection of usage data to improve our services',
          icon: 'data-usage',
          color: '#2196F3',
        },
        {
          key: 'analytics',
          title: 'Analytics',
          description: 'Help us improve the app by sharing anonymous usage statistics',
          icon: 'analytics',
          color: '#4CAF50',
        },
        {
          key: 'marketing',
          title: 'Marketing Communications',
          description: 'Receive promotional emails and notifications about new features',
          icon: 'campaign',
          color: '#FF9800',
        },
        {
          key: 'locationTracking',
          title: 'Location Tracking',
          description: 'Allow location tracking for delivery and pickup services',
          icon: 'location-on',
          color: '#F44336',
        },
      ]
    },
    {
      title: 'Security',
      items: [
        {
          key: 'biometricAuth',
          title: 'Biometric Authentication',
          description: 'Use fingerprint or face recognition to secure your account',
          icon: 'fingerprint',
          color: '#9C27B0',
        },
        {
          key: 'twoFactorAuth',
          title: 'Two-Factor Authentication',
          description: 'Add an extra layer of security to your account',
          icon: 'security',
          color: '#607D8B',
        },
      ]
    }
  ];

  const actionItems = [
    {
      title: 'Change Password',
      description: 'Update your account password',
      icon: 'lock',
      color: '#FF5722',
      onPress: handleChangePassword,
    },
    {
      title: 'Export Data',
      description: 'Download all your data',
      icon: 'download',
      color: '#2196F3',
      onPress: handleDataExport,
    },
    {
      title: 'Delete Account',
      description: 'Permanently delete your account',
      icon: 'delete-forever',
      color: '#F44336',
      onPress: handleDeleteAccount,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={['#22194f', '#22194f']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {privacySections.map((section, sectionIndex) => (
          <Animatable.View
            key={section.title}
            animation="fadeInUp"
            delay={sectionIndex * 100}
            duration={500}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
              {section.items.map((item, itemIndex) => (
                <View key={item.key} style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: item.color + '20' }]}>
                      <Icon name={item.icon} size={20} color={item.color} />
                    </View>
                    <View style={styles.settingText}>
                      <Text style={[styles.settingTitle, { color: theme.text }]}>{item.title}</Text>
                      <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings[item.key]}
                    onValueChange={() => toggleSetting(item.key)}
                    trackColor={{ false: '#E0E0E0', true: item.color + '40' }}
                    thumbColor={settings[item.key] ? item.color : '#F4F3F4'}
                  />
                </View>
              ))}
            </View>
          </Animatable.View>
        ))}

        <Animatable.View animation="fadeInUp" delay={300} duration={500} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Actions</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
            {actionItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: item.color + '20' }]}>
                    <Icon name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={400} duration={500} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Privacy Policy</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => showAlert('Privacy Policy', 'Our privacy policy explains how we collect, use, and protect your data. You can view the full policy on our website.', 'info')}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#2196F320' }]}>
                  <Icon name="policy" size={20} color="#2196F3" />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>View Privacy Policy</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Read our complete privacy policy
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: -30,
  },
  headerRight: {
    width: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});