import type { Timestamp } from 'firebase/firestore';
import type { PriceBucket } from '@/utils/price';
import type { ShopTag } from '@/constants/tags';

export interface UserPreferences {
  wifiOnly: boolean;
  tags: ShopTag[];
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
  status: 'active' | 'suspended';
  createdAt?: Timestamp | null;
  preferences?: Partial<UserPreferences>;
  savedShopIds?: string[];
  recentlyViewed?: RecentlyViewedEntry[];
  visitCount?: number;
}
