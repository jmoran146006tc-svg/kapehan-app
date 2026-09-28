import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { Href } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { goBack } from '@/lib/navigation';
import { GradientHeader } from '@/components/gradient-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { StatusBar } from 'expo-status-bar';

export function ScreenHeader({ title, fallbackHref, right, subtitle }: {
  title: string;
  fallbackHref: Href;
  right?: ReactNode;
  subtitle?: string;
}) {
  return <GradientHeader compact>
    <StatusBar style="light" />
    <View className="mx-auto w-full max-w-2xl flex-row items-center gap-3">
      <PressableScale className="h-11 w-11 items-center justify-center rounded-full bg-card/10" accessibilityLabel="Go back" onPress={() => goBack(fallbackHref)}>
        <Icon as={ArrowLeft} size={21} className="text-primary-foreground" />
      </PressableScale>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-display text-xl text-primary-foreground">{title}</Text>
        {subtitle ? <Text className="text-sm text-primary-foreground/75">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  </GradientHeader>;
}
