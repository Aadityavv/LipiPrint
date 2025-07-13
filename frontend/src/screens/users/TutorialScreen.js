import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';

const steps = [
  {
    icon: 'cloud-upload',
    title: 'Upload Your Document',
    description: 'Tap the upload button and select your file from device, camera, or cloud.'
  },
  {
    icon: 'tune',
    title: 'Set Print Options',
    description: 'Choose paper size, color, number of copies, and more.'
  },
  {
    icon: 'payment',
    title: 'Make Payment',
    description: 'Pay securely using UPI, cards, or wallets.'
  },
  {
    icon: 'track-changes',
    title: 'Track Your Order',
    description: 'Get real-time updates and notifications on your print status.'
  },
  {
    icon: 'location-on',
    title: 'Pickup or Delivery',
    description: 'Choose to pick up your prints or get them delivered to your doorstep.'
  }
];

export default function TutorialScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.title}>Tutorial</Text>
        <Text style={styles.text}>This is the Tutorial screen for users.</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {steps.map((step, index) => (
          <Animatable.View
            key={index}
            animation="fadeInUp"
            delay={index * 200}
            style={styles.stepCard}
          >
            <View style={styles.iconContainer}>
              <Icon name={step.icon} size={30} color="#667eea" />
            </View>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </Animatable.View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.getStartedButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.getStartedButtonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
    color: '#e0e0e0',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  getStartedButton: {
    backgroundColor: '#667eea',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: '90%',
  },
  getStartedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 