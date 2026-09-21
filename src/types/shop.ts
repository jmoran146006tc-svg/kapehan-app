export interface ShopHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface Shop {
  id: string;
  name: string;
  ownerId: string;
  address: string;
  lat: number;
  lng: number;
  priceMin: number;
  priceMax: number;
  hasWifi: boolean;
  tags: string[];
  description?: string;
  photos: string[];
  hours: Record<string, ShopHours>;
  status: 'pending' | 'approved' | 'rejected';
  avgRating: number;
  reviewCount: number;
  ratingCounts?: Record<'1' | '2' | '3' | '4' | '5', number>;
  viewCount?: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Firestore documents can predate fields introduced by the current schema.
 * Keep that variability at the data boundary so screens always receive a
 * complete, render-safe shop shape.
 */
export function toShop(id: string, data: unknown): Shop {
  const source = asRecord(data);
  const status = source.status;
  const ratingCounts = asRecord(source.ratingCounts);
  const hasRatingCounts = ['1', '2', '3', '4', '5'].every((rating) => typeof ratingCounts[rating] === 'number');

  return {
    id,
    name: typeof source.name === 'string' ? source.name : 'Coffee shop',
    ownerId: typeof source.ownerId === 'string' ? source.ownerId : '',
    address: typeof source.address === 'string' ? source.address : '',
    lat: asNumber(source.lat),
    lng: asNumber(source.lng),
    priceMin: asNumber(source.priceMin),
    priceMax: asNumber(source.priceMax),
    hasWifi: source.hasWifi === true,
    tags: Array.isArray(source.tags) ? source.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    description: typeof source.description === 'string' ? source.description : undefined,
    photos: Array.isArray(source.photos) ? source.photos.filter((photo): photo is string => typeof photo === 'string') : [],
    hours: asRecord(source.hours) as Shop['hours'],
    status: status === 'pending' || status === 'rejected' || status === 'approved' ? status : 'approved',
    avgRating: asNumber(source.avgRating),
    reviewCount: asNumber(source.reviewCount),
    ratingCounts: hasRatingCounts ? ratingCounts as Shop['ratingCounts'] : undefined,
    viewCount: asNumber(source.viewCount),
  };
}
