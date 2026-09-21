import { useMemo } from 'react';
import MapView, { Marker } from 'react-native-maps';
import type { Shop } from '@/types/shop';

interface ShopsLocationMapProps {
  shops: Shop[];
  selectedShopId?: string;
  onSelect: (shop: Shop) => void;
}

export function ShopsLocationMap({ shops, selectedShopId, onSelect }: ShopsLocationMapProps) {
  const region = useMemo(() => {
    const first = shops[0];
    return first
      ? { latitude: first.lat, longitude: first.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : { latitude: 7.4478, longitude: 125.8078, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  }, [shops]);

  return (
    <MapView className="flex-1" initialRegion={region}>
      {shops.map((shop) => <Marker key={shop.id} coordinate={{ latitude: shop.lat, longitude: shop.lng }} title={shop.name} pinColor={shop.id === selectedShopId ? '#D9722F' : '#6B4226'} onPress={() => onSelect(shop)} />)}
    </MapView>
  );
}
