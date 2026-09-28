import { type ViewProps } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, useReducedMotion, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: ViewProps) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.65);
  useEffect(() => {
    if (!reduced) opacity.set(withRepeat(withTiming(1, { duration: 1100, reduceMotion: ReduceMotion.System }), -1, true));
  }, [opacity, reduced]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={animatedStyle} className={cn('rounded-xl bg-secondary', className)} {...props} />;
}
