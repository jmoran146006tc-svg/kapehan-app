import { Image, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Star } from 'lucide-react-native';
import { useState } from 'react';
import { useShops } from '@/hooks/useShops';
import type { Shop } from '@/types/shop';
import { ShopsLocationMap } from '@/components/shops-location-map';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export default function MapScreen() {
  const { shops } = useShops();
  const [selected, setSelected] = useState<Shop | undefined>();

  return (
    <View className="flex-1 bg-background">
      <ShopsLocationMap shops={shops} selectedShopId={selected?.id} onSelect={setSelected} />
      <View className="absolute left-4 right-4 top-12 flex-row items-center gap-2">
        <Button size="icon" variant="secondary" className="rounded-full bg-card" onPress={() => router.back()}><Icon as={ArrowLeft} /></Button>
        <View className="flex-1 rounded-full bg-card px-4 py-3 shadow-sm shadow-black/10"><Text className="font-semibold">Explore coffee shops</Text></View>
      </View>
      {selected ? <Card className="absolute bottom-6 left-4 right-4 flex-row items-center gap-3 py-3" onTouchEnd={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: selected.id } })}><View className="ml-4 h-16 w-16 overflow-hidden rounded-xl bg-secondary">{selected.photos[0] ? <Image source={{ uri: selected.photos[0] }} className="h-full w-full" /> : null}</View><View className="flex-1 gap-1"><Text className="font-bold">{selected.name}</Text><View className="flex-row items-center gap-2"><Icon as={Star} size={14} className="text-accent" /><Text className="text-sm">{selected.avgRating.toFixed(1)}</Text><Icon as={MapPin} size={14} className="text-muted-foreground" /><Text className="text-sm text-muted-foreground">Open shop</Text></View></View><Button size="sm" className="mr-4" onPress={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: selected.id } })}><Text>View</Text></Button></Card> : <View className="absolute bottom-8 left-4 right-4 rounded-2xl bg-card p-4"><Text className="text-center text-muted-foreground">Tap a pin to preview a coffee shop.</Text></View>}
    </View>
  );
}
