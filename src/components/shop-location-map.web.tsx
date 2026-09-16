import { View } from 'react-native';
import type { Shop } from '@/types/shop';

export function ShopLocationMap({ shop }: {
  shop: Pick<Shop, 'lat' | 'lng' | 'name'>;
  userLocation: { lat: number; lng: number } | null;
}) {
  const embedUrl = `https://maps.google.com/maps?q=${shop.lat},${shop.lng}&z=15&output=embed`;

  return (
    <View className="h-56 rounded-xl overflow-hidden">
      <iframe src={embedUrl} title={`Map of ${shop.name}`} loading="lazy"
        style={{ width: '100%', height: '100%', border: 0 }} />
    </View>
  );
}