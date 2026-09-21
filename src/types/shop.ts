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
