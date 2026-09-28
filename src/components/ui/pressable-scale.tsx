import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { tap, select } from '@/lib/haptics';
import { PRESS_SCALE, SPRING } from '@/constants/theme';
import { cn } from '@/lib/utils';

type Props = PressableProps & {
  scaleTo?: number;
  haptic?: 'tap' | 'select' | false;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function PressableScale({ scaleTo = PRESS_SCALE, haptic = 'tap', onPress, onPressIn, onPressOut, className, style, disabled, ...props }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        {...props}
        disabled={disabled}
        accessibilityRole={props.accessibilityRole ?? 'button'}
        className={cn(className, Platform.select({ web: 'transition-transform duration-150 hover:-translate-y-0.5' }))}
        onPressIn={(event) => {
          scale.set(withSpring(scaleTo, { ...SPRING.snappy, reduceMotion: ReduceMotion.System }));
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.set(withSpring(1, { ...SPRING.snappy, reduceMotion: ReduceMotion.System }));
          onPressOut?.(event);
        }}
        onPress={(event) => {
          if (haptic === 'tap') tap();
          if (haptic === 'select') select();
          onPress?.(event);
        }}
      />
    </Animated.View>
  );
}
