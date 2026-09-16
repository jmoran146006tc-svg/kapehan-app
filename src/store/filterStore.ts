import { create } from 'zustand';
import type { Shop } from '@/types/shop';
import type { PriceBucket } from '@/utils/price';

// These are transient discovery controls, so they deliberately stay out of Firestore.

interface FilterValues {
  search: string;
  priceBuckets: PriceBucket[];
  wifiRating: Shop['wifiRating'][];
  openNowOnly: boolean;
  maxDistanceKm: number | null;
}

interface FilterState extends FilterValues {
  setFilter: <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => void;
  toggleArrayFilter: <K extends 'priceBuckets' | 'wifiRating'>(key: K, value: FilterValues[K][number]) => void;
  reset: () => void;
}

const defaults = {
  search: '',
  priceBuckets: [] as PriceBucket[],
  wifiRating: [] as Shop['wifiRating'][],
  openNowOnly: false,
  maxDistanceKm: null as number | null,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...defaults,
  setFilter: (key, value) => set({ [key]: value } as Partial<FilterValues>),
  toggleArrayFilter: (key, value) =>
    set((s) => {
      const arr = s[key] as string[];
      return { [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] } as Partial<FilterValues>;
    }),
  reset: () => set(defaults),
}));
