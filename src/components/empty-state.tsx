import { View } from 'react-native';
import { Logo } from '@/components/logo';
import { Text } from '@/components/ui/text';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <View className="flex-row items-start gap-3 rounded-2xl border border-border bg-card p-4">
    <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary"><Logo width={32} height={32} accessibilityLabel="Kapehan" /></View>
    <View className="min-w-0 flex-1 gap-1"><Text className="font-serif text-lg font-bold text-primary">{title}</Text><Text className="text-sm text-muted-foreground">{description}</Text></View>
  </View>;
}
