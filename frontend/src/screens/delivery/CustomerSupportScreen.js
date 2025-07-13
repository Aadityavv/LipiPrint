import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CustomerSupportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Support (Delivery)</Text>
      <Text style={styles.text}>This is the Customer Support screen for delivery staff.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  text: { fontSize: 16, color: '#555' },
}); 