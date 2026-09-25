import { Platform } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

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
        'shrink-0 rounded-full',
        selected ? 'bg-accent' : 'bg-secondary',
        Platform.select({
          web: selected
            ? 'transition-colors duration-150 hover:bg-accent/90'
            : 'transition-colors duration-150 hover:bg-secondary/70',
        }),
      )}
      onPress={onPress}
      onPressIn={() => { scale.set(withSpring(0.97, { reduceMotion: ReduceMotion.System })); }}
      onPressOut={() => { scale.set(withSpring(1, { reduceMotion: ReduceMotion.System })); }}>
      <Text className={selected ? 'text-accent-foreground' : 'text-foreground'}>{label}</Text>
    </Button>
    </Animated.View>
  );
}
