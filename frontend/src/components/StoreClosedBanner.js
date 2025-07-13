import React from 'react';
import { View, Text } from 'react-native';

export default function StoreClosedBanner() {
  return (
    <View style={{ backgroundColor: '#F44336', padding: 10, alignItems: 'center' }}>
      <Text style={{ color: 'white', fontWeight: 'bold' }}>Store is not accepting orders</Text>
    </View>
  );
} 