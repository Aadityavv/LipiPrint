import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';

export default function HelpCentreScreen({ navigation }) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I place an order?',
      answer: 'To place an order, go to the Upload tab, select your files, choose print options, add delivery details, and proceed to payment. You can track your order status in the Orders section.',
    },
    {
      id: 2,
      question: 'What file formats do you support?',
      answer: 'We support PDF, DOC, DOCX, JPG, PNG, and other common document formats. Files are automatically converted to PDF for printing.',
    },
    {
      id: 3,
      question: 'How long does delivery take?',
      answer: 'Delivery time varies by location. Local deliveries typically take 1-2 days, while outstation deliveries take 3-5 days. You can track your order in real-time.',
    },
    {
      id: 4,
      question: 'Can I cancel my order?',
      answer: 'You can cancel your order within 1 hour of placing it if it hasn\'t started processing. Contact support for assistance with cancellations.',
    },
    {
      id: 5,
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets through Razorpay secure payment gateway.',
    },
    {
      id: 6,
      question: 'How do I track my order?',
      answer: 'Go to the Track Orders section and enter your order ID or AWB number. You can also track through the courier partner\'s website using the provided tracking number.',
    },
    {
      id: 7,
      question: 'What if my print quality is not good?',
      answer: 'We guarantee high-quality printing. If you\'re not satisfied with the quality, contact us within 24 hours of delivery for a reprint or refund.',
    },
    {
      id: 8,
      question: 'Do you offer bulk printing discounts?',
      answer: 'Yes, we offer attractive discounts for bulk orders. Contact our support team for custom pricing based on your requirements.',
    },
  ];

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'play-circle-outline',
      color: '#4CAF50',
      items: [
        'How to create an account',
        'Uploading your first file',
        'Understanding print options',
        'Placing your first order',
      ],
    },
    {
      id: 'orders',
      title: 'Orders & Delivery',
      icon: 'local-shipping',
      color: '#2196F3',
      items: [
        'Placing orders',
        'Tracking deliveries',
        'Canceling orders',
        'Delivery charges',
      ],
    },
    {
      id: 'payments',
      title: 'Payments',
      icon: 'payment',
      color: '#FF9800',
      items: [
        'Payment methods',
        'Refund process',
        'Billing questions',
        'Promo codes',
      ],
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: 'person',
      color: '#9C27B0',
      items: [
        'Managing profile',
        'Saved addresses',
        'Order history',
        'Account settings',
      ],
    },
  ];

  const contactMethods = [
    {
      id: 'phone',
      title: 'Call Us',
      subtitle: '+91 12345 67890',
      icon: 'phone',
      color: '#4CAF50',
      action: () => Linking.openURL('tel:+911234567890'),
    },
    {
      id: 'email',
      title: 'Email Us',
      subtitle: 'support@lipiprint.in',
      icon: 'email',
      color: '#2196F3',
      action: () => Linking.openURL('mailto:support@lipiprint.in'),
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      subtitle: 'Quick support via chat',
      icon: 'chat',
      color: '#25D366',
      action: () => Linking.openURL('https://wa.me/911234567890'),
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      subtitle: 'Help us improve',
      icon: 'feedback',
      color: '#FF9800',
      action: () => {
        Alert.alert(
          'Feedback',
          'We appreciate your feedback! Please email us at feedback@lipiprint.in with your suggestions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Send Email', onPress: () => Linking.openURL('mailto:feedback@lipiprint.in') },
          ]
        );
      },
    },
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFaqPress = (faqId) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const renderFaqItem = (faq) => (
    <Animatable.View
      key={faq.id}
      animation="fadeInUp"
      duration={300}
      style={styles.faqItem}
    >
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={() => handleFaqPress(faq.id)}
        activeOpacity={0.7}
      >
        <Text style={[styles.faqQuestionText, { color: theme.text }]}>
          {faq.question}
        </Text>
        <Icon
          name={expandedFaq === faq.id ? 'expand-less' : 'expand-more'}
          size={24}
          color={theme.textSecondary}
        />
      </TouchableOpacity>
      
      {expandedFaq === faq.id && (
        <Animatable.View
          animation="fadeIn"
          duration={200}
          style={styles.faqAnswer}
        >
          <Text style={[styles.faqAnswerText, { color: theme.textSecondary }]}>
            {faq.answer}
          </Text>
        </Animatable.View>
      )}
    </Animatable.View>
  );

  const renderHelpCategory = (category, index) => (
    <Animatable.View
      key={category.id}
      animation="fadeInUp"
      delay={index * 100}
      duration={500}
      style={styles.categoryCard}
    >
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => {
          Alert.alert(
            category.title,
            `Topics in ${category.title}:\n\n${category.items.map(item => `• ${item}`).join('\n')}`,
            [{ text: 'OK' }]
          );
        }}
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
            {category.items.length} topics
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderContactMethod = (method, index) => (
    <Animatable.View
      key={method.id}
      animation="fadeInUp"
      delay={index * 100}
      duration={500}
      style={styles.contactCard}
    >
      <TouchableOpacity
        style={styles.contactItem}
        onPress={method.action}
        activeOpacity={0.7}
      >
        <View style={[styles.contactIcon, { backgroundColor: method.color + '20' }]}>
          <Icon name={method.icon} size={24} color={method.color} />
        </View>
        <View style={styles.contactContent}>
          <Text style={[styles.contactTitle, { color: theme.text }]}>
            {method.title}
          </Text>
          <Text style={[styles.contactSubtitle, { color: theme.textSecondary }]}>
            {method.subtitle}
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
          title="Help Centre"
          subtitle="Find answers to your questions"
          left={
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          }
          variant="primary"
        />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <Animatable.View animation="fadeInDown" duration={500} style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search help topics..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="clear" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </Animatable.View>

        {/* Quick Help Categories */}
        <Animatable.View animation="fadeInUp" delay={200} duration={500}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Help</Text>
          {helpCategories.map((category, index) => renderHelpCategory(category, index))}
        </Animatable.View>

        {/* FAQ Section */}
        <Animatable.View animation="fadeInUp" delay={400} duration={500}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Frequently Asked Questions
          </Text>
          <View style={[styles.faqContainer, { backgroundColor: theme.card }]}>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map(renderFaqItem)
            ) : (
              <View style={styles.noResults}>
                <Icon name="search-off" size={48} color="#ccc" />
                <Text style={[styles.noResultsText, { color: theme.textSecondary }]}>
                  No results found for "{searchQuery}"
                </Text>
                <Text style={[styles.noResultsSubtext, { color: theme.textSecondary }]}>
                  Try different keywords or browse our help categories
                </Text>
              </View>
            )}
          </View>
        </Animatable.View>

        {/* Contact Support */}
        <Animatable.View animation="fadeInUp" delay={600} duration={500}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Support</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Can't find what you're looking for? Get in touch with our support team.
          </Text>
          {contactMethods.map((method, index) => renderContactMethod(method, index))}
        </Animatable.View>

        {/* Business Hours */}
        <Animatable.View animation="fadeInUp" delay={800} duration={500} style={styles.businessHoursCard}>
          <View style={[styles.businessHoursContent, { backgroundColor: theme.card }]}>
            <Icon name="access-time" size={24} color="#667eea" />
            <View style={styles.businessHoursText}>
              <Text style={[styles.businessHoursTitle, { color: theme.text }]}>
                Support Hours
              </Text>
              <Text style={[styles.businessHoursSubtitle, { color: theme.textSecondary }]}>
                Monday - Friday: 9:00 AM - 7:00 PM{'\n'}
                Saturday: 10:00 AM - 5:00 PM{'\n'}
                Sunday: Closed
              </Text>
            </View>
          </View>
        </Animatable.View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>
            LipiPrint v1.0.0
          </Text>
        </View>
      </ScrollView>
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
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
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
  categoryHeader: {
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
  faqContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noResults: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
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
  },
  businessHoursCard: {
    marginTop: 20,
    marginBottom: 20,
  },
  businessHoursContent: {
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
  businessHoursText: {
    marginLeft: 12,
    flex: 1,
  },
  businessHoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  businessHoursSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
  },
});
