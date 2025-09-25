import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAlert from '../../components/CustomAlert';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';

export default function HelpSupportScreen({ navigation }) {
  const { theme } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');

  const faqs = [
    {
      id: 1,
      question: 'How do I upload files for printing?',
      answer: 'You can upload files by tapping the "Upload Files" button on the home screen. Supported formats include PDF, DOC, DOCX, PPT, PPTX, JPG, and PNG. You can also use the camera to scan documents or import from cloud storage.'
    },
    {
      id: 2,
      question: 'What are the supported file formats?',
      answer: 'LipiPrint supports PDF, DOC, DOCX, PPT, PPTX, JPG, and PNG files. For best results, ensure your files are clear and properly formatted.'
    },
    {
      id: 3,
      question: 'How is the printing cost calculated?',
      answer: 'Printing costs are calculated based on the number of pages (₹5 per page) and file size (₹2 per MB). Color printing may have additional charges. You can see the estimated cost before confirming your order.'
    },
    {
      id: 4,
      question: 'Where can I pick up my prints?',
      answer: 'You can choose from multiple pickup locations including our main office and branch offices. The available locations will be shown during checkout, and you\'ll receive a notification when your prints are ready.'
    },
    {
      id: 5,
      question: 'How long does printing take?',
      answer: 'Standard printing typically takes 1-2 hours. Rush orders are available for an additional fee. You\'ll receive real-time updates on your print status through the app.'
    },
    {
      id: 6,
      question: 'Can I cancel my print order?',
      answer: 'You can cancel your order within 30 minutes of placing it, as long as printing hasn\'t started. Go to your order history and tap the cancel button.'
    },
    {
      id: 7,
      question: 'What payment methods are accepted?',
      answer: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets like Paytm, PhonePe, and Google Pay. Cash on delivery is also available for pickup orders.'
    },
    {
      id: 8,
      question: 'How do I track my print order?',
      answer: 'You can track your order in real-time through the "Track Order" section. You\'ll also receive push notifications for status updates including when your prints are ready for pickup.'
    }
  ];

  const troubleshootingGuides = [
    {
      id: 1,
      title: 'File Upload Issues',
      icon: 'cloud-upload',
      description: 'Troubleshoot problems with file uploads',
      steps: [
        'Check your internet connection',
        'Ensure file size is under 50MB',
        'Verify file format is supported',
        'Try uploading from a different source'
      ]
    },
    {
      id: 2,
      title: 'Payment Problems',
      icon: 'payment',
      description: 'Resolve payment and billing issues',
      steps: [
        'Verify your payment method',
        'Check for sufficient balance',
        'Try a different payment option',
        'Contact your bank if needed'
      ]
    },
    {
      id: 3,
      title: 'Print Quality Issues',
      icon: 'print',
      description: 'Improve print quality and resolution',
      steps: [
        'Use high-resolution files',
        'Enable auto-enhancement',
        'Choose appropriate paper type',
        'Check file compression settings'
      ]
    },
    {
      id: 4,
      title: 'App Performance',
      icon: 'speed',
      description: 'Optimize app performance',
      steps: [
        'Clear app cache',
        'Update to latest version',
        'Restart the app',
        'Check device storage'
      ]
    }
  ];

  const contactMethods = [
    {
      id: 1,
      title: 'Live Chat',
      icon: 'chat',
      description: 'Get instant help from our support team',
      action: () => showAlert('Live Chat', 'Live chat feature coming soon!', 'info')
    },
    {
      id: 2,
      title: 'Email Support',
      icon: 'email',
      description: 'Send us an email for detailed assistance',
      action: () => showAlert('Email Support', 'Email: dev.lipiprint@gmail.com\n\nWe\'ll respond within 24 hours.', 'info')
    },
    {
      id: 3,
      title: 'Phone Support',
      icon: 'phone',
      description: 'Call us for immediate assistance',
      action: () => showAlert('Phone Support', 'Call: +91 1800-123-4567\n\nAvailable: Mon-Sat, 9 AM - 6 PM', 'info')
    },
    {
      id: 4,
      title: 'WhatsApp',
      icon: 'whatsapp',
      description: 'Message us on WhatsApp',
      action: () => showAlert('WhatsApp Support', 'WhatsApp: +91 98765 43210\n\nWe\'ll respond within 2 hours.', 'info')
    }
  ];

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleContactSubmit = () => {
    if (contactMessage.trim()) {
      showAlert('Message Sent', 'Thank you for contacting us! We\'ll get back to you within 24 hours.', 'info');
    } else {
      showAlert('Error', 'Please enter a message before sending.', 'error');
    }
  };

  const renderFAQItem = (faq) => (
    <Animatable.View
      key={faq.id}
      animation="fadeInUp"
      delay={faq.id * 50}
      duration={400}
    >
      <TouchableOpacity
        style={styles.faqItem}
        onPress={() => toggleFAQ(faq.id)}
        activeOpacity={0.8}
      >
        <View style={styles.faqHeader}>
          <Text style={styles.faqQuestion}>{faq.question}</Text>
          <Icon 
            name={expandedFAQ === faq.id ? 'expand-less' : 'expand-more'} 
            size={24} 
            color={theme.text} 
          />
        </View>
        {expandedFAQ === faq.id && (
          <Animatable.View animation="fadeIn" duration={300}>
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
          </Animatable.View>
        )}
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderTroubleshootingItem = (guide) => (
    <Animatable.View
      key={guide.id}
      animation="fadeInUp"
      delay={guide.id * 100}
      duration={400}
    >
      <TouchableOpacity
        style={styles.troubleshootingItem}
        onPress={() => showAlert(guide.title, guide.steps.join('\n\n'), 'info')}
        activeOpacity={0.8}
      >
        <View style={styles.troubleshootingIcon}>
          <Icon name={guide.icon} size={24} color={theme.text} />
        </View>
        <View style={styles.troubleshootingContent}>
          <Text style={styles.troubleshootingTitle}>{guide.title}</Text>
          <Text style={styles.troubleshootingDescription}>{guide.description}</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#ccc" />
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderContactItem = (contact) => (
    <Animatable.View
      key={contact.id}
      animation="fadeInUp"
      delay={contact.id * 100}
      duration={400}
    >
      <TouchableOpacity
        style={styles.contactItem}
        onPress={contact.action}
        activeOpacity={0.8}
      >
        <View style={styles.contactIcon}>
          <Icon name={contact.icon} size={24} color={theme.text} />
        </View>
        <View style={styles.contactContent}>
          <Text style={styles.contactTitle}>{contact.title}</Text>
          <Text style={styles.contactDescription}>{contact.description}</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#ccc" />
      </TouchableOpacity>
    </Animatable.View>
  );

  const showAlert = (title, message, type = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#22194f', '#22194f']}
        style={styles.headerGradient}
      >
        <Heading
          title="Help & Support"
          left={
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          }
          variant="primary"
        />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <Animatable.View animation="fadeInUp" delay={150} duration={500}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={theme.text} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help topics..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            )}
          </View>
        </Animatable.View>

        {/* Quick Actions */}
        <Animatable.View animation="fadeInUp" delay={175} duration={500}>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => showAlert('Track Order', 'Track your print orders in real-time!', 'info')}>
              <Icon name="track-changes" size={24} color={theme.text} />
              <Text style={styles.quickActionText}>Track Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => showAlert('FAQ', 'Browse frequently asked questions!', 'info')}>
              <Icon name="help" size={24} color={theme.text} />
              <Text style={styles.quickActionText}>FAQ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => showAlert('Contact', 'Get in touch with our support team!', 'info')}>
              <Icon name="support-agent" size={24} color={theme.text} />
              <Text style={styles.quickActionText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* FAQs Section */}
        <Animatable.View animation="fadeInUp" delay={200} duration={500}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <View style={styles.sectionCard}>
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map(renderFAQItem)
              ) : (
                <View style={styles.emptyState}>
                  <Icon name="search-off" size={48} color="#ccc" />
                  <Text style={styles.emptyTitle}>No Results Found</Text>
                  <Text style={styles.emptySubtitle}>Try searching with different keywords</Text>
                </View>
              )}
            </View>
          </View>
        </Animatable.View>

        {/* Troubleshooting Section */}
        <Animatable.View animation="fadeInUp" delay={225} duration={500}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Troubleshooting Guides</Text>
            <View style={styles.sectionCard}>
              {troubleshootingGuides.map(renderTroubleshootingItem)}
            </View>
          </View>
        </Animatable.View>

        {/* Contact Support Section */}
        <Animatable.View animation="fadeInUp" delay={250} duration={500}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Support</Text>
            <View style={styles.sectionCard}>
              {contactMethods.map(renderContactItem)}
            </View>
          </View>
        </Animatable.View>

        {/* Contact Form */}
        <Animatable.View animation="fadeInUp" delay={275} duration={500}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send us a Message</Text>
            <View style={styles.sectionCard}>
              <View style={styles.contactForm}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Describe your issue or question..."
                  value={contactMessage}
                  onChangeText={setContactMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleContactSubmit}
                >
                  <Icon name="send" size={16} color={theme.text} />
                  <Text style={styles.sendButtonText}>Send Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Support Hours */}
        <Animatable.View animation="fadeInUp" delay={300} duration={500}>
          <View style={styles.supportHours}>
            <Icon name="schedule" size={24} color={theme.text} />
            <Text style={styles.supportHoursTitle}>Support Hours</Text>
            <Text style={styles.supportHoursText}>Monday - Saturday: 9:00 AM - 6:00 PM</Text>
            <Text style={styles.supportHoursText}>Sunday: 10:00 AM - 4:00 PM</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 8,
    textAlign: 'center',
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
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
  },
  troubleshootingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  troubleshootingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  troubleshootingContent: {
    flex: 1,
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  troubleshootingDescription: {
    fontSize: 14,
    color: '#666',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: '#666',
  },
  contactForm: {
    padding: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 100,
    marginBottom: 16,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  supportHours: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supportHoursTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 8,
  },
  supportHoursText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
}); 