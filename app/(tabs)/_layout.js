import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/ui/theme';
import { useApp } from '../../src/state/AppState';

const icon = (name) => ({ color, size }) => <Ionicons name={name} size={size} color={color} />;

export default function TabsLayout() {
  const t = useTheme();
  const { seasons } = useApp();
  return (
    <Tabs
      initialRouteName={seasons.nzClosedForSummer ? 'overseas' : 'index'}
      screenOptions={{ headerShown: false, tabBarActiveTintColor: t.accent, tabBarInactiveTintColor: t.sub, tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border }, animation: 'shift' }}>
      <Tabs.Screen name="index" options={{ title: 'NZ', tabBarIcon: icon('snow') }} />
      <Tabs.Screen name="overseas" options={{ title: 'Overseas', tabBarIcon: icon('earth') }} />
      <Tabs.Screen name="finder" options={{ title: 'Ski finder', tabBarIcon: icon('search') }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: icon('chatbubbles') }} />
      <Tabs.Screen name="privacy" options={{ title: 'Privacy', tabBarIcon: icon('shield-checkmark') }} />
    </Tabs>
  );
}
