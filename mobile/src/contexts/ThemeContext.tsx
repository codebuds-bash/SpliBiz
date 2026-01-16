import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { Appearance, useColorScheme as useRNColorScheme } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  isDark: false,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const { setColorScheme } = useNativeWindColorScheme();
  const systemScheme = useRNColorScheme(); // Reactive system scheme

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    // 1. Persist
    saveTheme(theme);

    // 2. Sync NativeWind
    if (theme === 'system') {
        const target = systemScheme || 'light';
        setColorScheme(target);
    } else {
        setColorScheme(theme);
    }
  }, [theme, systemScheme, setColorScheme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app.theme');
      console.log('[ThemeContext] Loaded theme:', savedTheme);
      if (savedTheme) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Failed to load theme', error);
    }
  };

  const saveTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem('app.theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };

  // Derived state for easy usage
  const isDark = 
    theme === 'dark' || 
    (theme === 'system' && systemScheme === 'dark');
  
  console.log('[ThemeContext] isDark derived:', isDark, 'Theme:', theme, 'System:', systemScheme);

  const setTheme = (newTheme: Theme) => {
      console.log('[ThemeContext] SET THEME called with:', newTheme);
      setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
