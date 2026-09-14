import { create } from 'zustand';

interface FilterState {
  search: string;
  priceRange: string[];
  wifiRating: string[];
  openNowOnly: boolean;
  maxDistanceKm: number | null;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  toggleArrayFilter: (key: 'priceRange' | 'wifiRating', value: string) => void;
  reset: () => void;
}

const defaults = {
  search: '',
  priceRange: [] as string[],
  wifiRating: [] as string[],
  openNowOnly: false,
  maxDistanceKm: null as number | null,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...defaults,
  setFilter: (key, value) => set({ [key]: value } as any),
  toggleArrayFilter: (key, value) =>
    set((s) => {
      const arr = s[key] as string[];
      return { [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] } as any;
    }),
  reset: () => set(defaults),
}));