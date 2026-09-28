import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { goBack } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export function ScreenHeader({ title, fallbackHref, right, subtitle }: {
  title: string;
  fallbackHref: Href;
  right?: ReactNode;
  subtitle?: string;
}) {
  const insets = useSafeAreaInsets();
  return <View className="w-full bg-primary px-4 pb-4" style={{ paddingTop: Math.max(insets.top, 16) }}>
    <View className="mx-auto w-full max-w-2xl flex-row items-center gap-3">
      <Button size="icon" variant="ghost" className="rounded-full" accessibilityLabel="Go back" onPress={() => goBack(fallbackHref)}>
        <Icon as={ArrowLeft} size={21} className="text-primary-foreground" />
      </Button>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-display text-xl text-primary-foreground">{title}</Text>
        {subtitle ? <Text className="text-sm text-primary-foreground/75">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  </View>;
}
