import { AnimatedView } from '@/components/ui/animated';
import { View } from 'react-native';
import { Logo } from '@/components/logo';
import { Text } from '@/components/ui/text';
import { enter } from '@/lib/motion';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <AnimatedView entering={enter()} className="flex-row items-start gap-3 rounded-2xl bg-card p-4">
    <View className="h-12 w-12 items-center justify-center rounded-full bg-accent-soft"><Logo width={32} height={32} accessibilityLabel="Kapehan" /></View>
    <View className="min-w-0 flex-1 gap-1"><Text className="font-display text-lg text-primary">{title}</Text><Text className="text-sm text-muted-foreground">{description}</Text></View>
  </AnimatedView>;
}
