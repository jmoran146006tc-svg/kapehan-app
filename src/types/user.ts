import type { Timestamp } from 'firebase/firestore';
import type { Shop } from '@/types/shop';
import type { PriceBucket } from '@/utils/price';

export interface UserPreferences {
  wifiRating: Shop['wifiRating'][];
  priceBuckets: PriceBucket[];
  openNowOnly: boolean;
}

export interface RecentlyViewedEntry {
  shopId: string;
  viewedAt: Timestamp;
}

export interface AppUserDocument {
  name?: string;
  email?: string;
  role: 'user' | 'owner' | 'admin';
  preferences?: Partial<UserPreferences>;
  savedShopIds?: string[];
  recentlyViewed?: RecentlyViewedEntry[];
}
