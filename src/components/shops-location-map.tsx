import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Text } from '@/components/ui/text';
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
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (loaded) return;
    const timeout = setTimeout(() => setTimedOut(true), 20000);
    return () => clearTimeout(timeout);
  }, [attempt, loaded]);
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
    <View className="flex-1 bg-secondary">
      <MapView key={attempt} ref={mapRef} provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined} style={StyleSheet.absoluteFill} initialRegion={region} onMapLoaded={() => { setLoaded(true); setTimedOut(false); }} onMapReady={() => { setReady(true); frameShops(); }} onLayout={() => { if (ready) frameShops(); }}>
        {shops.map((shop) => <Marker key={`${shop.id}-${shop.id === selectedShopId ? 'selected' : 'default'}`} coordinate={{ latitude: shop.lat, longitude: shop.lng }} title={shop.name} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false} onPress={() => onSelect(shop)}><MapPinMarker color={shop.id === selectedShopId ? MAP_MARKER_COLORS.selectedShop : MAP_MARKER_COLORS.shop} size={shop.id === selectedShopId ? 42 : 34} /></Marker>)}
      </MapView>
      {timedOut ? <View className="absolute inset-0 items-center justify-center bg-background/95 px-6"><Text className="text-center font-semibold">Map could not load</Text><Text className="mt-2 text-center text-sm text-muted-foreground">Check your connection and try again.</Text><Pressable className="mt-4 rounded-full bg-primary px-5 py-2" onPress={() => { setLoaded(false); setTimedOut(false); setReady(false); setAttempt((value) => value + 1); }}><Text className="font-semibold text-primary-foreground">Retry map</Text></Pressable></View> : null}
    </View>
  );
}
