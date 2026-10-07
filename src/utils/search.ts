import type { Shop } from '@/types/shop';

export const MIN_SEARCH_LENGTH = 2;

const ABBREVIATIONS: Record<string, string> = {
  brgy: 'barangay', st: 'street', rd: 'road', ave: 'avenue',
  hwy: 'highway', blvd: 'boulevard', bldg: 'building', purok: 'purok',
};

export function normalizeSearchText(input: string): string {
  let normalized = input.toLowerCase();
  try {
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    // Older engines may not support Unicode normalization.
  }
  return normalized.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function tokenize(query: string): string[] {
  return normalizeSearchText(query).split(' ').filter(Boolean).map((token) => ABBREVIATIONS[token] ?? token);
}

export function matchShopSearch(shop: Pick<Shop, 'name' | 'address'>, query: string): 'name' | 'address' | null {
  const tokens = tokenize(query);
  const name = tokenize(shop.name).join(' ');
  const combined = `${name} ${tokenize(shop.address).join(' ')}`;
  if (!tokens.every((token) => combined.includes(token))) return null;
  return tokens.every((token) => name.includes(token)) ? 'name' : 'address';
}
