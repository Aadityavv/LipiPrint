import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#0058A3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: October 11, 2025</Text>

        <Text style={styles.introText}>
          At LipiPrint, we are committed to protecting your privacy and ensuring
          the security of your personal information. This Privacy Policy explains
          how we collect, use, share, and protect your data when you use our
          mobile application.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>

        <Text style={styles.subsectionTitle}>1.1 Personal Information</Text>
        <Text style={styles.paragraph}>
          • Name and contact information{'\n'}
          • Email address{'\n'}
          • Phone number{'\n'}
          • Delivery addresses{'\n'}
          • Profile photo (optional)
        </Text>

        <Text style={styles.subsectionTitle}>1.2 Account Information</Text>
        <Text style={styles.paragraph}>
          • Login credentials (encrypted){'\n'}
          • Authentication tokens{'\n'}
          • Account preferences and settings{'\n'}
          • Order history and preferences
        </Text>

        <Text style={styles.subsectionTitle}>1.3 Payment Information</Text>
        <Text style={styles.paragraph}>
          • Transaction details{'\n'}
          • Payment method (processed securely via Razorpay){'\n'}
          • Billing address{'\n'}
          • Order invoices{'\n'}
          Note: We DO NOT store your credit card or debit card details. All
          payment processing is handled securely by Razorpay.
        </Text>

        <Text style={styles.subsectionTitle}>1.4 Documents and Files</Text>
        <Text style={styles.paragraph}>
          • Files you upload for printing{'\n'}
          • File metadata (name, size, type, upload time){'\n'}
          • Print specifications and preferences{'\n'}
          Note: Files are automatically deleted after successful delivery.
        </Text>

        <Text style={styles.subsectionTitle}>1.5 Device Information</Text>
        <Text style={styles.paragraph}>
          • Device model and operating system{'\n'}
          • Unique device identifiers{'\n'}
          • Mobile network information{'\n'}
          • IP address{'\n'}
          • App version and usage data
        </Text>

        <Text style={styles.subsectionTitle}>1.6 Location Information</Text>
        <Text style={styles.paragraph}>
          • Delivery location coordinates{'\n'}
          • Location data for delivery services{'\n'}
          Note: Location access is requested only for delivery purposes and can
          be disabled in app settings.
        </Text>

        <Text style={styles.subsectionTitle}>1.7 Usage Information</Text>
        <Text style={styles.paragraph}>
          • App usage patterns and features accessed{'\n'}
          • Order history and frequency{'\n'}
          • Support interactions{'\n'}
          • Crash reports and error logs
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information to:{'\n\n'}
          • Process and fulfill your print orders{'\n'}
          • Deliver printed documents to your specified address{'\n'}
          • Process payments securely{'\n'}
          • Communicate order status and updates{'\n'}
          • Provide customer support{'\n'}
          • Improve our services and user experience{'\n'}
          • Send notifications about orders and promotions{'\n'}
          • Prevent fraud and ensure security{'\n'}
          • Comply with legal obligations{'\n'}
          • Analyze usage patterns and app performance
        </Text>

        <Text style={styles.sectionTitle}>3. Information Sharing</Text>

        <Text style={styles.subsectionTitle}>3.1 We Share Information With:</Text>
        <Text style={styles.paragraph}>
          • Payment Processors: Razorpay for secure payment processing{'\n'}
          • Cloud Services: Firebase for secure file storage{'\n'}
          • Delivery Partners: For fulfilling delivery services{'\n'}
          • Analytics Services: For app improvement and performance monitoring
          {'\n'}
          • Legal Authorities: When required by law or to protect our rights
        </Text>

        <Text style={styles.subsectionTitle}>3.2 We DO NOT:</Text>
        <Text style={styles.paragraph}>
          • Sell your personal information to third parties{'\n'}
          • Share your documents with anyone except for printing purposes{'\n'}
          • Use your information for purposes not disclosed in this policy{'\n'}
          • Share your data with advertisers
        </Text>

        <Text style={styles.sectionTitle}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement industry-standard security measures:{'\n\n'}
          • End-to-end encryption (AES-256-GCM){'\n'}
          • Secure HTTPS connections for all data transmission{'\n'}
          • JWT-based authentication{'\n'}
          • Regular security audits{'\n'}
          • Encrypted file storage{'\n'}
          • Access controls and authentication{'\n'}
          • Automatic file deletion after delivery{'\n'}
          • Secure payment gateway integration{'\n'}
          • Employee access restrictions
        </Text>

        <Text style={styles.sectionTitle}>5. Data Retention</Text>
        <Text style={styles.paragraph}>
          • Uploaded Files: Deleted within 30 days or immediately after delivery
          {'\n'}
          • Account Information: Retained while account is active{'\n'}
          • Order History: Retained for 3 years for accounting purposes{'\n'}
          • Payment Records: Retained for 7 years as per legal requirements{'\n'}
          • Support Communications: Retained for 2 years{'\n'}
          • Analytics Data: Anonymized and retained for service improvement
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights and Choices</Text>
        <Text style={styles.paragraph}>
          You have the right to:{'\n\n'}
          • Access your personal information{'\n'}
          • Correct inaccurate information{'\n'}
          • Delete your account and data{'\n'}
          • Opt-out of promotional communications{'\n'}
          • Withdraw consent for data processing{'\n'}
          • Request data portability{'\n'}
          • Object to data processing{'\n'}
          • Lodge a complaint with data protection authorities
        </Text>

        <Text style={styles.subsectionTitle}>To Exercise Your Rights:</Text>
        <Text style={styles.paragraph}>
          Contact us at dev.lipiprint@gmail.com with your request. We will respond
          within 30 days.
        </Text>

        <Text style={styles.sectionTitle}>7. Cookies and Tracking</Text>
        <Text style={styles.paragraph}>
          We use cookies and similar technologies for:{'\n\n'}
          • Authentication and session management{'\n'}
          • Preferences and settings{'\n'}
          • Analytics and performance monitoring{'\n'}
          • Security and fraud prevention{'\n\n'}
          You can manage cookie preferences through your device settings.
        </Text>

        <Text style={styles.sectionTitle}>8. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          Our app integrates with third-party services:{'\n\n'}
          • Razorpay: Payment processing (razorpay.com/privacy){'\n'}
          • Firebase: Cloud storage and authentication (firebase.google.com/support/privacy)
          {'\n'}
          • Google Analytics: Usage analytics (policies.google.com/privacy){'\n\n'}
          These services have their own privacy policies. We recommend reviewing
          them.
        </Text>

        <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our service is not intended for users under 18 years of age. We do not
          knowingly collect information from children. If you believe we have
          collected data from a child, please contact us immediately.
        </Text>

        <Text style={styles.sectionTitle}>10. International Data Transfers</Text>
        <Text style={styles.paragraph}>
          Your data is primarily stored on servers in India. If data is
          transferred internationally, we ensure appropriate safeguards are in
          place to protect your information.
        </Text>

        <Text style={styles.sectionTitle}>11. Data Breach Notification</Text>
        <Text style={styles.paragraph}>
          In the event of a data breach that may affect your personal information,
          we will notify you within 72 hours via email and in-app notification,
          along with steps to protect yourself.
        </Text>

        <Text style={styles.sectionTitle}>12. Changes to Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy periodically. Changes will be posted
          in the app with an updated "Last Updated" date. Significant changes will
          be notified via email or in-app notification.
        </Text>

        <Text style={styles.sectionTitle}>13. Contact Information</Text>
        <Text style={styles.paragraph}>
          For privacy-related questions or concerns:{'\n\n'}
          Email: dev.lipiprint@gmail.com{'\n'}
          Data Protection Officer: privacy@lipiprint.com{'\n'}
          Address: [Your Registered Office Address]{'\n'}
          Response Time: Within 48 hours
        </Text>

        <Text style={styles.sectionTitle}>14. Legal Compliance</Text>
        <Text style={styles.paragraph}>
          This Privacy Policy complies with:{'\n\n'}
          • Information Technology Act, 2000 (India){'\n'}
          • Information Technology (Reasonable Security Practices) Rules, 2011
          {'\n'}
          • Personal Data Protection Bill (when enacted){'\n'}
          • General Data Protection Regulation (GDPR) principles{'\n'}
          • Payment Card Industry Data Security Standard (PCI DSS)
        </Text>

        <View style={styles.consent}>
          <Text style={styles.consentText}>
            By using LipiPrint, you consent to the collection and use of your
            information as described in this Privacy Policy.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 LipiPrint. All rights reserved.</Text>
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
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  introText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'justify',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0058A3',
    marginTop: 20,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    textAlign: 'justify',
  },
  consent: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    marginTop: 30,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  consentText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    lineHeight: 20,
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

export default PrivacyPolicyScreen;


