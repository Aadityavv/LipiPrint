import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

export default function StoreClosedBanner() {
  return (
    <LinearGradient
      colors={['#ff5858', '#f09819']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.banner}
    >
      <Icon name="block" size={28} color="#fff" style={{ marginRight: 10 }} />
      <Text style={styles.text}>Store is not accepting orders right now</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    // borderRadius: 16,
    paddingTop: 20,
    // shadowColor: '#F44336',
    // shadowOpacity: 0.18,
    // shadowRadius: 8,
    // elevation: 4,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
}); 