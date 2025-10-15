import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ContactUsScreen = ({ navigation }) => {
  const handleEmail = () => {
    Linking.openURL('mailto:dev.lipiprint@gmail.com');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+911234567890');
  };

  const handleWebsite = () => {
    Linking.openURL('https://lipiprint.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#0058A3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Icon name="support-agent" size={64} color="#0058A3" />
          <Text style={styles.introText}>
            We're here to help! Reach out to us for any questions, concerns, or
            feedback about our services.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Get in Touch</Text>

        {/* Email Contact */}
        <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
          <View style={styles.iconContainer}>
            <Icon name="email" size={28} color="#0058A3" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Email Us</Text>
            <Text style={styles.contactValue}>dev.lipiprint@gmail.com</Text>
            <Text style={styles.contactDescription}>
              We'll respond within 24 hours
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        {/* Phone Contact */}
        <TouchableOpacity style={styles.contactCard} onPress={handlePhone}>
          <View style={styles.iconContainer}>
            <Icon name="phone" size={28} color="#0058A3" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Call Us</Text>
            <Text style={styles.contactValue}>+91 123 456 7890</Text>
            <Text style={styles.contactDescription}>
              Mon-Sat, 9:00 AM - 6:00 PM IST
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        {/* Website */}
        <TouchableOpacity style={styles.contactCard} onPress={handleWebsite}>
          <View style={styles.iconContainer}>
            <Icon name="language" size={28} color="#0058A3" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Visit Website</Text>
            <Text style={styles.contactValue}>www.lipiprint.com</Text>
            <Text style={styles.contactDescription}>
              Learn more about our services
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Office Address</Text>
        <View style={styles.addressCard}>
          <Icon name="location-on" size={28} color="#0058A3" />
          <View style={styles.addressInfo}>
            <Text style={styles.addressText}>
              LipiPrint Services{'\n'}
              [Your Complete Address]{'\n'}
              [City, State - PIN]{'\n'}
              India
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Customer Support</Text>
        <View style={styles.supportSection}>
          <View style={styles.supportItem}>
            <Icon name="access-time" size={20} color="#0058A3" />
            <Text style={styles.supportText}>
              Response Time: Within 24 hours
            </Text>
          </View>
          <View style={styles.supportItem}>
            <Icon name="language" size={20} color="#0058A3" />
            <Text style={styles.supportText}>Languages: English, Hindi</Text>
          </View>
          <View style={styles.supportItem}>
            <Icon name="help-outline" size={20} color="#0058A3" />
            <Text style={styles.supportText}>Support Type: Email, Phone, Chat</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqSection}>
          <Text style={styles.faqQuestion}>
            Q: How long does delivery take?
          </Text>
          <Text style={styles.faqAnswer}>
            A: Standard delivery takes 2-3 business days. Express delivery is
            available within 24 hours.
          </Text>

          <Text style={styles.faqQuestion}>Q: What file formats do you accept?</Text>
          <Text style={styles.faqAnswer}>
            A: We accept PDF, DOC, DOCX, JPG, PNG, and most common document
            formats.
          </Text>

          <Text style={styles.faqQuestion}>Q: How can I track my order?</Text>
          <Text style={styles.faqAnswer}>
            A: You can track your order in real-time through the Orders section
            in the app.
          </Text>

          <Text style={styles.faqQuestion}>Q: What payment methods are available?</Text>
          <Text style={styles.faqAnswer}>
            A: We accept UPI, Credit/Debit Cards, Net Banking, and Wallets
            through Razorpay.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Feedback & Suggestions</Text>
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackText}>
            We value your feedback! Help us improve by sharing your thoughts,
            suggestions, or reporting any issues you encounter.
          </Text>
          <TouchableOpacity style={styles.feedbackButton} onPress={handleEmail}>
            <Icon name="feedback" size={20} color="#FFFFFF" />
            <Text style={styles.feedbackButtonText}>Send Feedback</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 LipiPrint. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  introText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0058A3',
    marginTop: 20,
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: 12,
    color: '#666',
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  supportSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  faqSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  feedbackSection: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  feedbackButton: {
    flexDirection: 'row',
    backgroundColor: '#0058A3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ContactUsScreen;

