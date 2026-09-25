import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

export function ShopCardSkeleton() {
  return <View className="overflow-hidden rounded-2xl border border-border bg-card pb-4">
    <Skeleton className="h-36 w-full rounded-none" />
    <View className="gap-3 px-4 pt-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-1/3 rounded-full" />
    </View>
  </View>;
}
