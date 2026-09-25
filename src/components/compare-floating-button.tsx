import { Pressable, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/build/react-navigation/bottom-tabs';
import { X } from 'lucide-react-native';
import { useCompareStore } from '@/store/compareStore';
import { useShops } from '@/hooks/useShops';
import { BottomTabInset } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Popover, PopoverClose, PopoverContent, PopoverOverlay, PopoverPortal, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/text';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

function useTabHeight() {
  try {
    return useBottomTabBarHeight();
  } catch {
    return BottomTabInset;
  }
}

export function CompareFloatingButton({ measuredTabHeight }: { measuredTabHeight?: number }) {
  const ids = useCompareStore((state) => state.ids);
  const toggle = useCompareStore((state) => state.toggle);
  const clear = useCompareStore((state) => state.clear);
  const { shops } = useShops();
  const pathname = usePathname();
  const fallbackTabHeight = useTabHeight();
  const tabHeight = measuredTabHeight ?? fallbackTabHeight;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (ids.length < 2 || pathname === '/compare' || pathname.endsWith('/compare')) return null;

  return (
    <Popover className="absolute right-4 z-50" style={{ bottom: tabHeight + 16 }}>
      <Animated.View style={animatedStyle}>
        <PopoverTrigger asChild>
          <Button className="rounded-full shadow-lg shadow-black/20"
            onPressIn={() => { scale.set(withSpring(0.97, { reduceMotion: ReduceMotion.System })); }}
            onPressOut={() => { scale.set(withSpring(1, { reduceMotion: ReduceMotion.System })); }}
            accessibilityLabel="Manage compared shops">
            <Text>Compare ({ids.length})</Text>
          </Button>
        </PopoverTrigger>
      </Animated.View>
      <PopoverPortal>
        <PopoverOverlay className="absolute inset-0" />
        <PopoverContent side="top" align="end" sideOffset={8}
          className="z-50 w-64 gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg">
          <Text className="font-bold">Compare shops</Text>
          {ids.map((id) => <View key={id} className="flex-row items-center justify-between gap-2">
            <Text numberOfLines={1} className="flex-1 text-sm">{shops.find((shop) => shop.id === id)?.name ?? 'Shop'}</Text>
            <Pressable onPress={() => toggle(id)} accessibilityLabel="Remove shop from comparison" className="rounded-full p-2"><Icon as={X} size={16} /></Pressable>
          </View>)}
          <View className="flex-row items-center justify-between">
            <PopoverClose asChild><Button size="sm" variant="ghost" onPress={clear}><Text>Clear all</Text></Button></PopoverClose>
            <PopoverClose asChild><Button size="sm" onPress={() => router.push('/(user)/compare')}><Text>Compare →</Text></Button></PopoverClose>
          </View>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}
