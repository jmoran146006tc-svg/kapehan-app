import { Image, Pressable, View } from 'react-native';
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
  const openNow = shop.openNow ?? isOpenNow(shop.hours);

  return (
    <Card className="overflow-hidden py-0">
      <Pressable onPress={onPress} className="gap-3">
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
        <Button size="sm" variant={compared ? 'default' : 'outline'} className="mx-6 mb-5 self-start rounded-full" onPress={onToggleCompare}>
          <Text>{compared ? 'Added to compare' : '+ Compare'}</Text>
        </Button>
      ) : null}
    </Card>
  );
}
