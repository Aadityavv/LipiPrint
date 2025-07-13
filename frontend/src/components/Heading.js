import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

/**
 * Props:
 * - title: string (required)
 * - subtitle?: string
 * - left?: ReactNode (e.g., back button)
 * - right?: ReactNode (e.g., action button)
 * - variant?: 'primary' | 'section' (default: 'primary')
 * - style?: object (optional style override)
 */
export default function Heading({
  title,
  subtitle,
  left,
  right,
  variant = 'primary',
  style,
  showBack = true,
  textAlign,
  textStyle,
}) {
  return (
    <View style={[styles[variant + 'Wrap'], style]}>
      <View style={styles.row}>
        {showBack && left ? <View style={styles.side}>{left}</View> : <View style={styles.side} />}
        <View style={styles.center}>
          <Text style={[styles[variant + 'Title'], textAlign ? {textAlign} : null, textStyle]}>{title}</Text>
          {subtitle ? <Text style={styles[variant + 'Subtitle']}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={styles.side}>{right}</View> : <View style={styles.side} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryWrap: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 5,
    backgroundColor: 'transparent',
    marginTop:-25,
    marginBottom:-15,
  },
  sectionWrap: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  primarySubtitle: {
    fontSize: 15,
    color: '#e0e0e0',
    textAlign: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'left',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'left',
    marginTop: 2,
  },
}); 