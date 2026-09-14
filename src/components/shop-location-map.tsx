import { useRef, useEffect } from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Shop } from '@/types/shop';

export function ShopLocationMap({ shop, userLocation }: {
  shop: Pick<Shop, 'lat' | 'lng' | 'name'>;
  userLocation: { lat: number; lng: number } | null;
}) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      [{ latitude: shop.lat, longitude: shop.lng }, { latitude: userLocation.lat, longitude: userLocation.lng }],
      { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true }
    );
  }, [userLocation, shop.lat, shop.lng]);

  return (
    <View className="h-56 rounded-xl overflow-hidden">
      <MapView ref={mapRef} style={{ flex: 1 }}
        initialRegion={{ latitude: shop.lat, longitude: shop.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
        <Marker coordinate={{ latitude: shop.lat, longitude: shop.lng }} title={shop.name} pinColor="#7c4a1e" />
        {userLocation && <Marker coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }} title="You" pinColor="#3b82f6" />}
      </MapView>
    </View>
  );
}