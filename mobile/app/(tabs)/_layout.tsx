import { Tabs } from 'expo-router';
import React from 'react';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const iconName = name === 'index' ? 'home' : 'user';
  // Optional: add a tiny dot or glow if focused?
  return <Feather name={iconName as any} size={24} color={color} style={{ opacity: focused ? 1 : 0.8 }} />;
}

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1db954',
        tabBarInactiveTintColor: isDark ? '#b3b3b3' : '#94a3b8',
        tabBarStyle: {
            backgroundColor: isDark ? '#212121' : '#ffffff',
            borderTopColor: isDark ? '#535353' : '#e2e8f0',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
            elevation: 0, // Android shadow
            shadowOpacity: 0 // iOS shadow
        },
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
            fontFamily: 'Outfit-Medium',
            fontSize: 12
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon name="index" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          tabBarIcon: ({ color, focused }) => <TabIcon name="profile" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
