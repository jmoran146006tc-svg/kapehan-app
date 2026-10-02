import type { ReactNode } from 'react';
import { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { AnimatedView } from '@/components/ui/animated';

export function AuthField({ index, children }: { index: number; children: ReactNode }) {
  return (
    <AnimatedView entering={FadeIn.delay(Math.min(index, 8) * 40).duration(180).reduceMotion(ReduceMotion.System)}>
      {children}
    </AnimatedView>
  );
}
