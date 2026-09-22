import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface StatTileProps {
  value: string | number;
  label: string;
  className?: string;
  tone?: 'default' | 'onDark';
}

export function StatTile({ value, label, className, tone = 'default' }: StatTileProps) {
  const onDark = tone === 'onDark';
  return (
    <View className={cn('flex-1 items-center rounded-xl border border-border bg-card px-2 py-3', className)}>
      <Text className={cn('text-xl font-bold', onDark && 'text-primary-foreground')}>{value}</Text>
      <Text className={cn('mt-1 text-center text-xs text-muted-foreground', onDark && 'text-primary-foreground/70')}>{label}</Text>
    </View>
  );
}
