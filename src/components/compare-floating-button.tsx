import { Platform, Pressable, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/build/react-navigation/bottom-tabs';
import { X } from 'lucide-react-native';
import { useCompareStore } from '@/store/compareStore';
import { useShops } from '@/hooks/useShops';
import { BottomTabInset } from '@/constants/theme';
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

  const popoverContent = (
    <PopoverContent side="top" align="end" sideOffset={8}
      className="z-50 w-64 gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg">
      <Text className="font-bold">Compare shops</Text>
      {ids.map((id) => <View key={id} className="flex-row items-center justify-between gap-2">
        <Text numberOfLines={1} className="flex-1 text-sm">{shops.find((shop) => shop.id === id)?.name ?? 'Shop'}</Text>
        <Pressable onPress={() => toggle(id)} accessibilityLabel="Remove shop from comparison" className="rounded-full p-2"><Icon as={X} size={16} /></Pressable>
      </View>)}
      <View className="flex-row items-center justify-between">
        <PopoverClose className="rounded-md px-3 py-2" onPress={clear}><Text className="text-sm">Clear all</Text></PopoverClose>
        <PopoverClose className="rounded-md bg-primary px-3 py-2" onPress={() => router.push('/(user)/compare')}><Text className="text-sm text-primary-foreground">Compare →</Text></PopoverClose>
      </View>
    </PopoverContent>
  );

  return (
    <Popover className="absolute right-4 z-50" style={{ bottom: tabHeight + 16 }}>
      <Animated.View style={animatedStyle}>
        <PopoverTrigger className="rounded-full bg-primary px-4 py-3 shadow-lg shadow-black/20"
          onPressIn={() => { scale.set(withSpring(0.97, { reduceMotion: ReduceMotion.System })); }}
          onPressOut={() => { scale.set(withSpring(1, { reduceMotion: ReduceMotion.System })); }}
          accessibilityLabel="Manage compared shops">
          <Text className="font-medium text-primary-foreground">Compare ({ids.length})</Text>
        </PopoverTrigger>
      </Animated.View>
      <PopoverPortal>
        {/* Radix's web portal slots onto one child; native still needs its dismiss overlay. */}
        {Platform.OS === 'web' ? (
          popoverContent
        ) : (
          <>
            <PopoverOverlay className="absolute inset-0" />
            {popoverContent}
          </>
        )}
      </PopoverPortal>
    </Popover>
  );
}
