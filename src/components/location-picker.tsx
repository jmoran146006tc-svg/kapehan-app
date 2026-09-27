import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MAP_MARKER_COLORS } from '@/constants/map';
import { MapPinMarker } from '@/components/map-pin-marker';

type Coordinates = { lat: number; lng: number };

export function LocationPicker({ value, onChange }: { value: Coordinates | null; onChange: (value: Coordinates) => void }) {
  const map = useRef<MapView>(null);
  const point = value ?? { lat: 7.4478, lng: 125.8078 };
  const latitude = value?.lat;
  const longitude = value?.lng;

  useEffect(() => {
    if (latitude != null && longitude != null) map.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 250);
  }, [latitude, longitude]);

  return <View className="h-56 overflow-hidden rounded-xl border border-border bg-secondary">
    <MapView ref={map} style={{ flex: 1 }} initialRegion={{ latitude: point.lat, longitude: point.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }} onPress={(event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => onChange({ lat: event.nativeEvent.coordinate.latitude, lng: event.nativeEvent.coordinate.longitude })}>
      <Marker draggable coordinate={{ latitude: point.lat, longitude: point.lng }} anchor={{ x: 0.5, y: 1 }} onDragEnd={(event) => onChange({ lat: event.nativeEvent.coordinate.latitude, lng: event.nativeEvent.coordinate.longitude })}><MapPinMarker color={MAP_MARKER_COLORS.selectedShop} size={42} /></Marker>
    </MapView>
  </View>;
}
