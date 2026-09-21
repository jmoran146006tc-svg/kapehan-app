import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface StatTileProps {
  value: string | number;
  label: string;
  className?: string;
}

export function StatTile({ value, label, className }: StatTileProps) {
  return (
    <View className={cn('flex-1 items-center rounded-xl border border-border bg-card px-2 py-3', className)}>
      <Text className="text-xl font-bold">{value}</Text>
      <Text className="mt-1 text-center text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}
