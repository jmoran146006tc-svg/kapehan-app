import { Image, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import { useCompareStore } from '@/store/compareStore';
import { useShops } from '@/hooks/useShops';
import { isOpenNow } from '@/utils/hours';
import { formatPriceRange } from '@/utils/price';
import type { Shop } from '@/types/shop';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type Row = {
  label: string;
  value: (shop: Shop) => string;
  score?: (shop: Shop) => number | null;
  lowerWins?: boolean;
};

const BASE_ROWS: Row[] = [
  { label: 'Rating', value: (shop) => `★ ${shop.avgRating.toFixed(1)}`, score: (shop) => shop.avgRating },
  { label: 'Reviews', value: (shop) => String(shop.reviewCount), score: (shop) => shop.reviewCount },
  { label: 'Price', value: (shop) => formatPriceRange(shop.priceMin, shop.priceMax), score: (shop) => shop.priceMin, lowerWins: true },
  { label: 'Distance', value: () => 'Location-based', score: () => null, lowerWins: true },
  { label: 'Open Now', value: (shop) => isOpenNow(shop.hours) ? 'Open' : 'Closed' },
  { label: 'WiFi', value: (shop) => shop.hasWifi ? 'Yes' : 'No' },
];

function isBest(row: Row, shop: Shop, selected: Shop[]) {
  if (!row.score) return false;
  const score = row.score(shop);
  if (score == null) return false;
  const scores = selected.map(row.score).filter((value): value is number => value != null);
  if (scores.length < 2 || new Set(scores).size !== scores.length) return false;
  const best = row.lowerWins ? Math.min(...scores) : Math.max(...scores);
  return score === best;
}

export default function CompareScreen() {
  const { ids, toggle } = useCompareStore();
  const { shops } = useShops();
  const selected = shops.filter((shop) => ids.includes(shop.id));
  const tagRows: Row[] = [...new Set(selected.flatMap((shop) => shop.tags ?? []))].map((tag) => ({
    label: tag,
    value: (shop) => shop.tags?.includes(tag) ? 'Yes' : 'No',
  }));
  const rows = [...BASE_ROWS, ...tagRows];

  if (selected.length === 0) {
    return <View className="flex-1 items-center justify-center gap-3 bg-background p-6"><Text className="text-center text-muted-foreground">Tap “+ Compare” on two or three coffee shops first.</Text><Button onPress={() => router.replace('/(user)/search')}><Text>Browse shops</Text></Button></View>;
  }

  return (
    <View className="flex-1 bg-background">
      <View className="gap-1 bg-primary px-4 pb-5 pt-4">
        <Button size="icon" variant="ghost" className="-ml-2 self-start" onPress={() => router.back()}><Icon as={ArrowLeft} className="text-primary-foreground" /></Button>
        <Text className="text-2xl font-bold text-primary-foreground">Side-by-Side</Text>
        <Text className="text-sm text-primary-foreground/70">See which coffee shop fits you best</Text>
      </View>
      <ScrollView horizontal className="flex-1" contentContainerClassName="p-4">
        <View className="w-28 pt-28">
          {rows.map((row) => <Text key={row.label} className="min-h-14 border-b border-border py-4 font-semibold text-muted-foreground">{row.label}</Text>)}
        </View>
        {selected.map((shop) => (
          <View key={shop.id} className="w-40 border-l border-border">
            <View className="h-28 gap-1 px-2">
              {shop.photos[0] ? <Image source={{ uri: shop.photos[0] }} className="h-12 w-12 rounded-lg" /> : <View className="h-12 w-12 rounded-lg bg-secondary" />}
              <View className="flex-row items-start gap-1"><Text numberOfLines={1} className="flex-1 font-bold">{shop.name}</Text><Button size="sm" variant="ghost" className="h-6 w-6 px-0" onPress={() => toggle(shop.id)}><Icon as={X} size={14} /></Button></View>
              <Text numberOfLines={1} className="text-xs text-muted-foreground">{shop.description || 'Coffee shop in Tagum'}</Text>
            </View>
            {rows.map((row) => <View key={row.label} className={isBest(row, shop, selected) ? 'min-h-14 border-b border-l-4 border-accent bg-accent/10 px-2 py-4' : 'min-h-14 border-b border-border px-2 py-4'}><Text className="text-center text-sm">{row.value(shop)}</Text></View>)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
