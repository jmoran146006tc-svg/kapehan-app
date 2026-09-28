import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { SPRING } from '@/constants/theme';
import { select } from '@/lib/haptics';

type Tab = { key: string; label: string };

export function UnderlineTabs({ tabs, value, onChange, animated = true }: { tabs: Tab[]; value: string; onChange: (key: string) => void; animated?: boolean }) {
  const [width, setWidth] = useState(0);
  const offset = useSharedValue(0);
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.key === value));
  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  const tabWidth = width / Math.max(tabs.length, 1);
  return (
    <View className="relative flex-row border-b border-border/60" onLayout={(event) => {
      const nextWidth = event.nativeEvent.layout.width;
      setWidth(nextWidth);
      offset.set((nextWidth / Math.max(tabs.length, 1)) * activeIndex);
    }}>
      {tabs.map((tab, index) => (
        <Pressable
          key={tab.key}
          className="min-h-11 flex-1 items-center justify-center px-2"
          accessibilityRole="tab"
          accessibilityState={{ selected: value === tab.key }}
          onPress={() => {
            if (value === tab.key) return;
            select();
            onChange(tab.key);
            offset.set(animated ? withSpring(index * tabWidth, { ...SPRING.gentle, reduceMotion: ReduceMotion.System }) : index * tabWidth);
          }}>
          <Text className={value === tab.key ? 'font-semibold text-accent' : 'text-muted-foreground'}>{tab.label}</Text>
        </Pressable>
      ))}
      {width > 0 ? <Animated.View pointerEvents="none" className="absolute bottom-0 h-0.5 bg-accent" style={[{ width: tabWidth }, indicatorStyle]} /> : null}
    </View>
  );
}
