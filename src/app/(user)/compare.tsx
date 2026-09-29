import { AnimatedView } from '@/components/ui/animated';
import { Image, ScrollView, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Star, X } from 'lucide-react-native';
import { useCompareStore } from '@/store/compareStore';
import { useShops } from '@/hooks/useShops';
import { useUserLocation } from '@/hooks/useUserLocation';
import { GradientHeader } from '@/components/gradient-header';
import { isOpenNow } from '@/utils/hours';
import { haversineKm } from '@/utils/distance';
import { formatPriceRange } from '@/utils/price';
import type { Shop } from '@/types/shop';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/empty-state';
import { cloudinaryImageUrl } from '@/lib/cloudinary';
import { goBack } from '@/lib/navigation';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Skeleton } from '@/components/ui/skeleton';
import { enter } from '@/lib/motion';
import { MarqueeText } from '@/components/ui/marquee-text';

function CompareHeader({ subtitle }: { subtitle?: string }) {
  return (
    <GradientHeader compact>
      <View className="mx-auto w-full max-w-2xl flex-row items-center gap-3">
        <PressableScale className="h-11 w-11 items-center justify-center rounded-full bg-card/10" onPress={() => goBack('/(user)')} accessibilityLabel="Go back">
          <Icon as={ArrowLeft} size={21} className="text-primary-foreground" />
        </PressableScale>
        <View className="flex-1">
          <Text className="font-display text-xl text-primary-foreground">Side-by-Side</Text>
          {subtitle ? <Text className="text-sm text-primary-foreground/75">{subtitle}</Text> : null}
        </View>
      </View>
    </GradientHeader>
  );
}

type Row = {
  label: string;
  value: (shop: Shop) => string;
  score?: (shop: Shop) => number | null;
  lowerWins?: boolean;
};

const BASE_ROWS: Row[] = [
  { label: 'Rating', value: (shop) => shop.avgRating.toFixed(1), score: (shop) => shop.avgRating },
  { label: 'Reviews', value: (shop) => String(shop.reviewCount), score: (shop) => shop.reviewCount },
  { label: 'Price', value: (shop) => formatPriceRange(shop.priceMin, shop.priceMax), score: (shop) => shop.priceMin, lowerWins: true },
  { label: 'Open Now', value: (shop) => isOpenNow(shop.hours) ? 'Open' : 'Closed' },
  { label: 'WiFi', value: (shop) => shop.hasWifi ? 'Yes' : 'No' },
];

const LABEL_COL_WIDTH = 112;
// This keeps two columns usable on a 375px phone while retaining a 3-column
// fallback to horizontal scrolling on compact screens.
const MIN_SHOP_COL_WIDTH = 110;
const HORIZONTAL_PADDING = 32;

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
  const { width } = useWindowDimensions();
  const location = useUserLocation();
  const ids = useCompareStore((state) => state.ids);
  const toggle = useCompareStore((state) => state.toggle);
  const { shops, loading } = useShops();
  const shopsById = new Map(shops.map((shop) => [shop.id, shop]));
  const selected = ids.map((id) => shopsById.get(id)).filter((shop): shop is Shop => Boolean(shop));
  const tagRows: Row[] = [...new Set(selected.flatMap((shop) => shop.tags ?? []))].map((tag) => ({
    label: tag,
    value: (shop) => shop.tags?.includes(tag) ? 'Yes' : 'No',
  }));
  const distanceRow: Row = {
    label: 'Distance',
    value: (shop) => {
      const km = location ? haversineKm(location.lat, location.lng, shop.lat, shop.lng) : null;
      return km == null ? 'Distance unavailable' : `${km.toFixed(1)} km`;
    },
    score: (shop) => location ? haversineKm(location.lat, location.lng, shop.lat, shop.lng) : null,
    lowerWins: true,
  };
  const rows = [...BASE_ROWS.slice(0, 3), distanceRow, ...BASE_ROWS.slice(3), ...tagRows];
  const neededWidth = LABEL_COL_WIDTH + selected.length * MIN_SHOP_COL_WIDTH;
  const needsHorizontalScroll = neededWidth > width - HORIZONTAL_PADDING;

  if (loading && ids.length > 0) {
    return <View className="flex-1 bg-background"><CompareHeader /><View className="gap-3 p-6"><Skeleton className="h-28 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></View></View>;
  }

  if (selected.length === 0) {
    return <View className="flex-1 bg-background"><CompareHeader /><View className="flex-1 justify-center gap-3 p-6"><EmptyState title="Find your favorite cup" description="Add two or three shops to see them side by side." /><Button onPress={() => router.replace('/(user)/search')}><Text>Browse shops</Text></Button></View></View>;
  }

  return (
    <View className="flex-1 bg-background">
      <CompareHeader subtitle="See which coffee shop fits you best" />
      <ScrollView className="flex-1" contentContainerClassName="mx-auto w-full max-w-2xl p-4">
        <ScrollView horizontal={needsHorizontalScroll} scrollEnabled={needsHorizontalScroll}>
          <View style={{ flexDirection: 'row', width: needsHorizontalScroll ? neededWidth : '100%' }}>
            <View style={{ width: LABEL_COL_WIDTH }} className="pt-28">
              {rows.map((row) => <Text key={row.label} className="min-h-14 border-b border-border py-4 font-semibold text-muted-foreground">{row.label}</Text>)}
            </View>
            {selected.map((shop, index) => (
              <AnimatedView key={shop.id} entering={enter(index)} style={needsHorizontalScroll ? { width: MIN_SHOP_COL_WIDTH } : { flex: 1, minWidth: 0 }} className="border-l border-border">
                <View className="h-28 gap-1 px-2">
                  {shop.photos[0] ? <Image source={{ uri: cloudinaryImageUrl(shop.photos[0], 160) }} className="h-12 w-12 rounded-lg" /> : <View className="h-12 w-12 rounded-lg bg-secondary" />}
                  <View className="flex-row items-start gap-1"><View className="min-w-0 flex-1">
                    <MarqueeText className="font-bold">{shop.name}</MarqueeText>
                  </View>
                    <Button size="sm" variant="ghost" className="h-6 w-6 px-0" onPress={() => toggle(shop.id)}><Icon as={X} size={14} /></Button></View>
                  <Text numberOfLines={1} className="text-xs text-muted-foreground">{shop.description || 'Coffee shop in Tagum'}</Text>
                </View>
                {rows.map((row) => <View key={row.label} className={isBest(row, shop, selected) ? 'min-h-14 rounded-md border-2 border-accent bg-accent-soft px-2 py-[15px]' : 'min-h-14 border-b border-border px-2 py-4'}>{row.label === 'Rating' ? <View className="flex-row items-center justify-center gap-1"><Icon as={Star} size={14} fill="currentColor" className="text-gold" /><Text className="text-center text-sm">{row.value(shop)}</Text></View> : <View className="flex-row items-center justify-center gap-1">{isBest(row, shop, selected) ? <Icon as={Star} size={12} fill="currentColor" className="text-gold" /> : null}<Text className="text-center text-sm">{row.value(shop)}</Text></View>}</View>)}
              </AnimatedView>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
