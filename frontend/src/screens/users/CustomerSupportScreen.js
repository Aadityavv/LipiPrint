import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';
import ApiService from '../../services/api';

export default function CustomerSupportScreen({ navigation }) {
  const { theme } = useTheme();
  const [userInfo, setUserInfo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    orderId: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const user = await ApiService.getCurrentUser();
      setUserInfo(user);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const supportCategories = [
    {
      id: 'order-issue',
      title: 'Order Issues',
      subtitle: 'Problems with your order',
      icon: 'receipt',
      color: '#F44336',
      issues: [
        'Order not placed successfully',
        'Wrong print options selected',
        'Order delayed or missing',
        'Print quality issues',
        'Delivery problems',
      ],
    },
    {
      id: 'payment',
      title: 'Payment Issues',
      subtitle: 'Problems with payment',
      icon: 'payment',
      color: '#4CAF50',
      issues: [
        'Payment not processed',
        'Charged multiple times',
        'Refund not received',
        'Promo code not working',
        'Billing questions',
      ],
    },
    {
      id: 'account',
      title: 'Account Issues',
      subtitle: 'Account related problems',
      icon: 'person',
      color: '#2196F3',
      issues: [
        'Cannot login to account',
        'Profile information incorrect',
        'Password reset issues',
        'Account blocked',
        'Data privacy concerns',
      ],
    },
    {
      id: 'technical',
      title: 'Technical Issues',
      subtitle: 'App or website problems',
      icon: 'bug-report',
      color: '#FF9800',
      issues: [
        'App crashing or freezing',
        'Files not uploading',
        'Website not loading',
        'Features not working',
        'Performance issues',
      ],
    },
    {
      id: 'general',
      title: 'General Inquiry',
      subtitle: 'Other questions or feedback',
      icon: 'help',
      color: '#9C27B0',
      issues: [
        'Service information',
        'Pricing questions',
        'Feature requests',
        'General feedback',
        'Partnership inquiries',
      ],
    },
  ];

  const contactOptions = [
    {
      id: 'call',
      title: 'Call Support',
      subtitle: 'Speak directly with our team',
      icon: 'phone',
      color: '#4CAF50',
      action: () => Linking.openURL('tel:+911234567890'),
      available: '9:00 AM - 7:00 PM',
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Support',
      subtitle: 'Quick chat support',
      icon: 'chat',
      color: '#25D366',
      action: () => Linking.openURL('https://wa.me/911234567890'),
      available: '24/7',
    },
    {
      id: 'email',
      title: 'Email Support',
      subtitle: 'Send detailed query',
      icon: 'email',
      color: '#2196F3',
      action: () => Linking.openURL('mailto:support@lipiprint.in'),
      available: 'Response within 2 hours',
    },
    {
      id: 'ticket',
      title: 'Create Support Ticket',
      subtitle: 'Track your issue',
      icon: 'support-agent',
      color: '#FF5722',
      action: () => setShowTicketModal(true),
      available: 'Priority support',
    },
  ];

  const handleCategorySelect = (category) => {
    setSelectedCategory(category.id);
    Alert.alert(
      category.title,
      `Common issues in ${category.title}:\n\n${category.issues.map(issue => `• ${issue}`).join('\n')}\n\nHow would you like to contact us?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL('tel:+911234567890') },
        { text: 'WhatsApp', onPress: () => Linking.openURL('https://wa.me/911234567890') },
        { text: 'Email', onPress: () => Linking.openURL('mailto:support@lipiprint.in') },
        { text: 'Create Ticket', onPress: () => setShowTicketModal(true) },
      ]
    );
  };

  const handleSubmitTicket = async () => {
    if (!ticketData.subject.trim() || !ticketData.message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would submit the ticket to your backend
      // await ApiService.request('/support/tickets', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     ...ticketData,
      //     userId: userInfo?.id,
      //     category: selectedCategory,
      //   }),
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Ticket Created',
        'Your support ticket has been created successfully. You will receive a confirmation email shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowTicketModal(false);
              setTicketData({
                subject: '',
                message: '',
                priority: 'medium',
                orderId: '',
              });
              setSelectedCategory('');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', 'Failed to create support ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSupportCategory = (category, index) => (
    <Animatable.View
      key={category.id}
      animation="fadeInUp"
      delay={index * 100}
      duration={500}
      style={styles.categoryCard}
    >
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => handleCategorySelect(category)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
          <Icon name={category.icon} size={24} color={category.color} />
        </View>
        <View style={styles.categoryContent}>
          <Text style={[styles.categoryTitle, { color: theme.text }]}>
            {category.title}
          </Text>
          <Text style={[styles.categorySubtitle, { color: theme.textSecondary }]}>
            {category.subtitle}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderContactOption = (option, index) => (
    <Animatable.View
      key={option.id}
      animation="fadeInUp"
      delay={index * 100}
      duration={500}
      style={styles.contactCard}
    >
      <TouchableOpacity
        style={styles.contactItem}
        onPress={option.action}
        activeOpacity={0.7}
      >
        <View style={[styles.contactIcon, { backgroundColor: option.color + '20' }]}>
          <Icon name={option.icon} size={24} color={option.color} />
        </View>
        <View style={styles.contactContent}>
          <Text style={[styles.contactTitle, { color: theme.text }]}>
            {option.title}
          </Text>
          <Text style={[styles.contactSubtitle, { color: theme.textSecondary }]}>
            {option.subtitle}
          </Text>
          <Text style={[styles.contactAvailability, { color: option.color }]}>
            {option.available}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#22194f', '#22194f']}
        style={styles.headerGradient}
      >
        <Heading
          title="Customer Support"
          subtitle="We're here to help you"
          left={
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          }
          variant="primary"
        />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        {userInfo && (
          <Animatable.View animation="fadeInDown" duration={500} style={styles.userInfoCard}>
            <View style={styles.userInfoContent}>
              <View style={styles.userAvatar}>
                <Text style={styles.userInitial}>{userInfo.name?.charAt(0) || 'U'}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{userInfo.name || 'User'}</Text>
                <Text style={styles.userEmail}>{userInfo.email || userInfo.phone}</Text>
                <Text style={styles.userStatus}>Premium Member</Text>
              </View>
              <Icon name="verified" size={20} color="#4CAF50" />
            </View>
          </Animatable.View>
        )}

        {/* Quick Contact Options */}
        <Animatable.View animation="fadeInUp" delay={200} duration={500}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Contact</Text>
          {contactOptions.map((option, index) => renderContactOption(option, index))}
        </Animatable.View>

        {/* Support Categories */}
        <Animatable.View animation="fadeInUp" delay={400} duration={500}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>What can we help you with?</Text>
          {supportCategories.map((category, index) => renderSupportCategory(category, index))}
        </Animatable.View>

        {/* Support Hours */}
        <Animatable.View animation="fadeInUp" delay={600} duration={500} style={styles.supportHoursCard}>
          <View style={[styles.supportHoursContent, { backgroundColor: theme.card }]}>
            <Icon name="schedule" size={24} color="#667eea" />
            <View style={styles.supportHoursText}>
              <Text style={[styles.supportHoursTitle, { color: theme.text }]}>
                Support Hours
              </Text>
              <Text style={[styles.supportHoursSubtitle, { color: theme.textSecondary }]}>
                Monday - Friday: 9:00 AM - 7:00 PM{'\n'}
                Saturday: 10:00 AM - 5:00 PM{'\n'}
                Sunday: Closed (Emergency support available)
              </Text>
            </View>
          </View>
        </Animatable.View>

        {/* Emergency Contact */}
        <Animatable.View animation="fadeInUp" delay={800} duration={500} style={styles.emergencyCard}>
          <View style={[styles.emergencyContent, { backgroundColor: '#FFF3E0' }]}>
            <Icon name="emergency" size={24} color="#FF9800" />
            <View style={styles.emergencyText}>
              <Text style={[styles.emergencyTitle, { color: '#E65100' }]}>
                Emergency Support
              </Text>
              <Text style={[styles.emergencySubtitle, { color: '#E65100' }]}>
                For urgent issues outside business hours{'\n'}
                Call: +91 98765 43210
              </Text>
            </View>
          </View>
        </Animatable.View>
      </ScrollView>

      {/* Support Ticket Modal */}
      <Modal
        visible={showTicketModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTicketModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Create Support Ticket</Text>
              <TouchableOpacity onPress={() => setShowTicketModal(false)}>
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <TextInput
                style={[styles.ticketInput, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Subject *"
                placeholderTextColor={theme.textSecondary}
                value={ticketData.subject}
                onChangeText={(text) => setTicketData(prev => ({ ...prev, subject: text }))}
              />
              
              <TextInput
                style={[styles.ticketInput, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Order ID (if applicable)"
                placeholderTextColor={theme.textSecondary}
                value={ticketData.orderId}
                onChangeText={(text) => setTicketData(prev => ({ ...prev, orderId: text }))}
              />
              
              <TextInput
                style={[styles.ticketInput, styles.ticketTextArea, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Describe your issue in detail *"
                placeholderTextColor={theme.textSecondary}
                value={ticketData.message}
                onChangeText={(text) => setTicketData(prev => ({ ...prev, message: text }))}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              
              <View style={styles.priorityContainer}>
                <Text style={[styles.priorityLabel, { color: theme.text }]}>Priority:</Text>
                <View style={styles.priorityOptions}>
                  {['low', 'medium', 'high', 'urgent'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        ticketData.priority === priority && styles.priorityOptionSelected,
                        { backgroundColor: ticketData.priority === priority ? '#667eea' : theme.background }
                      ]}
                      onPress={() => setTicketData(prev => ({ ...prev, priority }))}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        { color: ticketData.priority === priority ? 'white' : theme.text }
                      ]}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTicketModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleSubmitTicket}
                disabled={loading}
              >
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalConfirmButtonGradient}>
                  {loading ? (
                    <Text style={styles.modalConfirmButtonText}>Creating...</Text>
                  ) : (
                    <Text style={styles.modalConfirmButtonText}>Create Ticket</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 12,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 12,
    marginBottom: 2,
  },
  contactAvailability: {
    fontSize: 11,
    fontWeight: '500',
  },
  supportHoursCard: {
    marginTop: 20,
    marginBottom: 16,
  },
  supportHoursContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportHoursText: {
    marginLeft: 12,
    flex: 1,
  },
  supportHoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  supportHoursSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  emergencyCard: {
    marginBottom: 20,
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  emergencyText: {
    marginLeft: 12,
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontSize: 12,
    lineHeight: 16,
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
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  ticketInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  ticketTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    marginTop: 8,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  priorityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  priorityOptionSelected: {
    borderColor: '#667eea',
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '500',
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