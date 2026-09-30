import { AnimatedView } from '@/components/ui/animated';
import { Redirect, Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { BottomTabBar } from 'expo-router/build/react-navigation/bottom-tabs';
import { Home, Search, User } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { CompareFloatingButton } from '@/components/compare-floating-button';
import { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { PALETTE, SPRING } from '@/constants/theme';
import { select } from '@/lib/haptics';

function TabIcon({ icon: Glyph, label, focused, color, size }: { icon: typeof Home; label: string; focused: boolean; color: string; size: number }) {
  const scale = useSharedValue(focused ? 1.05 : 1);
  useEffect(() => {
    scale.set(withSpring(focused ? 1.05 : 1, { ...SPRING.bouncy, reduceMotion: ReduceMotion.System }));
  }, [focused, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedView style={style} className={focused ? 'flex-row items-center gap-2 rounded-full bg-accent-soft px-4 py-1.5' : 'flex-row items-center gap-2 px-4 py-1.5'}>
      <Glyph color={color} size={size} strokeWidth={2.75} />
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </AnimatedView>
  );
}

export default function UserTabsLayout() {
  const [tabBarHeight, setTabBarHeight] = useState<number>();
  const { status } = useAuth();
  if (status === 'suspended') return <Redirect href={'/(auth)/suspended' as never} />;
  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: PALETTE.accent,
        tabBarInactiveTintColor: PALETTE.mutedForeground,
        tabBarShowLabel: false,
         tabBarStyle: { backgroundColor: PALETTE.card, borderTopColor: PALETTE.creamDeep, borderTopWidth: 1, shadowColor: PALETTE.primary, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 6 },
      }}
        screenListeners={{ tabPress: () => select() }}
        tabBar={(props) => <View onLayout={(event) => setTabBarHeight(event.nativeEvent.layout.height)}><BottomTabBar {...props} /></View>}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size, focused }) => <TabIcon icon={Home} label="Home" focused={focused} color={color as string} size={size} /> }} />
        <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color, size, focused }) => <TabIcon icon={Search} label="Search" focused={focused} color={color as string} size={size} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size, focused }) => <TabIcon icon={User} label="Profile" focused={focused} color={color as string} size={size} /> }} />
        
        <Tabs.Screen name="saved" options={{ href: null }} />
        <Tabs.Screen name="compare" options={{ href: null }} />
        <Tabs.Screen name="shop/[id]" options={{ href: null }} />
        <Tabs.Screen name="map" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
      </Tabs>
      <CompareFloatingButton measuredTabHeight={tabBarHeight} />
    </View>
  );
}
