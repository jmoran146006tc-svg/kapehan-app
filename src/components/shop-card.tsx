import { Image, Platform, Pressable, View } from 'react-native';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useCompareStore } from '@/store/compareStore';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Heart, MapPin, Star } from 'lucide-react-native';
import type { Shop } from '@/types/shop';
import { isOpenNow } from '@/utils/hours';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type ShopCardShop = Shop & { distanceKm?: number | null; openNow?: boolean };

interface ShopCardProps {
  shop: ShopCardShop;
  onPress: () => void;
  saved?: boolean;
  saving?: boolean;
  onToggleSaved?: () => void;
  compared?: boolean;
  onToggleCompare?: () => void;
}

export function ShopCard({ shop, onPress, saved = false, saving = false, onToggleSaved, compared = false, onToggleCompare }: ShopCardProps) {
  const { showToast } = useToast();
  const compareCount = useCompareStore((state) => state.ids.length);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const openNow = shop.openNow ?? isOpenNow(shop.hours);

  return (
    <Animated.View style={animatedStyle}>
    <Card className={cn('overflow-hidden py-0', Platform.select({ web: 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md' }))}>
      <Pressable onPress={onPress} onPressIn={() => { scale.set(withSpring(0.97, { reduceMotion: ReduceMotion.System })); }} onPressOut={() => { scale.set(withSpring(1, { reduceMotion: ReduceMotion.System })); }} className="gap-3">
        <View className="relative h-40 bg-secondary">
          {shop.photos[0] ? (
            <Image source={{ uri: shop.photos[0] }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center bg-secondary">
              <Text className="text-muted-foreground">No photo yet</Text>
            </View>
          )}
          <View className="absolute bottom-3 left-3 flex-row gap-2">
            <Badge className={openNow ? 'border-transparent bg-green-100' : 'border-transparent bg-secondary'} variant="secondary"><Text className={openNow ? 'text-green-800' : undefined}>{openNow ? 'Open' : 'Closed'}</Text></Badge>
            <Badge className="border-transparent bg-card" variant="secondary"><Text>{shop.hasWifi ? 'WiFi' : 'No WiFi'}</Text></Badge>
          </View>
        </View>
        <CardHeader className="gap-1 pb-1">
          <CardTitle>{shop.name}</CardTitle>
          {shop.description ? <CardDescription numberOfLines={1}>{shop.description}</CardDescription> : null}
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1">
              <Icon as={Star} size={14} fill="currentColor" className="text-accent" />
              <Text className="text-sm">{shop.avgRating.toFixed(1)} ({shop.reviewCount})</Text>
            </View>
            {shop.distanceKm != null ? (
              <View className="flex-row items-center gap-1">
                <Icon as={MapPin} size={14} className="text-muted-foreground" />
                <Text className="text-sm text-muted-foreground">{shop.distanceKm.toFixed(1)} km</Text>
              </View>
            ) : null}
          </View>
        </CardHeader>
      </Pressable>

      {onToggleSaved ? (
        <Button size="icon" variant="secondary" className="absolute right-3 top-3 rounded-full bg-card/95" loading={saving} loadingLabel="…" onPress={onToggleSaved}>
          <Icon as={Heart} size={18} fill={saved ? 'currentColor' : 'none'} className={saved ? 'text-accent' : 'text-foreground'} />
        </Button>
      ) : null}

      {onToggleCompare ? (
        <Button size="sm" variant={compared ? 'default' : 'outline'} className="mx-6 mb-5 self-start rounded-full" onPress={() => { if (!compared && compareCount >= 3) { showToast({ type: 'error', message: 'Compare up to three shops at a time.' }); return; } onToggleCompare(); showToast({ type: 'success', message: compared ? 'Removed from comparison' : 'Added to comparison' }); }}>
          <Text>{compared ? 'Added to compare' : '+ Compare'}</Text>
        </Button>
      ) : null}
    </Card>
    </Animated.View>
  );
}
