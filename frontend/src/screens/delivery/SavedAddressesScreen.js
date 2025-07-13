import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SavedAddressesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Addresses (Delivery)</Text>
      <Text style={styles.text}>This is the Saved Addresses screen for delivery staff.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  text: { fontSize: 16, color: '#555' },
}); 