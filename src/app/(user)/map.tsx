import { Image, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Star } from 'lucide-react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { ReduceMotion, SlideInDown } from 'react-native-reanimated';
import { useShops } from '@/hooks/useShops';
import { useUserLocation } from '@/hooks/useUserLocation';
import type { Shop } from '@/types/shop';
import { haversineKm } from '@/utils/distance';
import { ShopsLocationMap } from '@/components/shops-location-map';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { cloudinaryImageUrl } from '@/lib/cloudinary';
import { goBack } from '@/lib/navigation';

export default function MapScreen() {
  const { shops } = useShops();
  const location = useUserLocation();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Shop | undefined>();
  const distanceKm = selected && location ? haversineKm(location.lat, location.lng, selected.lat, selected.lng) : null;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border/60 bg-card/90 px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <PressableScale className="h-11 w-11 items-center justify-center rounded-full bg-accent-soft" onPress={() => goBack('/(user)')} accessibilityLabel="Go back">
          <Icon as={ArrowLeft} size={21} className="text-primary" />
        </PressableScale>
        <Text className="font-display text-xl text-primary">Explore Coffee Shops</Text>
      </View>
      <ShopsLocationMap shops={shops} selectedShopId={selected?.id} onSelect={setSelected} />
      {selected ? (
        <Animated.View key={selected.id} entering={SlideInDown.springify().damping(18).reduceMotion(ReduceMotion.System)} className="absolute bottom-6 left-4 right-4 max-w-md">
          <Card className="py-3">
            <View className="flex-row items-center gap-3 px-4">
              <View className="h-16 w-16 overflow-hidden rounded-xl bg-secondary">
                {selected.photos[0] ? <Image source={{ uri: cloudinaryImageUrl(selected.photos[0], 200) }} className="h-full w-full" /> : null}
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-display text-lg">{selected.name}</Text>
                <View className="flex-row items-center gap-2">
                  <Icon as={Star} size={14} fill="currentColor" className="text-gold" />
                  <Text className="text-sm">{selected.avgRating.toFixed(1)}</Text>
                  <Icon as={MapPin} size={14} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">{distanceKm == null ? 'Distance unavailable' : `${distanceKm.toFixed(1)} km away`}</Text>
                </View>
              </View>
            </View>
            <Button size="sm" className="mx-4 mt-3 self-start" onPress={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: selected.id } })}>
              <Text>View Shop Page</Text>
            </Button>
          </Card>
        </Animated.View>
      ) : (
        <View className="absolute bottom-8 left-4 right-4 max-w-md rounded-2xl bg-card p-4">
          <Text className="text-center text-muted-foreground">Tap a pin to preview a coffee shop.</Text>
        </View>
      )}
    </View>
  );
}
