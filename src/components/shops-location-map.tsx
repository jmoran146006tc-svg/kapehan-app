import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import type { Shop } from '@/types/shop';
import { MAP_MARKER_COLORS } from '@/constants/map';
import { MapPinMarker } from '@/components/map-pin-marker';

interface ShopsLocationMapProps {
  shops: Shop[];
  selectedShopId?: string;
  onSelect: (shop: Shop) => void;
}

export function ShopsLocationMap({ shops, selectedShopId, onSelect }: ShopsLocationMapProps) {
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const coordinates = useMemo(
    () => shops.filter((shop) => Number.isFinite(shop.lat) && Number.isFinite(shop.lng)).map((shop) => ({ latitude: shop.lat, longitude: shop.lng })),
    [shops],
  );
  const region = useMemo(() => {
    const first = shops[0];
    return first
      ? { latitude: first.lat, longitude: first.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : { latitude: 7.4478, longitude: 125.8078, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  }, [shops]);
  const frameShops = useCallback(() => {
    if (coordinates.length > 1) mapRef.current?.fitToCoordinates(coordinates, { animated: false, edgePadding: { top: 120, right: 48, bottom: 160, left: 48 } });
  }, [coordinates]);
  useEffect(() => {
    if (ready) frameShops();
  }, [frameShops, ready]);

  return (
    <MapView ref={mapRef} className="flex-1" initialRegion={region} onMapReady={() => { setReady(true); frameShops(); }} onLayout={() => { if (ready) frameShops(); }}>
      {shops.map((shop) => <Marker key={shop.id} coordinate={{ latitude: shop.lat, longitude: shop.lng }} title={shop.name} anchor={{ x: 0.5, y: 1 }} onPress={() => onSelect(shop)}><MapPinMarker color={shop.id === selectedShopId ? MAP_MARKER_COLORS.selectedShop : MAP_MARKER_COLORS.shop} size={shop.id === selectedShopId ? 42 : 34} /></Marker>)}
    </MapView>
  );
}
