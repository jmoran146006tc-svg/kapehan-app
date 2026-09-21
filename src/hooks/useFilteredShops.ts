import { useMemo } from 'react';
import { useShops } from './useShops';
import { useFilterStore } from '@/store/filterStore';
import { useUserLocation } from './useUserLocation';
import { haversineKm } from '@/utils/distance';
import { isOpenNow } from '@/utils/hours';
import { getPriceBucket } from '@/utils/price';

export function useFilteredShops() {
  const { shops } = useShops();
  const filters = useFilterStore();
  const location = useUserLocation();

  return useMemo(() => {
    return shops
      .map((shop) => ({
        ...shop,
        distanceKm: location ? haversineKm(location.lat, location.lng, shop.lat, shop.lng) : null,
        openNow: isOpenNow(shop.hours),
      }))
      .filter((shop) => {
        if (filters.search && !shop.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (
          filters.priceBuckets.length &&
          (shop.priceMin == null || !filters.priceBuckets.includes(getPriceBucket(shop.priceMin)))
        ) return false;
        if (filters.wifiOnly && !shop.hasWifi) return false;
        if (filters.tags.length && !filters.tags.every((tag) => shop.tags?.includes(tag))) return false;
        if (filters.openNowOnly && !shop.openNow) return false;
        if (filters.maxDistanceKm != null && (shop.distanceKm == null || shop.distanceKm > filters.maxDistanceKm))
          return false;
        return true;
      })
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [shops, filters, location]);
}
