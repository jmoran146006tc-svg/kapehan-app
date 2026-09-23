import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { View } from 'react-native';
import type { Shop } from '@/types/shop';
import { selectedShopMarkerIcon, shopMarkerIcon } from '@/lib/map-markers.web';

interface ShopsLocationMapProps {
  shops: Shop[];
  selectedShopId?: string;
  onSelect: (shop: Shop) => void;
}

export function ShopsLocationMap({ shops, selectedShopId, onSelect }: ShopsLocationMapProps) {
  const mappableShops = useMemo(
    () => shops.filter((shop) => Number.isFinite(shop.lat) && Number.isFinite(shop.lng)),
    [shops],
  );

  return (
    <View className="flex-1 bg-secondary">
      <MapContainer center={[7.4478, 125.8078]} zoom={13} scrollWheelZoom className="h-full w-full" style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport shops={mappableShops} selectedShopId={selectedShopId} />
        {mappableShops.map((shop) => (
          <Marker
            key={shop.id}
            position={[shop.lat, shop.lng]}
            eventHandlers={{ click: () => onSelect(shop) }}
            icon={shop.id === selectedShopId ? selectedShopMarkerIcon : shopMarkerIcon}
          />
        ))}
      </MapContainer>
    </View>
  );
}

function MapViewport({ shops, selectedShopId }: Pick<ShopsLocationMapProps, 'shops' | 'selectedShopId'>) {
  const map = useMap();

  useEffect(() => {
    const selected = shops.find((shop) => shop.id === selectedShopId);
    if (selected) {
      map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 15));
      return;
    }

    if (shops.length === 1) {
      map.setView([shops[0].lat, shops[0].lng], 14);
      return;
    }

    if (shops.length > 1) {
      map.fitBounds(shops.map((shop) => [shop.lat, shop.lng]), { padding: [40, 40] });
    }
  }, [map, selectedShopId, shops]);

  return null;
}
