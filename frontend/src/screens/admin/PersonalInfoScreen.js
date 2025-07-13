import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PersonalInfoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personal Information (Admin)</Text>
      <Text style={styles.text}>This is the Personal Information screen for admin.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  text: { fontSize: 16, color: '#555' },
}); 