import { ScrollView, View, Image } from 'react-native';
import { useCompareStore } from '@/store/compareStore';
import { useShops } from '@/hooks/useShops';
import { isOpenNow } from '@/utils/hours';
import { Text } from '@/components/ui/text';
import type { Shop } from '@/types/shop';

const ROWS: { label: string; get: (s: Shop) => string }[] = [
  { label: 'Price', get: (s) => s.priceRange },
  { label: 'WiFi', get: (s) => s.wifiRating },
  { label: 'Open now', get: (s) => (isOpenNow(s.hours) ? 'Open' : 'Closed') },
  { label: 'Rating', get: (s) => `${s.avgRating?.toFixed(1) ?? '—'} (${s.reviewCount ?? 0})` },
];

export default function CompareScreen() {
  const { ids } = useCompareStore();
  const { shops } = useShops();
  const selected = shops.filter((s) => ids.includes(s.id));

  if (selected.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-4">
        <Text className="text-muted-foreground">Tap "+ Compare" on a couple of shops in Search first.</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal className="flex-1 bg-background" contentContainerClassName="p-4">
      <View className="w-28">
        <View className="h-32" />
        {ROWS.map((r) => <Text key={r.label} className="h-12 font-medium text-muted-foreground">{r.label}</Text>)}
      </View>
      {selected.map((shop) => (
        <View key={shop.id} className="w-36 border-l border-border pl-2">
          <View className="h-32 items-center justify-end pb-2">
            {shop.photos[0] && <Image source={{ uri: shop.photos[0] }} className="w-16 h-16 rounded-full mb-1" />}
            <Text numberOfLines={1} className="font-semibold text-center">{shop.name}</Text>
          </View>
          {ROWS.map((r) => <Text key={r.label} className="h-12 text-center">{r.get(shop)}</Text>)}
        </View>
      ))}
    </ScrollView>
  );
}