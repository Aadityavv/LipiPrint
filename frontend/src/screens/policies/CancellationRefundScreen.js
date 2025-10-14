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

const CancellationRefundScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#0058A3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cancellation & Refund Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: October 11, 2025</Text>

        <Text style={styles.introText}>
          At LipiPrint, customer satisfaction is our priority. This policy
          explains our cancellation and refund procedures to ensure transparency
          and fair treatment for all customers.
        </Text>

        <Text style={styles.sectionTitle}>1. Order Cancellation Policy</Text>

        <Text style={styles.subsectionTitle}>1.1 Customer-Initiated Cancellation</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Before Printing Starts:{'\n'}</Text>
          • Full refund (100% of order value){'\n'}
          • Cancel through app or contact support{'\n'}
          • Refund processed within 5-7 business days{'\n'}
          • No cancellation charges
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>
            {'\n'}After Printing Starts but Before Dispatch:{'\n'}
          </Text>
          • 50% refund of order value{'\n'}
          • Cannot be cancelled through app{'\n'}
          • Must contact customer support{'\n'}
          • Subject to approval{'\n'}
          • Printing costs deducted
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>{'\n'}After Dispatch:{'\n'}</Text>
          • No cancellation allowed{'\n'}
          • Order cannot be cancelled once shipped{'\n'}
          • Refer to Return Policy for options
        </Text>

        <Text style={styles.subsectionTitle}>1.2 How to Cancel</Text>
        <Text style={styles.paragraph}>
          Method 1: Through App{'\n'}
          • Go to "My Orders"{'\n'}
          • Select the order{'\n'}
          • Click "Cancel Order"{'\n'}
          • Select cancellation reason{'\n'}
          • Confirm cancellation{'\n\n'}
          Method 2: Contact Support{'\n'}
          • Email: dev.lipiprint@gmail.com{'\n'}
          • Phone: [Your Phone Number]{'\n'}
          • Provide Order ID and reason{'\n'}
          • Support Hours: 9 AM - 6 PM (IST)
        </Text>

        <Text style={styles.sectionTitle}>2. Company-Initiated Cancellation</Text>
        <Text style={styles.paragraph}>
          We may cancel your order in the following cases:{'\n\n'}
          • File quality too poor to print{'\n'}
          • Prohibited or illegal content detected{'\n'}
          • Payment failure or fraud detection{'\n'}
          • Technical issues preventing printing{'\n'}
          • Delivery address not serviceable{'\n'}
          • Force majeure circumstances{'\n\n'}
          In such cases:{'\n'}
          • Full refund (100%) processed immediately{'\n'}
          • You will be notified via email and SMS{'\n'}
          • Refund within 3-5 business days{'\n'}
          • No cancellation charges
        </Text>

        <Text style={styles.sectionTitle}>3. Refund Policy</Text>

        <Text style={styles.subsectionTitle}>3.1 Refund Eligibility</Text>
        <Text style={styles.paragraph}>
          You are eligible for a refund if:{'\n\n'}
          • Order cancelled before printing starts{'\n'}
          • Poor print quality (verified by our team){'\n'}
          • Delivery not made within promised time (Standard: 24 hours, Express:
          2 hours){'\n'}
          • Documents damaged during delivery{'\n'}
          • Incorrect items delivered{'\n'}
          • Payment charged twice{'\n'}
          • Order cancelled by company
        </Text>

        <Text style={styles.subsectionTitle}>3.2 Refund Amount</Text>
        <Text style={styles.paragraph}>
          • Before printing: 100% refund{'\n'}
          • During printing: 50% refund (subject to approval){'\n'}
          • Damaged delivery: 100% refund or free replacement{'\n'}
          • Delayed delivery: 100% refund or discount on next order{'\n'}
          • Partial order issues: Proportionate refund{'\n\n'}
          Note: Delivery charges are non-refundable once dispatch is initiated.
        </Text>

        <Text style={styles.subsectionTitle}>3.3 Refund Process</Text>
        <Text style={styles.paragraph}>
          Step 1: Request Refund{'\n'}
          • Contact support with Order ID{'\n'}
          • Provide reason and evidence (photos if applicable){'\n'}
          • Submit refund request{'\n\n'}
          Step 2: Verification{'\n'}
          • Our team reviews the request{'\n'}
          • May request additional information{'\n'}
          • Verification within 24-48 hours{'\n\n'}
          Step 3: Approval{'\n'}
          • You'll be notified of approval or rejection{'\n'}
          • Rejection reasons will be provided{'\n'}
          • Appeal option available{'\n\n'}
          Step 4: Processing{'\n'}
          • Refund initiated to original payment method{'\n'}
          • Processing time: 5-7 business days{'\n'}
          • Confirmation email sent
        </Text>

        <Text style={styles.sectionTitle}>4. Refund Timelines</Text>
        <Text style={styles.paragraph}>
          Payment Method vs. Refund Time:{'\n\n'}
          • UPI: 3-5 business days{'\n'}
          • Debit/Credit Cards: 5-7 business days{'\n'}
          • Net Banking: 5-7 business days{'\n'}
          • Wallets: 2-4 business days{'\n'}
          • Bank Transfer: 7-10 business days{'\n\n'}
          Note: Refund timelines depend on your bank's processing time. We
          initiate refunds immediately after approval.
        </Text>

        <Text style={styles.sectionTitle}>5. Return Policy</Text>
        <Text style={styles.paragraph}>
          Due to the nature of printed documents, returns are generally not
          accepted. However, returns may be considered in the following cases:
          {'\n\n'}
          • Printing errors (wrong content, missing pages){'\n'}
          • Quality issues (blurry, faded, misprints){'\n'}
          • Damaged items{'\n'}
          • Wrong items delivered{'\n\n'}
          Return Process:{'\n'}
          • Report issue within 24 hours of delivery{'\n'}
          • Provide photos as evidence{'\n'}
          • Do not use or damage the documents{'\n'}
          • Pickup arranged if approved{'\n'}
          • Replacement or refund provided after verification
        </Text>

        <Text style={styles.sectionTitle}>6. Replacement Policy</Text>
        <Text style={styles.paragraph}>
          Free replacement provided for:{'\n\n'}
          • Print quality issues{'\n'}
          • Damaged during delivery{'\n'}
          • Incomplete order{'\n'}
          • Wrong specifications (our error){'\n\n'}
          Replacement Process:{'\n'}
          • Report within 24 hours{'\n'}
          • Return original documents (if required){'\n'}
          • Reprint at no additional cost{'\n'}
          • Priority delivery for replacements{'\n'}
          • Maximum 1 replacement per order
        </Text>

        <Text style={styles.sectionTitle}>7. Non-Refundable Cases</Text>
        <Text style={styles.paragraph}>
          Refunds will NOT be provided for:{'\n\n'}
          • Customer error in file upload{'\n'}
          • Change of mind after printing starts{'\n'}
          • Customer unavailable for delivery (after 2 attempts){'\n'}
          • Incorrect address provided by customer{'\n'}
          • Orders picked up by customer{'\n'}
          • Delay in delivery due to customer-caused reasons{'\n'}
          • Force majeure situations beyond our control{'\n'}
          • Normal variations in color due to screen-to-print differences{'\n'}
          • Files with inherently poor quality
        </Text>

        <Text style={styles.sectionTitle}>8. Partial Refunds</Text>
        <Text style={styles.paragraph}>
          Partial refunds may be issued when:{'\n\n'}
          • Part of the order is correct and part is incorrect{'\n'}
          • Multiple items ordered, only some have issues{'\n'}
          • Customer accepts imperfect delivery with compensation{'\n\n'}
          Partial refund amount calculated based on affected items.
        </Text>

        <Text style={styles.sectionTitle}>9. Dispute Resolution</Text>
        <Text style={styles.paragraph}>
          If you're not satisfied with refund decision:{'\n\n'}
          Step 1: Contact Customer Support{'\n'}
          • Email: dev.lipiprint@gmail.com{'\n'}
          • Explain your concern{'\n'}
          • Provide additional evidence{'\n\n'}
          Step 2: Escalation{'\n'}
          • Request escalation to manager{'\n'}
          • Review within 48-72 hours{'\n'}
          • Final decision communicated{'\n\n'}
          Step 3: Legal Options{'\n'}
          • Consumer forum complaint (if unresolved){'\n'}
          • Arbitration as per Terms & Conditions
        </Text>

        <Text style={styles.sectionTitle}>10. Refund Tracking</Text>
        <Text style={styles.paragraph}>
          Track your refund status:{'\n\n'}
          • Through the app: My Orders → Refunds{'\n'}
          • Refund status notifications{'\n'}
          • Email updates at each stage{'\n'}
          • Contact support for refund status queries
        </Text>

        <Text style={styles.sectionTitle}>11. Failed Payments</Text>
        <Text style={styles.paragraph}>
          If payment is deducted but order not confirmed:{'\n\n'}
          • Auto-refund within 24-48 hours{'\n'}
          • Contact support if not refunded automatically{'\n'}
          • Provide transaction ID{'\n'}
          • Expedited refund processing for payment gateway errors
        </Text>

        <Text style={styles.sectionTitle}>12. Store Credit</Text>
        <Text style={styles.paragraph}>
          In lieu of refund, you may opt for:{'\n\n'}
          • Store credit (wallet balance){'\n'}
          • Same value as refund amount{'\n'}
          • No expiry on store credit{'\n'}
          • Can be used for future orders{'\n'}
          • Faster processing than refund{'\n'}
          • Additional 10% bonus credit offered
        </Text>

        <Text style={styles.sectionTitle}>13. Promotional Orders</Text>
        <Text style={styles.paragraph}>
          For orders with discounts or promotional codes:{'\n\n'}
          • Refund based on amount actually paid{'\n'}
          • Promotional credit may not be refunded{'\n'}
          • Discount coupons are non-refundable{'\n'}
          • Store credit may be issued instead
        </Text>

        <Text style={styles.sectionTitle}>14. Contact for Cancellations & Refunds</Text>
        <Text style={styles.paragraph}>
          For cancellation or refund assistance:{'\n\n'}
          Email: dev.lipiprint@gmail.com{'\n'}
          Phone: [Your Phone Number]{'\n'}
          In-App Support: Chat with us{'\n'}
          Response Time: Within 24 hours{'\n'}
          Support Hours: 9:00 AM - 6:00 PM (IST){'\n\n'}
          Please provide:{'\n'}
          • Order ID{'\n'}
          • Reason for cancellation/refund{'\n'}
          • Supporting evidence (if applicable){'\n'}
          • Contact details
        </Text>

        <Text style={styles.sectionTitle}>15. Modifications to Policy</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify this policy at any time. Changes will be
          effective immediately upon posting. Existing orders will be governed by
          the policy in effect at the time of order placement.
        </Text>

        <View style={styles.important}>
          <Icon name="warning" size={20} color="#FF6B35" />
          <Text style={styles.importantText}>
            IMPORTANT: Always review your order details before confirming payment.
            Once printing starts, cancellation options are limited.
          </Text>
        </View>

        <View style={styles.tip}>
          <Icon name="lightbulb-outline" size={20} color="#4CAF50" />
          <Text style={styles.tipText}>
            TIP: Use the preview feature to verify your documents before placing
            an order to avoid cancellations and refunds.
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
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
    color: '#000',
  },
  important: {
    flexDirection: 'row',
    backgroundColor: '#FFF4E6',
    padding: 16,
    borderRadius: 8,
    marginTop: 30,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  importantText: {
    flex: 1,
    fontSize: 13,
    color: '#D84315',
    marginLeft: 12,
    lineHeight: 20,
    fontWeight: '600',
  },
  tip: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    marginLeft: 12,
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

export default CancellationRefundScreen;


