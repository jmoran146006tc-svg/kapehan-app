import { FadeInDown, FadeInUp, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { MAX_STAGGER, STAGGER_MS } from '@/constants/theme';

export function enter(index = 0, dir: 'down' | 'up' = 'down') {
  const animation = dir === 'down' ? FadeInDown : FadeInUp;
  return animation.delay(Math.min(Math.max(index, 0), MAX_STAGGER) * STAGGER_MS)
    .duration(220).reduceMotion(ReduceMotion.System);
}

export function useMotionEnabled() {
  return !useReducedMotion();
}
