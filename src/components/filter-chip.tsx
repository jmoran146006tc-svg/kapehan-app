import { Platform } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { select } from '@/lib/haptics';
import { SPRING } from '@/constants/theme';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected = false, onPress }: FilterChipProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animatedStyle}>
    <Button
      size="sm"
      variant={selected ? 'default' : 'outline'}
      className={cn(
        'min-h-11 shrink-0 rounded-full',
        selected ? 'bg-accent shadow-sm shadow-accent/30' : 'border-border/60 bg-card active:bg-card/70',
        Platform.select({
          web: selected
            ? 'transition-colors duration-150 hover:bg-accent/90'
            : 'transition-colors duration-150 hover:bg-card/70',
        }),
      )}
      onPress={() => { select(); onPress(); }}
      onPressIn={() => { scale.set(withSpring(0.97, { ...SPRING.snappy, reduceMotion: ReduceMotion.System })); }}
      onPressOut={() => { scale.set(withSpring(1, { ...SPRING.snappy, reduceMotion: ReduceMotion.System })); }}>
      <Text className={selected ? 'text-accent-foreground' : 'text-foreground group-hover:text-foreground group-active:text-foreground'}>{label}</Text>    </Button>
    </Animated.View>
  );
}
