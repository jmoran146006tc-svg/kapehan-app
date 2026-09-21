import { create } from 'zustand';
import type { PriceBucket } from '@/utils/price';
import type { ShopTag } from '@/constants/tags';

// These are transient discovery controls, so they deliberately stay out of Firestore.

interface FilterValues {
  search: string;
  priceBuckets: PriceBucket[];
  wifiOnly: boolean;
  tags: ShopTag[];
  openNowOnly: boolean;
  maxDistanceKm: number | null;
}

interface FilterState extends FilterValues {
  setFilter: <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => void;
  toggleArrayFilter: <K extends 'priceBuckets' | 'tags'>(key: K, value: FilterValues[K][number]) => void;
  reset: () => void;
}

const defaults = {
  search: '',
  priceBuckets: [] as PriceBucket[],
  wifiOnly: false,
  tags: [] as ShopTag[],
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
