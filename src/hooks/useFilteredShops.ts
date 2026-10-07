import { useMemo } from 'react';
import { useShops } from './useShops';
import { useFilterStore } from '@/store/filterStore';
import { useUserLocation } from './useUserLocation';
import { haversineKm } from '@/utils/distance';
import { isOpenNow } from '@/utils/hours';
import { getPriceBucket } from '@/utils/price';
import { matchShopSearch } from '@/utils/search';

export function useFilteredShops({ featuredOnly = false }: { featuredOnly?: boolean } = {}) {
  const filters = useFilterStore();
  const featuredLimit = featuredOnly && !filters.search && !filters.priceBuckets.length && !filters.openNowOnly && filters.maxDistanceKm == null && filters.tags.length <= 1 ? 50 : undefined;
  const { shops, loading, refreshing, refresh, error } = useShops({ wifiOnly: filters.wifiOnly, tag: filters.tags[0], featuredLimit });
  const location = useUserLocation();

  const filteredShops = useMemo(() => {
    return shops
      .map((shop) => ({
        ...shop,
        distanceKm: location ? haversineKm(location.lat, location.lng, shop.lat, shop.lng) : null,
        openNow: isOpenNow(shop.hours),
        matchedOn: matchShopSearch(shop, filters.search),
      }))
      .filter((shop) => {
        if (filters.search && shop.matchedOn == null) return false;
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
      .sort((a, b) => {
        if (filters.search.trim() && !location) return Number(b.matchedOn === 'name') - Number(a.matchedOn === 'name');
        return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      });
  }, [shops, filters, location]);
  return { shops: filteredShops, loading, refreshing, refresh, error };
}
