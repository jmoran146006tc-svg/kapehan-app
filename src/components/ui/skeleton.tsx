import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: ViewProps) {
  return <View className={cn('rounded-xl bg-secondary opacity-70', className)} {...props} />;
}
