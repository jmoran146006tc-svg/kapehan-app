/**
 * Price buckets are derived from the lower end of a shop's typical range so
 * the human-friendly label cannot drift away from the numeric source of truth.
 */
export type PriceBucket = 'budget' | 'moderate' | 'premium';

const BUDGET_MAX = 100;
const MODERATE_MAX = 200;

export function getPriceBucket(priceMin: number): PriceBucket {
  if (priceMin < BUDGET_MAX) return 'budget';
  if (priceMin < MODERATE_MAX) return 'moderate';
  return 'premium';
}

export const PRICE_BUCKET_LABELS: Record<PriceBucket, string> = {
  budget: 'Budget',
  moderate: 'Moderate',
  premium: 'Premium',
};

export function formatPriceRange(priceMin?: number, priceMax?: number): string {
  // Older documents can remain readable while their owner or seed migration updates them.
  if (priceMin == null || priceMax == null) return '—';
  return `₱${priceMin}–₱${priceMax}`;
}
