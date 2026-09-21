import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import type { Shop } from '@/types/shop';
import { Text } from '@/components/ui/text';

interface ShopsLocationMapProps {
  shops: Shop[];
  selectedShopId?: string;
  onSelect: (shop: Shop) => void;
}

export function ShopsLocationMap({ shops, selectedShopId, onSelect }: ShopsLocationMapProps) {
  const center = useMemo(() => shops.find((shop) => shop.id === selectedShopId) ?? shops[0], [selectedShopId, shops]);
  const embedUrl = center ? `https://maps.google.com/maps?q=${center.lat},${center.lng}&z=14&output=embed` : undefined;

  return (
    <View className="flex-1 bg-secondary">
      {embedUrl ? <iframe src={embedUrl} title="Coffee shops in Tagum" style={{ width: '100%', height: '100%', border: 0, position: 'absolute' }} /> : null}
      <View className="flex-row flex-wrap gap-2 p-3">
        {shops.map((shop) => <Pressable key={shop.id} className={shop.id === selectedShopId ? 'rounded-full bg-accent px-3 py-1.5' : 'rounded-full bg-card px-3 py-1.5'} onPress={() => onSelect(shop)}><Text className={shop.id === selectedShopId ? 'text-xs text-white' : 'text-xs'}>{shop.name}</Text></Pressable>)}
      </View>
    </View>
  );
}
