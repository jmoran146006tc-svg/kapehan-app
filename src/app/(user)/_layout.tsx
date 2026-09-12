import { Tabs } from 'expo-router';
import { Home, Search, Bookmark, User } from 'lucide-react-native';

export default function UserTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color as string} size={size} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color, size }) => <Search color={color as string} size={size} /> }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ({ color, size }) => <Bookmark color={color as string} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color as string} size={size} /> }} />

      <Tabs.Screen name="compare" options={{ href: null }} />
      <Tabs.Screen name="shop/[id]" options={{ href: null }} />
    </Tabs>
  );
}