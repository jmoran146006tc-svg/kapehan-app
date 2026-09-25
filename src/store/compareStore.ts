import { create } from 'zustand';

export const MAX_COMPARED_SHOPS = 3;

// Comparison is a short-lived UI selection, not a user preference worth persisting remotely.

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
      if (s.ids.length >= MAX_COMPARED_SHOPS) return s;
      return { ids: [...s.ids, id] };
    }),
  clear: () => set({ ids: [] }),
}));
