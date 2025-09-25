import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';

export default function AboutScreen({ navigation }) {
  const { theme } = useTheme();

  const appInfo = {
    name: 'LipiPrint',
    version: '1.0.0',
    buildNumber: '2025.01.001',
    releaseDate: 'January 2025',
    developer: 'LipiPrint Technologies',
    website: 'https://lipiprint.in',
    email: 'support@lipiprint.in',
    phone: '+91 12345 67890',
  };

  const features = [
    {
      title: 'High-Quality Printing',
      description: 'Professional grade printing with advanced technology',
      icon: 'print',
      color: '#4CAF50',
    },
    {
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery across India',
      icon: 'local-shipping',
      color: '#2196F3',
    },
    {
      title: 'Secure Payments',
      description: 'Safe and secure payment processing',
      icon: 'security',
      color: '#FF9800',
    },
    {
      title: 'Real-time Tracking',
      description: 'Track your orders in real-time',
      icon: 'track-changes',
      color: '#9C27B0',
    },
    {
      title: '24/7 Support',
      description: 'Round-the-clock customer support',
      icon: 'support-agent',
      color: '#F44336',
    },
    {
      title: 'Eco-Friendly',
      description: 'Environmentally conscious printing practices',
      icon: 'eco',
      color: '#4CAF50',
    },
  ];

  const teamMembers = [
    {
      name: 'Rahul Sharma',
      role: 'Founder & CEO',
      description: 'Visionary leader with 10+ years in printing industry',
    },
    {
      name: 'Priya Patel',
      role: 'CTO',
      description: 'Technology expert specializing in mobile applications',
    },
    {
      name: 'Amit Kumar',
      role: 'Head of Operations',
      description: 'Operations specialist ensuring smooth service delivery',
    },
    {
      name: 'Sneha Singh',
      role: 'Customer Success',
      description: 'Dedicated to providing exceptional customer experience',
    },
  ];

  const stats = [
    { label: 'Happy Customers', value: '10,000+', icon: 'people', color: '#4CAF50' },
    { label: 'Orders Delivered', value: '50,000+', icon: 'local-shipping', color: '#2196F3' },
    { label: 'Cities Covered', value: '500+', icon: 'location-on', color: '#FF9800' },
    { label: 'Years of Service', value: '5+', icon: 'schedule', color: '#9C27B0' },
  ];

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: `Check out LipiPrint - India's leading online printing service! Download the app and get high-quality prints delivered to your doorstep. Download now: ${appInfo.website}`,
        url: appInfo.website,
        title: 'LipiPrint - Online Printing Service',
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate Our App',
      'We would love your feedback! Please rate our app on the App Store.',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Rate Now', onPress: () => {
          // In a real app, you would link to the app store
          Alert.alert('Thank you!', 'Your feedback helps us improve.');
        }},
      ]
    );
  };

  const handleContactUs = (method) => {
    switch (method) {
      case 'email':
        Linking.openURL(`mailto:${appInfo.email}`);
        break;
      case 'phone':
        Linking.openURL(`tel:${appInfo.phone}`);
        break;
      case 'website':
        Linking.openURL(appInfo.website);
        break;
      default:
        break;
    }
  };

  const handleLegalAction = (type) => {
    Alert.alert(
      type,
      `Our ${type.toLowerCase()} is available on our website. Would you like to visit our website?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Visit Website', onPress: () => Linking.openURL(appInfo.website) },
      ]
    );
  };

  const renderFeature = (feature, index) => (
    <Animatable.View
      key={index}
      animation="fadeInUp"
      delay={index * 100}
      duration={500}
      style={styles.featureCard}
    >
      <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
        <Icon name={feature.icon} size={24} color={feature.color} />
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: theme.text }]}>
          {feature.title}
        </Text>
        <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
          {feature.description}
        </Text>
      </View>
    </Animatable.View>
  );

  const renderTeamMember = (member, index) => (
    <Animatable.View
      key={index}
      animation="fadeInUp"
      delay={index * 100}
      duration={500}
      style={styles.teamCard}
    >
      <View style={styles.teamAvatar}>
        <Text style={styles.teamInitial}>{member.name.charAt(0)}</Text>
      </View>
      <View style={styles.teamContent}>
        <Text style={[styles.teamName, { color: theme.text }]}>{member.name}</Text>
        <Text style={[styles.teamRole, { color: '#667eea' }]}>{member.role}</Text>
        <Text style={[styles.teamDescription, { color: theme.textSecondary }]}>
          {member.description}
        </Text>
      </View>
    </Animatable.View>
  );

  const renderStat = (stat, index) => (
    <Animatable.View
      key={index}
      animation="fadeInUp"
      delay={index * 100}
      duration={500}
      style={styles.statCard}
    >
      <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
        <Icon name={stat.icon} size={24} color={stat.color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
    </Animatable.View>
  );

  const renderActionButton = (title, icon, onPress, color = '#667eea') => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.actionText, { color: theme.text }]}>{title}</Text>
      <Icon name="chevron-right" size={16} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#22194f', '#22194f']}
        style={styles.headerGradient}
      >
        <Heading
          title="About LipiPrint"
          subtitle="Your trusted printing partner"
          left={
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          }
          variant="primary"
        />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info Card */}
        <Animatable.View animation="fadeInDown" duration={500} style={styles.appInfoCard}>
          <View style={styles.appLogo}>
            <Text style={styles.appLogoText}>LP</Text>
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>{appInfo.name}</Text>
          <Text style={[styles.appVersion, { color: theme.textSecondary }]}>
            Version {appInfo.version} ({appInfo.buildNumber})
          </Text>
          <Text style={[styles.appRelease, { color: theme.textSecondary }]}>
            Released {appInfo.releaseDate}
          </Text>
        </Animatable.View>

        {/* App Description */}
        <Animatable.View animation="fadeInUp" delay={200} duration={500} style={styles.descriptionCard}>
          <Text style={[styles.descriptionTitle, { color: theme.text }]}>About Us</Text>
          <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
            LipiPrint is India's leading online printing service, revolutionizing the way people access 
            high-quality printing services. Founded in 2020, we've been committed to providing 
            convenient, affordable, and reliable printing solutions for individuals and businesses across India.
          </Text>
          <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
            Our mission is to make professional printing accessible to everyone, anywhere, anytime. 
            With our advanced technology, eco-friendly practices, and dedicated customer service, 
            we ensure your printing needs are met with the highest standards.
          </Text>
        </Animatable.View>

        {/* Key Features */}
        <Animatable.View animation="fadeInUp" delay={400} duration={500}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Why Choose LipiPrint?</Text>
          {features.map((feature, index) => renderFeature(feature, index))}
        </Animatable.View>

        {/* Stats */}
        <Animatable.View animation="fadeInUp" delay={600} duration={500}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Our Impact</Text>
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => renderStat(stat, index))}
          </View>
        </Animatable.View>

        {/* Team Section */}
        <Animatable.View animation="fadeInUp" delay={800} duration={500}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Meet Our Team</Text>
          {teamMembers.map((member, index) => renderTeamMember(member, index))}
        </Animatable.View>

        {/* Action Buttons */}
        <Animatable.View animation="fadeInUp" delay={1000} duration={500}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={[styles.actionsContainer, { backgroundColor: theme.card }]}>
            {renderActionButton('Share App', 'share', handleShareApp, '#4CAF50')}
            {renderActionButton('Rate App', 'star', handleRateApp, '#FF9800')}
            {renderActionButton('Contact Support', 'support-agent', () => handleContactUs('email'), '#2196F3')}
            {renderActionButton('Visit Website', 'language', () => handleContactUs('website'), '#9C27B0')}
          </View>
        </Animatable.View>

        {/* Contact Information */}
        <Animatable.View animation="fadeInUp" delay={1200} duration={500}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Get in Touch</Text>
          <View style={[styles.contactContainer, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContactUs('email')}
            >
              <Icon name="email" size={20} color="#2196F3" />
              <Text style={[styles.contactText, { color: theme.text }]}>{appInfo.email}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContactUs('phone')}
            >
              <Icon name="phone" size={20} color="#4CAF50" />
              <Text style={[styles.contactText, { color: theme.text }]}>{appInfo.phone}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContactUs('website')}
            >
              <Icon name="language" size={20} color="#FF9800" />
              <Text style={[styles.contactText, { color: theme.text }]}>{appInfo.website}</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Legal */}
        <Animatable.View animation="fadeInUp" delay={1400} duration={500}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Legal</Text>
          <View style={[styles.legalContainer, { backgroundColor: theme.card }]}>
            {renderActionButton('Privacy Policy', 'privacy-tip', () => handleLegalAction('Privacy Policy'), '#607D8B')}
            {renderActionButton('Terms of Service', 'description', () => handleLegalAction('Terms of Service'), '#607D8B')}
            {renderActionButton('Refund Policy', 'money-off', () => handleLegalAction('Refund Policy'), '#607D8B')}
          </View>
        </Animatable.View>

        {/* Copyright */}
        <Animatable.View animation="fadeInUp" delay={1600} duration={500} style={styles.copyrightContainer}>
          <Text style={[styles.copyrightText, { color: theme.textSecondary }]}>
            © 2025 {appInfo.developer}. All rights reserved.
          </Text>
          <Text style={[styles.copyrightText, { color: theme.textSecondary }]}>
            Made with ❤️ in India
          </Text>
        </Animatable.View>
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
  appInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appLogoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 2,
  },
  appRelease: {
    fontSize: 12,
  },
  descriptionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teamInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  teamContent: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  teamRole: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  contactContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactText: {
    marginLeft: 12,
    fontSize: 14,
  },
  legalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  copyrightContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  copyrightText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
});