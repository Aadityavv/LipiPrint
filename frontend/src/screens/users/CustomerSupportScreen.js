import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../theme/ThemeContext';

export default function CustomerSupportScreen({ navigation }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.headerGradient}>
        <Animatable.View animation="fadeInDown" delay={100} duration={500} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Support</Text>
        </Animatable.View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animatable.View animation="fadeInUp" delay={200} duration={500} style={styles.card}>
          <Icon name="support-agent" size={48} color="#667eea" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>We're here to help!</Text>
          <Text style={styles.cardSubtitle}>Contact us for any questions or issues. Our team is ready to assist you.</Text>
        </Animatable.View>
        <Animatable.View animation="fadeInUp" delay={250} duration={500} style={styles.cardRow}>
          <TouchableOpacity style={styles.cardAction} onPress={() => navigation.navigate('HelpSupport')}>
            <Icon name="help-outline" size={32} color="#607D8B" style={styles.actionIcon} />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>FAQs</Text>
              <Text style={styles.actionSubtitle}>Browse common questions</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardAction} onPress={() => Linking.openURL('mailto:support@lipiprint.com')}>
            <Icon name="email" size={32} color="#607D8B" style={styles.actionIcon} />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Email</Text>
              <Text style={styles.actionSubtitle}>support@lipiprint.com</Text>
            </View>
          </TouchableOpacity>
        </Animatable.View>
        <Animatable.View animation="fadeInUp" delay={300} duration={500} style={styles.cardRow}>
          <TouchableOpacity style={styles.cardAction} onPress={() => Linking.openURL('tel:+919876543210')}>
            <Icon name="phone" size={32} color="#607D8B" style={styles.actionIcon} />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Phone</Text>
              <Text style={styles.actionSubtitle}>+91-9876543210</Text>
            </View>
          </TouchableOpacity>
          <View style={[styles.cardAction, { opacity: 0.5 }]}> 
            <Icon name="chat" size={32} color="#BDBDBD" style={styles.actionIcon} />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Live Chat</Text>
              <Text style={styles.actionSubtitle}>Coming soon</Text>
            </View>
          </View>
        </Animatable.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  headerGradient: { paddingTop: 60, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginLeft: 8 },
  scrollContent: { padding: 20, alignItems: 'center' },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardIcon: { marginBottom: 12 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  cardSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 4 },
  cardRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  cardAction: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginHorizontal: 6,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  actionIcon: { marginBottom: 8 },
  actionTextContainer: { alignItems: 'center' },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  actionSubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
}); 