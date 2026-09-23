import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { View } from 'react-native';
import type { Shop } from '@/types/shop';
import { selectedShopMarkerIcon, userMarkerIcon } from '@/lib/map-markers.web';

interface ShopLocationMapProps {
  shop: Pick<Shop, 'lat' | 'lng' | 'name'>;
  userLocation: { lat: number; lng: number } | null;
}

export function ShopLocationMap({ shop, userLocation }: ShopLocationMapProps) {
  return (
    <View className="h-56 overflow-hidden rounded-xl">
      <MapContainer center={[shop.lat, shop.lng]} zoom={15} scrollWheelZoom className="h-full w-full" style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ShopMapViewport shop={shop} userLocation={userLocation} />
        <Marker position={[shop.lat, shop.lng]} title={shop.name} icon={selectedShopMarkerIcon} />
        {userLocation ? <Marker position={[userLocation.lat, userLocation.lng]} title="You" icon={userMarkerIcon} /> : null}
      </MapContainer>
    </View>
  );
}

function ShopMapViewport({ shop, userLocation }: ShopLocationMapProps) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.fitBounds([[shop.lat, shop.lng], [userLocation.lat, userLocation.lng]], { padding: [40, 40] });
      return;
    }
    map.setView([shop.lat, shop.lng], 15);
  }, [map, shop.lat, shop.lng, userLocation]);

  return null;
}
