import React, { createContext, useContext } from 'react';

// Fixed color scheme - ignores system appearance changes
// App will not restart when phone switches between dark/light mode
const fixedTheme = {
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
  input: '#000000ff',
  inputText: '#222',
  placeholder: '#aaa',
};

const ThemeContext = createContext({
  theme: fixedTheme,
  isDark: false,
  toggleTheme: () => {}, // No-op function for backwards compatibility
});

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ 
      theme: fixedTheme, 
      isDark: false,
      toggleTheme: () => {} // No-op
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 