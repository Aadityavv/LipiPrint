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

const ShippingPolicyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#0058A3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping & Delivery Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: October 11, 2025</Text>

        <Text style={styles.introText}>
          At LipiPrint, we are committed to delivering your printed documents
          safely and on time. This Shipping and Delivery Policy outlines our
          delivery procedures, timelines, and terms.
        </Text>

        <Text style={styles.sectionTitle}>1. Delivery Options</Text>

        <Text style={styles.subsectionTitle}>1.1 Standard Delivery</Text>
        <Text style={styles.paragraph}>
          • Delivery Time: Within 24 hours of order confirmation{'\n'}
          • Delivery Charges: ₹50 per order{'\n'}
          • Available: Monday to Saturday, 9 AM to 8 PM{'\n'}
          • Free delivery on orders above ₹500{'\n'}
          • Suitable for: Non-urgent documents
        </Text>

        <Text style={styles.subsectionTitle}>1.2 Express Delivery</Text>
        <Text style={styles.paragraph}>
          • Delivery Time: Within 2 hours of order confirmation{'\n'}
          • Delivery Charges: ₹150 per order{'\n'}
          • Available: Monday to Saturday, 10 AM to 6 PM{'\n'}
          • Subject to availability and location{'\n'}
          • Suitable for: Urgent documents and same-day needs
        </Text>

        <Text style={styles.sectionTitle}>2. Service Areas</Text>
        <Text style={styles.paragraph}>
          • We currently deliver within [Your City/Cities]{'\n'}
          • Maximum delivery distance: 50 km from our processing center{'\n'}
          • Service area coverage is continuously expanding{'\n'}
          • Enter your delivery address to check serviceability{'\n'}
          • Remote locations may have additional charges
        </Text>

        <Text style={styles.sectionTitle}>3. Order Processing Time</Text>
        <Text style={styles.paragraph}>
          • Order Review: Immediately after payment confirmation{'\n'}
          • Printing Time: 30 minutes to 2 hours (depending on volume){'\n'}
          • Quality Check: Before dispatch{'\n'}
          • Packaging: Secure packaging to prevent damage{'\n'}
          • Dispatch: Once quality approved{'\n\n'}
          Note: Processing time is separate from delivery time.
        </Text>

        <Text style={styles.sectionTitle}>4. Delivery Process</Text>

        <Text style={styles.subsectionTitle}>4.1 Address Verification</Text>
        <Text style={styles.paragraph}>
          • Ensure your delivery address is complete and accurate{'\n'}
          • Include landmarks for easy location{'\n'}
          • Provide accurate contact number{'\n'}
          • We may call to confirm address before dispatch
        </Text>

        <Text style={styles.subsectionTitle}>4.2 Real-Time Tracking</Text>
        <Text style={styles.paragraph}>
          • Track your order in real-time through the app{'\n'}
          • Receive notifications at each stage:{'\n'}
          • Order confirmed{'\n'}
          • Printing started{'\n'}
          • Out for delivery{'\n'}
          • Delivered{'\n'}
          • SMS and push notifications enabled
        </Text>

        <Text style={styles.subsectionTitle}>4.3 Delivery Confirmation</Text>
        <Text style={styles.paragraph}>
          • Delivery person will contact you upon arrival{'\n'}
          • Valid ID may be required for high-value orders{'\n'}
          • Signature or OTP verification for delivery confirmation{'\n'}
          • Photo proof of delivery (when applicable){'\n'}
          • Inspect documents before accepting delivery
        </Text>

        <Text style={styles.sectionTitle}>5. Delivery Charges</Text>
        <Text style={styles.paragraph}>
          Standard Delivery:{'\n'}
          • ₹50 for orders up to ₹500{'\n'}
          • FREE for orders above ₹500{'\n\n'}
          Express Delivery:{'\n'}
          • ₹150 for all orders{'\n\n'}
          Additional Charges:{'\n'}
          • Remote locations: ₹30-₹100 extra{'\n'}
          • Sunday delivery: ₹50 extra{'\n'}
          • Multiple drop-off points: ₹40 per additional location{'\n\n'}
          All charges include applicable GST.
        </Text>

        <Text style={styles.sectionTitle}>6. Delivery Failures and Redelivery</Text>

        <Text style={styles.subsectionTitle}>6.1 Failed Delivery Scenarios</Text>
        <Text style={styles.paragraph}>
          Delivery may fail if:{'\n'}
          • Customer is not available at the address{'\n'}
          • Contact number is unreachable{'\n'}
          • Address is incorrect or incomplete{'\n'}
          • Access denied to premises{'\n'}
          • Severe weather or unforeseen circumstances
        </Text>

        <Text style={styles.subsectionTitle}>6.2 Redelivery Policy</Text>
        <Text style={styles.paragraph}>
          • First redelivery attempt: Free of charge within 24 hours{'\n'}
          • Second redelivery attempt: ₹30 additional charge{'\n'}
          • Maximum 2 redelivery attempts{'\n'}
          • After failed attempts, customer must collect from office{'\n'}
          • Update your contact details for successful delivery
        </Text>

        <Text style={styles.sectionTitle}>7. Pickup Option</Text>
        <Text style={styles.paragraph}>
          • Self-pickup available from our office{'\n'}
          • Address: [Your Office Address]{'\n'}
          • Pickup Hours: Monday to Saturday, 10 AM to 6 PM{'\n'}
          • Bring order ID and valid ID proof{'\n'}
          • No delivery charges apply for pickup orders{'\n'}
          • Orders ready for pickup within 2 hours
        </Text>

        <Text style={styles.sectionTitle}>8. Delivery Timelines</Text>
        <Text style={styles.paragraph}>
          Orders placed:{'\n'}
          • Before 12 PM: Same day delivery (Express) or next day (Standard){'\n'}
          • After 12 PM: Next day delivery (Standard){'\n'}
          • After 6 PM: Delivery within 24 hours{'\n\n'}
          Holidays and Weekends:{'\n'}
          • Sunday: Limited service (additional charges apply){'\n'}
          • Public holidays: Orders processed on next working day{'\n'}
          • Festival season: Delays possible due to high volume
        </Text>

        <Text style={styles.sectionTitle}>9. Delivery Partners</Text>
        <Text style={styles.paragraph}>
          • We use trusted delivery partners and in-house delivery team{'\n'}
          • All delivery personnel are verified and trained{'\n'}
          • Delivery partners follow COVID-19 safety protocols{'\n'}
          • Contactless delivery available upon request{'\n'}
          • Report any issues with delivery personnel immediately
        </Text>

        <Text style={styles.sectionTitle}>10. Packaging</Text>
        <Text style={styles.paragraph}>
          • Documents packaged in waterproof covers{'\n'}
          • Secure packaging to prevent damage during transit{'\n'}
          • Confidential documents in sealed envelopes{'\n'}
          • Bulk orders in boxes with cushioning{'\n'}
          • Eco-friendly packaging materials used
        </Text>

        <Text style={styles.sectionTitle}>11. Damaged or Lost Shipments</Text>

        <Text style={styles.subsectionTitle}>11.1 Damaged Delivery</Text>
        <Text style={styles.paragraph}>
          • Inspect documents immediately upon delivery{'\n'}
          • Report damage within 2 hours of delivery{'\n'}
          • Take photos of damaged items{'\n'}
          • Contact support: dev.lipiprint@gmail.com{'\n'}
          • Free replacement for damaged items (subject to verification)
        </Text>

        <Text style={styles.subsectionTitle}>11.2 Lost Shipment</Text>
        <Text style={styles.paragraph}>
          • Track order to confirm lost status{'\n'}
          • Report within 24 hours if not delivered{'\n'}
          • Investigation period: 48 hours{'\n'}
          • Free reprinting if shipment confirmed lost{'\n'}
          • Refund or replacement as per customer preference
        </Text>

        <Text style={styles.sectionTitle}>12. Undeliverable Orders</Text>
        <Text style={styles.paragraph}>
          If an order cannot be delivered after 2 attempts:{'\n'}
          • Customer will be notified via phone and email{'\n'}
          • Order held at office for 7 days{'\n'}
          • Customer must arrange pickup{'\n'}
          • After 7 days, order may be disposed{'\n'}
          • Refunds processed as per Refund Policy
        </Text>

        <Text style={styles.sectionTitle}>13. International Delivery</Text>
        <Text style={styles.paragraph}>
          • Currently, we do not offer international delivery{'\n'}
          • Service limited to India only{'\n'}
          • International delivery may be introduced in future
        </Text>

        <Text style={styles.sectionTitle}>14. Force Majeure</Text>
        <Text style={styles.paragraph}>
          We are not liable for delivery delays caused by:{'\n'}
          • Natural disasters (floods, earthquakes, storms){'\n'}
          • Pandemics or health emergencies{'\n'}
          • Government restrictions or lockdowns{'\n'}
          • Strikes or civil unrest{'\n'}
          • Technical failures beyond our control{'\n'}
          • Accidents or road blockages{'\n\n'}
          In such cases, orders will be delivered as soon as possible.
        </Text>

        <Text style={styles.sectionTitle}>15. Customer Responsibilities</Text>
        <Text style={styles.paragraph}>
          • Provide accurate and complete delivery address{'\n'}
          • Be available at the time of delivery{'\n'}
          • Keep contact number active and reachable{'\n'}
          • Inspect documents upon delivery{'\n'}
          • Report any issues immediately{'\n'}
          • Update address if changed before dispatch
        </Text>

        <Text style={styles.sectionTitle}>16. Modifications to Policy</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify this policy at any time. Changes will be
          effective immediately upon posting in the app.
        </Text>

        <Text style={styles.sectionTitle}>17. Contact Information</Text>
        <Text style={styles.paragraph}>
          For delivery-related queries:{'\n\n'}
          Email: dev.lipiprint@gmail.com{'\n'}
          Phone: [Your Phone Number]{'\n'}
          Support Hours: 9:00 AM - 6:00 PM (IST){'\n'}
          Emergency Support: Available for urgent issues
        </Text>

        <View style={styles.note}>
          <Icon name="info-outline" size={20} color="#FF6B35" />
          <Text style={styles.noteText}>
            Delivery times are estimates. Actual delivery may vary based on
            location, traffic, and order volume. We strive to meet all delivery
            commitments.
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
  note: {
    flexDirection: 'row',
    backgroundColor: '#FFF4E6',
    padding: 16,
    borderRadius: 8,
    marginTop: 30,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#D84315',
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

export default ShippingPolicyScreen;


