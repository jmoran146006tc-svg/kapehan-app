import { Image, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Star } from 'lucide-react-native';
import { useState } from 'react';
import { useShops } from '@/hooks/useShops';
import { useUserLocation } from '@/hooks/useUserLocation';
import type { Shop } from '@/types/shop';
import { haversineKm } from '@/utils/distance';
import { ShopsLocationMap } from '@/components/shops-location-map';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { goBack } from '@/lib/navigation';
import { Text } from '@/components/ui/text';

export default function MapScreen() {
  const { shops } = useShops();
  const location = useUserLocation();
  const [selected, setSelected] = useState<Shop | undefined>();
  const distanceKm = selected && location ? haversineKm(location.lat, location.lng, selected.lat, selected.lng) : null;

  return (
    <View className="flex-1 bg-background">
      <ShopsLocationMap shops={shops} selectedShopId={selected?.id} onSelect={setSelected} />
      <View className="absolute left-4 right-4 top-12 flex-row items-center gap-3">
        <Button size="icon" variant="secondary" className="rounded-full bg-card" onPress={() => goBack('/(user)')}><Icon as={ArrowLeft} /></Button>
        <Text className="flex-1 text-xl font-bold text-foreground">Explore Coffee Shops</Text>
      </View>
      {selected ? <Card className="absolute bottom-6 left-4 right-4 max-w-md py-3"><View className="flex-row items-center gap-3 px-4"><View className="h-16 w-16 overflow-hidden rounded-xl bg-secondary">{selected.photos[0] ? <Image source={{ uri: selected.photos[0] }} className="h-full w-full" /> : null}</View><View className="flex-1 gap-1"><Text className="font-bold">{selected.name}</Text><View className="flex-row items-center gap-2"><Icon as={Star} size={14} fill="currentColor" className="text-accent" /><Text className="text-sm">{selected.avgRating.toFixed(1)}</Text><Icon as={MapPin} size={14} className="text-muted-foreground" /><Text className="text-sm text-muted-foreground">{distanceKm == null ? 'Distance unavailable' : `${distanceKm.toFixed(1)} km away`}</Text></View></View></View><Button size="sm" className="mx-4 mt-3 self-start" onPress={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: selected.id } })}><Text>View Shop Page</Text></Button></Card> : <View className="absolute bottom-8 left-4 right-4 max-w-md rounded-2xl bg-card p-4"><Text className="text-center text-muted-foreground">Tap a pin to preview a coffee shop.</Text></View>}
    </View>
  );
}
