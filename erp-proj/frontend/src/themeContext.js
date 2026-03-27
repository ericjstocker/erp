import React, { createContext, useState, useContext } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  const [accentColor, setAccentColor] = useState('#0066cc')

  const themes = {
    light: {
      bg: '#ffffff',
      text: '#000000',
      border: '#ddd',
      hover: '#f5f5f5',
      input: '#ffffff',
      inputBorder: '#ccc'
    },
    dark: {
      bg: '#1e1e1e',
      text: '#e0e0e0',
      border: '#404040',
      hover: '#2d2d2d',
      input: '#2d2d2d',
      inputBorder: '#505050'
    }
  }

  const currentTheme = themes[theme]

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setAccentColor, toggleTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
