import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export function useUserLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({});
      if (!cancelled) setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return location;
}