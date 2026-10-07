import { AnimatedView } from '@/components/ui/animated';
import { Redirect, Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { BottomTabBar } from 'expo-router/build/react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, User } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { CompareFloatingButton } from '@/components/compare-floating-button';
import { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { PALETTE, SPRING } from '@/constants/theme';
import { select } from '@/lib/haptics';

function TabIcon({ icon: Glyph, label, focused, color }: { icon: typeof Home; label: string; focused: boolean; color: string }) {
  const scale = useSharedValue(focused ? 1.05 : 1);
  useEffect(() => {
    scale.set(withSpring(focused ? 1.05 : 1, { ...SPRING.bouncy, reduceMotion: ReduceMotion.System }));
  }, [focused, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedView style={style} className={focused ? 'flex-row items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1' : 'flex-row items-center gap-1.5 px-3 py-1'}>
      <Glyph color={color} size={20} strokeWidth={2.25} />
      <Text numberOfLines={1} style={{ color, fontSize: 11, fontWeight: '600' }}>{label}</Text>
    </AnimatedView>
  );
}

export default function UserTabsLayout() {
  const [tabBarHeight, setTabBarHeight] = useState<number>();
  const insets = useSafeAreaInsets();
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
        tabBarIconStyle: { width: '100%', height: 32 },
        tabBarStyle: { height: 52 + insets.bottom, paddingBottom: insets.bottom, backgroundColor: PALETTE.card, borderTopColor: PALETTE.creamDeep, borderTopWidth: 1, shadowColor: PALETTE.primary, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 6 },
      }}
        screenListeners={{ tabPress: () => select() }}
        tabBar={(props) => <View onLayout={(event) => setTabBarHeight(event.nativeEvent.layout.height)}><BottomTabBar {...props} /></View>}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <TabIcon icon={Home} label="Home" focused={focused} color={color as string} /> }} />
        <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color, focused }) => <TabIcon icon={Search} label="Search" focused={focused} color={color as string} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <TabIcon icon={User} label="Profile" focused={focused} color={color as string} /> }} />
        
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
