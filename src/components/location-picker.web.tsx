import { useEffect } from 'react';
import { View } from 'react-native';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { selectedShopMarkerIcon } from '@/lib/map-markers.web';

type Coordinates = { lat: number; lng: number };
type PickerProps = { value: Coordinates | null; onChange: (value: Coordinates) => void };

export function LocationPicker({ value, onChange }: PickerProps) {
  const point = value ?? { lat: 7.4478, lng: 125.8078 };
  return <View className="h-56 overflow-hidden rounded-xl border border-border bg-secondary">
    <MapContainer center={[point.lat, point.lng]} zoom={15} scrollWheelZoom className="h-full w-full" style={{ height: '100%', width: '100%' }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <PickerEvents value={value} onChange={onChange} />
      <Marker draggable position={[point.lat, point.lng]} icon={selectedShopMarkerIcon} eventHandlers={{ dragend: (event) => { const next = event.target.getLatLng(); onChange({ lat: next.lat, lng: next.lng }); } }} />
    </MapContainer>
  </View>;
}

function PickerEvents({ value, onChange }: PickerProps) {
  const map = useMapEvents({ click: (event) => onChange({ lat: event.latlng.lat, lng: event.latlng.lng }) });
  const latitude = value?.lat;
  const longitude = value?.lng;
  useEffect(() => { if (latitude != null && longitude != null) map.setView([latitude, longitude]); }, [map, latitude, longitude]);
  return null;
}
