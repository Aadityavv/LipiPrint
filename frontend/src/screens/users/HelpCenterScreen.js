import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import CustomAlert from '../../components/CustomAlert';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';

const faqs = [
  { 
    q: 'How do I upload a file?', 
    a: 'To upload a file, tap the "Upload" button on the home screen, then select your file from your device, camera, or cloud storage. Supported formats include PDF, DOC, DOCX, PPT, PPTX, JPG, and PNG.' 
  },
  { 
    q: 'What file types are supported?', 
    a: 'We support PDF, DOC, DOCX, PPT, PPTX, JPG, and PNG files. Maximum file size is 20MB per file.' 
  },
  { 
    q: 'How do I track my order?', 
    a: 'Go to the "Orders" tab in the bottom navigation, then tap on your order to see real-time updates including processing, printing, and delivery status.' 
  },
  { 
    q: 'How do I contact support?', 
    a: 'You can contact our support team through the contact form below, call our helpline at +91-XXXX-XXXX, or email us at dev.lipiprint@gmail.com. We typically respond within 24 hours.' 
  },
  { 
    q: 'What are the delivery options?', 
    a: 'We offer pickup from our store, home delivery, and office delivery. Delivery charges vary based on location and are calculated at checkout.' 
  },
  { 
    q: 'How do I change my password?', 
    a: 'Go to Settings > Privacy & Security > Change Password, or use the "Forgot Password" option on the login screen. We will send you an OTP to your email to reset your password securely.' 
  },
  { 
    q: 'Can I cancel my order?', 
    a: 'You can cancel your order within 30 minutes of placing it. After that, please contact our support team for assistance.' 
  },
  { 
    q: 'What payment methods do you accept?', 
    a: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets like Paytm, PhonePe, and Google Pay.' 
  },
];

export default function HelpCenterScreen({ navigation }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(null);
  const [message, setMessage] = useState('');
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

  const handleSend = () => {
    if (message.trim()) {
      showAlert('Message Sent', 'Our support team will contact you soon.', 'success');
      setMessage('');
    } else {
      showAlert('Error', 'Please enter a message.', 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={['#22194f', '#22194f']} style={{paddingTop: 40, paddingBottom: 20, paddingHorizontal: 20}}>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44}}>
          <TouchableOpacity style={{padding: 6}} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{flex: 1, textAlign: 'center', fontSize: 20, color: '#fff', fontWeight: 'bold', marginLeft: -30}}>
            Help Center
          </Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitleBlue}>FAQs</Text>
        {faqs.map((faq, idx) => (
          <TouchableOpacity key={idx} style={styles.faqItem} onPress={() => setExpanded(expanded === idx ? null : idx)}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqQ}>{faq.q}</Text>
              <Icon name={expanded === idx ? 'expand-less' : 'expand-more'} size={24} color={theme.text} />
            </View>
            {expanded === idx && <Text style={styles.faqA}>{faq.a}</Text>}
          </TouchableOpacity>
        ))}
        <Text style={styles.sectionTitleBlue}>Contact Support</Text>
        <View style={styles.contactForm}>
          <TextInput
            style={styles.input}
            placeholder="Describe your issue..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Icon name="send" size={18} color={theme.text} />
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
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
  container: { flex: 1 },
  header: { alignItems: 'center', marginTop: 60, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 100 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 20, marginBottom: 10 },
  sectionTitleBlue: { fontSize: 22, fontWeight: 'bold', color: '#3b5bdb', marginTop: 20, marginBottom: 10 },
  faqItem: { backgroundColor: '#fff', borderRadius: 12, padding: 18, marginBottom: 12 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: 16, fontWeight: 'bold', color: '#667eea', flex: 1 },
  faqA: { fontSize: 15, color: '#444', marginTop: 10 },
  contactForm: { backgroundColor: '#fff', borderRadius: 12, padding: 18, marginTop: 20 },
  input: { borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, padding: 12, fontSize: 16, color: '#1a1a1a', minHeight: 80, marginBottom: 12 },
  sendButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#667eea', alignSelf: 'flex-end', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 30 },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
}); 