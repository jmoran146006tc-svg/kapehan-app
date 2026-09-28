import type { ReactNode } from 'react';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

export function AuthField({ index, children }: { index: number; children: ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).duration(220).reduceMotion(ReduceMotion.System)}>
      {children}
    </Animated.View>
  );
}
