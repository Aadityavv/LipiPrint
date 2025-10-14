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

const TermsAndConditionsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#0058A3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms and Conditions</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: October 11, 2025</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing and using the LipiPrint mobile application ("App"), you
          accept and agree to be bound by the terms and provisions of this
          agreement. If you do not agree to these terms, please do not use this
          App.
        </Text>

        <Text style={styles.sectionTitle}>2. Service Description</Text>
        <Text style={styles.paragraph}>
          LipiPrint provides an online platform for document printing and
          delivery services. Users can upload documents, select printing
          preferences, make payments, and receive printed documents at their
          specified delivery address.
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.paragraph}>
          • You must be at least 18 years old to use this service{'\n'}
          • You are responsible for maintaining the confidentiality of your
          account credentials{'\n'}
          • You agree to provide accurate and complete information during
          registration{'\n'}
          • You are responsible for all activities under your account{'\n'}
          • You must notify us immediately of any unauthorized access
        </Text>

        <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
        <Text style={styles.paragraph}>
          You agree NOT to upload, print, or distribute content that:{'\n\n'}
          • Violates any laws or regulations{'\n'}
          • Infringes intellectual property rights{'\n'}
          • Contains viruses or malicious code{'\n'}
          • Is defamatory, obscene, or offensive{'\n'}
          • Promotes illegal activities{'\n'}
          • Contains confidential information without authorization{'\n'}
          • Violates any third-party rights
        </Text>

        <Text style={styles.sectionTitle}>5. Order Placement and Pricing</Text>
        <Text style={styles.paragraph}>
          • All prices are in Indian Rupees (INR) and include applicable GST
          {'\n'}
          • Prices may change without prior notice but confirmed orders honor
          original prices{'\n'}
          • You will receive an order confirmation with final pricing before
          payment{'\n'}
          • We reserve the right to refuse or cancel any order at our discretion
          {'\n'}
          • Minimum order value may apply for certain services
        </Text>

        <Text style={styles.sectionTitle}>6. Payment Terms</Text>
        <Text style={styles.paragraph}>
          • All payments must be made through our secure payment gateway
          (Razorpay){'\n'}
          • Payment is required before order processing begins{'\n'}
          • Failed or pending payments will result in order cancellation{'\n'}
          • Refunds will be processed as per our Cancellation and Refund Policy
          {'\n'}
          • We do not store your payment card information
        </Text>

        <Text style={styles.sectionTitle}>7. Delivery Terms</Text>
        <Text style={styles.paragraph}>
          • Standard delivery: Within 24 hours of order confirmation{'\n'}
          • Express delivery: Within 2 hours (subject to availability){'\n'}
          • Delivery charges apply as per current rates{'\n'}
          • Delivery address must be within our serviceable areas{'\n'}
          • You must be available to receive the delivery{'\n'}
          • Delivery times are estimates and may vary due to unforeseen
          circumstances
        </Text>

        <Text style={styles.sectionTitle}>8. Print Quality and Specifications</Text>
        <Text style={styles.paragraph}>
          • We strive to maintain high print quality standards{'\n'}
          • Print output depends on the quality of uploaded files{'\n'}
          • Color accuracy may vary based on device screen calibration{'\n'}
          • We are not responsible for quality issues arising from poor source
          files{'\n'}
          • Complaints regarding print quality must be raised within 24 hours of
          delivery
        </Text>

        <Text style={styles.sectionTitle}>9. File Storage and Privacy</Text>
        <Text style={styles.paragraph}>
          • Uploaded files are stored securely on our servers{'\n'}
          • Files are automatically deleted after successful delivery{'\n'}
          • We do not access or view your files except for printing purposes
          {'\n'}
          • File retention period: Maximum 30 days{'\n'}
          • Please refer to our Privacy Policy for detailed information
        </Text>

        <Text style={styles.sectionTitle}>10. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          • All content, design, logos, and trademarks on this App are owned by
          LipiPrint{'\n'}
          • You may not reproduce, distribute, or modify any content without
          written permission{'\n'}
          • You retain ownership of documents you upload{'\n'}
          • By uploading, you grant us a license to process and print your
          documents
        </Text>

        <Text style={styles.sectionTitle}>11. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          LipiPrint shall not be liable for:{'\n\n'}
          • Indirect, incidental, or consequential damages{'\n'}
          • Loss of profits, data, or business opportunities{'\n'}
          • Delays due to circumstances beyond our control{'\n'}
          • Damage to devices or data loss{'\n'}
          • Issues arising from third-party services{'\n'}
          • Maximum liability limited to the order value
        </Text>

        <Text style={styles.sectionTitle}>12. Force Majeure</Text>
        <Text style={styles.paragraph}>
          We are not responsible for delays or failure to perform due to causes
          beyond our reasonable control, including but not limited to natural
          disasters, strikes, government restrictions, pandemics, or technical
          failures.
        </Text>

        <Text style={styles.sectionTitle}>13. Cancellation and Termination</Text>
        <Text style={styles.paragraph}>
          • You may cancel your account at any time{'\n'}
          • We reserve the right to suspend or terminate accounts for violation
          of terms{'\n'}
          • Termination does not affect existing order obligations{'\n'}
          • Pending payments must be settled before account closure
        </Text>

        <Text style={styles.sectionTitle}>14. Dispute Resolution</Text>
        <Text style={styles.paragraph}>
          • Any disputes shall be resolved through negotiation{'\n'}
          • Unresolved disputes shall be subject to arbitration{'\n'}
          • Jurisdiction: Courts in [Your City/State], India{'\n'}
          • Governing Law: Indian laws shall apply
        </Text>

        <Text style={styles.sectionTitle}>15. Modifications to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these terms at any time. Changes will be
          effective immediately upon posting in the App. Continued use of the App
          after changes constitutes acceptance of modified terms.
        </Text>

        <Text style={styles.sectionTitle}>16. Contact Information</Text>
        <Text style={styles.paragraph}>
          For questions regarding these Terms and Conditions:{'\n\n'}
          Email: dev.lipiprint@gmail.com{'\n'}
          Website: https://lipiprint.com{'\n'}
          Support Hours: 9:00 AM - 6:00 PM (IST)
        </Text>

        <Text style={styles.sectionTitle}>17. Severability</Text>
        <Text style={styles.paragraph}>
          If any provision of these terms is found to be unenforceable, the
          remaining provisions will continue in full force and effect.
        </Text>

        <Text style={styles.sectionTitle}>18. Entire Agreement</Text>
        <Text style={styles.paragraph}>
          These Terms and Conditions, along with our Privacy Policy and other
          policies, constitute the entire agreement between you and LipiPrint.
        </Text>

        <View style={styles.acknowledgment}>
          <Text style={styles.acknowledgmentText}>
            By using LipiPrint, you acknowledge that you have read, understood,
            and agree to be bound by these Terms and Conditions.
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0058A3',
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    textAlign: 'justify',
  },
  acknowledgment: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginTop: 30,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0058A3',
  },
  acknowledgmentText: {
    fontSize: 14,
    color: '#0058A3',
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

export default TermsAndConditionsScreen;


