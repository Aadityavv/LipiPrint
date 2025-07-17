import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

export default function OnboardingScreen({ navigation }) {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getSettings()
      .then(settings => {
        const onboardingSetting = settings.find(s => s.key === 'onboarding_slides');
        if (onboardingSetting && onboardingSetting.value) {
          try {
            setSlides(JSON.parse(onboardingSetting.value));
          } catch {
            setSlides([]);
            setError('Failed to parse onboarding slides.');
          }
        } else {
          // fallback to static
          setSlides([
            { key: 'welcome', title: 'Welcome to LipiPrint!', description: 'Your smart, easy, and fast printing solution.', icon: 'print' },
            { key: 'upload', title: 'Upload Any Document', description: 'PDF, DOC, PPT, images and more. Upload from your phone, camera, or cloud.', icon: 'cloud-upload' },
            { key: 'customize', title: 'Customize Your Print', description: 'Choose paper, color, copies, and advanced options.', icon: 'tune' },
            { key: 'track', title: 'Track & Pickup', description: 'Track your order in real-time and pick up at your convenience.', icon: 'track-changes' },
            { key: 'support', title: '24/7 Support', description: 'Get help anytime with our in-app support and FAQs.', icon: 'support-agent' },
          ]);
        }
      })
      .catch(() => setError('Failed to load onboarding slides.'))
      .finally(() => setLoading(false));
  }, []);

  const nextSlide = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else navigation.replace('Login');
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></View>;
  }
  if (error) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }
  if (!slides.length) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>No onboarding slides found.</Text></View>;
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <Animatable.View animation="fadeInDown" delay={100} duration={500} style={styles.header}>
        <Text style={styles.logo}>LipiPrint</Text>
      </Animatable.View>
      <Animatable.View animation="fadeInUp" delay={200} duration={500} style={styles.slideContainer}>
        <Icon name={slides[current].icon} size={80} color="#fff" style={styles.slideIcon} />
        <Text style={styles.slideTitle}>{slides[current].title}</Text>
        <Text style={styles.slideDesc}>{slides[current].description}</Text>
      </Animatable.View>
      <View style={styles.dotsContainer}>
        {slides.map((_, idx) => (
          <View key={idx} style={[styles.dot, current === idx && styles.activeDot]} />
        ))}
      </View>
      <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
        <Text style={styles.nextButtonText}>{current === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
        <Icon name="arrow-forward" size={24} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginTop: 60, marginBottom: 40 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
  slideContainer: { alignItems: 'center', paddingHorizontal: 30 },
  slideIcon: { marginBottom: 30 },
  slideTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 16, textAlign: 'center' },
  slideDesc: { fontSize: 16, color: '#fff', textAlign: 'center', marginBottom: 30 },
  dotsContainer: { flexDirection: 'row', marginBottom: 40, marginTop: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff', opacity: 0.3, marginHorizontal: 5 },
  activeDot: { opacity: 1 },
  nextButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#667eea', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
}); 