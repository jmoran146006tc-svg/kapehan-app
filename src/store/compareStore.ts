import { create } from 'zustand';

interface CompareState {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareState>((set) => ({
  ids: [],
  toggle: (id) =>
    set((s) => {
      if (s.ids.includes(id)) return { ids: s.ids.filter((i) => i !== id) };
      if (s.ids.length >= 3) return s; // could toast "up to 3 at a time"
      return { ids: [...s.ids, id] };
    }),
  clear: () => set({ ids: [] }),
}));