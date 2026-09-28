import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/logo';
import { PALETTE } from '@/constants/theme';
import { cn } from '@/lib/utils';

export function GradientHeader({ children, compact = false, className }: { children: ReactNode; compact?: boolean; className?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[PALETTE.primary, PALETTE.espresso2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={cn('overflow-hidden rounded-b-[32px] px-4 pb-6', compact && 'pb-4', className)}
      style={{ paddingTop: Math.max(insets.top, 16) + (compact ? 4 : 12) }}>
      <View pointerEvents="none" className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/10" />
      <View pointerEvents="none" className="absolute -left-20 bottom-0 h-36 w-36 rounded-full bg-gold/10" />
      <View pointerEvents="none" className="absolute -bottom-8 -right-4 opacity-[0.06]">
        <Logo width={160} height={160} />
      </View>
      {children}
    </LinearGradient>
  );
}
