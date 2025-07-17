import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LipiPrintLogo from '../../assets/logo/LipiPrintLogo.png';
import { useTheme } from '../../theme/ThemeContext';
import Heading from '../../components/Heading';

export default function AboutScreen({ navigation }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={['#22194f', '#22194f']} style={{paddingTop: 40, paddingBottom: 20, paddingHorizontal: 20}}>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44}}>
          <TouchableOpacity style={{padding: 6}} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{flex: 1, textAlign: 'center', fontSize: 20, color: '#fff', fontWeight: 'bold', marginLeft: -30}}>
            About LipiPrint
          </Text>
        </View>
      </LinearGradient>
      <Animatable.View animation="fadeInUp" delay={200} duration={500} style={[styles.content, { backgroundColor: theme.card }]}>
        <View style={styles.logoWrap}>
          <Icon name="print" size={64} color={theme.icon} style={{ marginBottom: 24 }} />
        </View>
        <Text style={[styles.appName, { color: theme.text }]}>LipiPrint</Text>
        <Text style={[styles.version, { color: theme.text }]}>Version 1.0.0</Text>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
          <Text style={[styles.text, { color: theme.text }]}>LipiPrint is your one-stop solution for all your printing needs. We offer high-quality, affordable, and fast printing services for students, professionals, and businesses.</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Us</Text>
          <Text style={[styles.infoText, { color: theme.text }]}>Email: support@lipiprint.com</Text>
          <Text style={[styles.infoText, { color: theme.text }]}>Phone: +91-9876543210</Text>
          <Text style={[styles.infoText, { color: theme.text }]}>Website: www.lipiprint.com</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Address</Text>
          <Text style={[styles.infoText, { color: theme.text }]}>123, Main Road, City Center, Your City, India</Text>
        </View>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  headerGradient: { paddingTop: 60, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginLeft: 8 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', margin: 20, borderRadius: 12, padding: 24, elevation: 2 },
  text: { fontSize: 16, color: '#555', textAlign: 'center' },
  logoWrap: { marginBottom: 20 },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#555', marginBottom: 8 },
  version: { fontSize: 16, color: '#555', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#555', marginBottom: 8 },
  infoText: { fontSize: 16, color: '#555', textAlign: 'center' },
}); 