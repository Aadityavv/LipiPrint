import React, { createContext, useContext, useState, useMemo } from 'react';
import { Appearance } from 'react-native';

const lightTheme = {
  mode: 'light',
  background: '#F5F5F5',
  card: '#fff',
  text: '#222',
  header: ['#667eea', '#764ba2'],
  headerText: '#fff',
  icon: '#667eea',
  border: '#e0e0e0',
  button: '#667eea',
  buttonText: '#fff',
  input: '#fff',
  inputText: '#222',
  placeholder: '#aaa',
};

const ThemeContext = createContext({
  theme: lightTheme,
});

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ theme: lightTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 