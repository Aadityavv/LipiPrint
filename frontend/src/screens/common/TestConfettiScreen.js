import React, { useState } from 'react';
import { View, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');

export default function TestConfettiScreen() {
  const [show, setShow] = useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
      {show && (
        <ConfettiCannon
          count={60}
          origin={{ x: width / 2, y: 0 }}
          fadeOut
          explosionSpeed={350}
          fallSpeed={250}
          onAnimationEnd={() => setShow(false)}
          autoStart
        />
      )}
    </View>
  );
} 