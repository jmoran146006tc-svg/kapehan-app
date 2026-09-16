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
  wifiRating: 'fast' | 'moderate' | 'none';
  photos: string[];
  hours: Record<string, ShopHours>;
  status: 'pending' | 'approved' | 'rejected';
  avgRating: number;
  reviewCount: number;
}
