import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../../theme/ThemeContext';

export default function SplashScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animatable.View animation="fadeInDown" delay={100} duration={500} style={styles.logoContainer}>
        <Image
          source={require('../../assets/logo/LipiPrintLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animatable.View>
      <Animatable.View animation="fadeInUp" delay={200} duration={350} style={styles.textSection}>
        <Text style={[styles.headline]}>Upload.{"\n"}Print.{"\n"}Collect.</Text>
        <Animatable.Text animation="fadeInUp" delay={300} duration={350} style={[styles.subheading, { color: theme.text }]}>
          Quick and easy printing for students and professionals.
        </Animatable.Text>
      </Animatable.View>
      <Animatable.View animation="fadeInUp" delay={400} duration={350} style={{ width: '100%' }}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </TouchableOpacity>
      </Animatable.View>
      {/* Illustration placeholder (uncomment and add your image if needed) */}
      {/* <Animatable.Image
        animation="bounceIn"
        delay={700}
        duration={500}
        source={require('../assets/printer_illustration.png')}
        style={styles.illustration}
        resizeMode="contain"
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 160,
    height: 160,
  },
  textSection: {
    marginTop: 10,
    marginBottom: 32,
    alignItems: 'center',
  },
  headline: {
    fontSize: 60,
    fontWeight: '900',
    color: '#1A232E',
    marginBottom: 16,
    lineHeight: 64,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 18,
    color: '#222',
    marginBottom: 32,
    textAlign: 'center',
  },
  ctaButton: {
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 32,
    backgroundColor: '#0058A3',
    shadowColor: '#0058A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  illustration: {
    width: '100%',
    height: 220,
    alignSelf: 'center',
  },
}); 
