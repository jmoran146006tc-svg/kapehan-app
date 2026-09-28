import { Platform, type ViewStyle } from 'react-native';

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

export const SPRING = {
  snappy: { damping: 18, stiffness: 320, mass: 0.8 },
  bouncy: { damping: 12, stiffness: 220, mass: 0.9 },
  gentle: { damping: 20, stiffness: 140, mass: 1 },
} as const;
export const DURATION = { fast: 150, base: 220, slow: 360 } as const;
export const PRESS_SCALE = 0.97;
export const STAGGER_MS = 55;
export const MAX_STAGGER = 8;

// Hex colors mirror the HSL tokens in global.css for native APIs that need color values.
export const PALETTE = {
  primary: '#372217',
  espresso2: '#553928',
  accent: '#D47535',
  accentSoft: '#FAE9DC',
  gold: '#E9AC3F',
  creamDeep: '#EDE5D9',
} as const;

const shadowColor = PALETTE.primary;
export const SHADOW: Record<'e1' | 'e2' | 'e3', ViewStyle> = {
  e1: { shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  e2: { shadowColor, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 5 },
  e3: { shadowColor, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.22, shadowRadius: 40, elevation: 9 },
};
