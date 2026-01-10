import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';
// import { useColorScheme } from '@/hooks/use-color-scheme';
import { useColorScheme } from 'react-native';

// function TabIcon({ name, color, focused }) {
//   // Simple placeholders if icons aren't available or just use text
//   return <Text style={{ color, fontSize: 24 }}>{name === 'index' ? '🏠' : '👤'}</Text>;
// }

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  // Simple placeholders if icons aren't available or just use text
  return <Text style={{ color, fontSize: 24 }}>{name === 'index' ? '🏠' : '👤'}</Text>;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4ade80',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
            backgroundColor: '#1c1c1c',
            borderTopColor: '#333',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <TabIcon name="index" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name="profile" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
