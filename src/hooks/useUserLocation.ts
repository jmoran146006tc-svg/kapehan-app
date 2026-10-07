import { useEffect } from 'react';
import { useLocationStore } from '@/store/locationStore';

export function useUserLocation() {
  return useUserLocationStatus().location;
}

export function useUserLocationStatus() {
  const location = useLocationStore((state) => state.location);
  const status = useLocationStore((state) => state.status);
  const request = useLocationStore((state) => state.request);
  useEffect(() => {
    if (status === 'unknown') void request();
  }, [request, status]);
  return { location, status, request };
}
