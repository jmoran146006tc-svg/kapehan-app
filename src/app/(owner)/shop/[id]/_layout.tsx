import { Tabs } from 'expo-router';

export default function OwnerShopTabsLayout() {
  return <Tabs screenOptions={{ headerShown: false }} tabBar={() => null}><Tabs.Screen name="index" /><Tabs.Screen name="menu" /><Tabs.Screen name="reviews" /></Tabs>;
}
