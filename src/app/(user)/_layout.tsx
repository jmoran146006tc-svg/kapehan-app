import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, Search, User } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { CompareFloatingButton } from '@/components/compare-floating-button';

export default function UserTabsLayout() {
  const { status } = useAuth();
  if (status === 'suspended') return <Redirect href={'/(auth)/suspended' as never} />;
  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#D9722F', tabBarInactiveTintColor: '#7D6656' }}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color as string} size={size} strokeWidth={2.75} /> }} />
        <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color, size }) => <Search color={color as string} size={size} strokeWidth={2.75} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color as string} size={size} strokeWidth={2.75} /> }} />

        <Tabs.Screen name="saved" options={{ href: null }} />
        <Tabs.Screen name="compare" options={{ href: null }} />
        <Tabs.Screen name="shop/[id]" options={{ href: null }} />
        <Tabs.Screen name="map" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
      </Tabs>
      <CompareFloatingButton />
    </View>
  );
}
