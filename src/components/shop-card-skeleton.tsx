import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

export function ShopCardSkeleton() {
  return <View className="overflow-hidden rounded-3xl bg-card pb-4">
    <Skeleton className="h-52 w-full rounded-none" />
    <View className="gap-3 px-4 pt-4">
      <Skeleton className="h-4 w-3/4" />
      <View className="flex-row gap-2">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="ml-auto h-9 w-24 rounded-full" />
      </View>
    </View>
  </View>;
}
