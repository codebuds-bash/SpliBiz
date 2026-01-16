import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';

import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { styled } from 'nativewind';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// This component handles the auth protection
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { isDark } = useTheme();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      // If not logged in and not in auth group, go to login
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // If logged in but in auth group, go to dashboard
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1db954" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: isDark ? '#121212' : '#ffffff' } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="create-group" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="add-expense" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="debts" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

function NavigationWrapper() {
  const { isDark } = useTheme();
  
  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <RootLayoutNav />
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={isDark ? "#121212" : "#ffffff"} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Outfit-Light': Outfit_300Light,
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-Medium': Outfit_500Medium,
    'Outfit-SemiBold': Outfit_600SemiBold,
    'Outfit-Bold': Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationWrapper />
      </ThemeProvider>
    </AuthProvider>
  );
}
