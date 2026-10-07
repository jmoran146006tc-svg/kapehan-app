import { create } from 'zustand';
import * as Location from 'expo-location';

type LocationStatus = 'unknown' | 'loading' | 'granted' | 'denied' | 'error';
interface LocationState {
  location: { lat: number; lng: number } | null;
  status: LocationStatus;
  request: () => Promise<void>;
}

let inFlight: Promise<void> | null = null;

export const useLocationStore = create<LocationState>((set, get) => ({
  location: null,
  status: 'unknown',
  request: () => {
    if (inFlight) return inFlight;
    if (get().status === 'granted') return Promise.resolve();
    inFlight = Promise.resolve().then(async () => {
      set({ status: 'loading' });
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          set({ location: null, status: 'denied' });
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        set({ location: { lat: position.coords.latitude, lng: position.coords.longitude }, status: 'granted' });
      } catch {
        set({ location: null, status: 'error' });
      } finally {
        inFlight = null;
      }
    });
    return inFlight;
  },
}));
