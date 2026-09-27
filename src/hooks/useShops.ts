import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, where, type QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toShop, type Shop } from '@/types/shop';

type ShopQueryOptions = { wifiOnly?: boolean; tag?: string; featuredLimit?: number };
type ShopResult = { key: string; shops: Shop[]; error: boolean };
const CACHE_MS = 2 * 60 * 1000;
const cache = new Map<string, { shops?: Shop[]; at?: number; pending?: Promise<Shop[]> }>();

function fetchShops(key: string, options: ShopQueryOptions, force = false): Promise<Shop[]> {
  const saved = cache.get(key);
  if (!force && saved?.shops && saved.at && Date.now() - saved.at < CACHE_MS) return Promise.resolve(saved.shops);
  if (saved?.pending) return saved.pending;

  const filters: QueryConstraint[] = [where('status', '==', 'approved')];
  if (options.wifiOnly) filters.push(where('hasWifi', '==', true));
  if (options.tag) filters.push(where('tags', 'array-contains', options.tag));
  if (options.featuredLimit) filters.push(orderBy('avgRating', 'desc'), limit(options.featuredLimit));
  const pending = getDocs(query(collection(db, 'shops'), ...filters)).catch(async (error: unknown) => {
    // Keep discovery usable while a newly deployed composite index is building.
    if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 'failed-precondition') throw error;
    const snapshot = await getDocs(query(collection(db, 'shops'), where('status', '==', 'approved')));
    return { docs: snapshot.docs.filter((shop) => {
      const data = shop.data();
      return (!options.wifiOnly || data.hasWifi === true) && (!options.tag || (data.tags as string[] | undefined)?.includes(options.tag));
    }).sort((left, right) => options.featuredLimit ? (Number(right.data().avgRating) || 0) - (Number(left.data().avgRating) || 0) : 0).slice(0, options.featuredLimit || undefined) };
  }).then((snapshot) => {
    const shops = snapshot.docs.map((shop) => toShop(shop.id, shop.data()));
    cache.set(key, { shops, at: Date.now() });
    return shops;
  }).catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { ...saved, pending });
  return pending;
}

export function useShops(options: ShopQueryOptions = {}) {
  const wifiOnly = Boolean(options.wifiOnly);
  const tag = options.tag ?? '';
  const featuredLimit = options.featuredLimit ?? 0;
  const key = `${wifiOnly ? 'wifi' : 'all'}:${tag}:${featuredLimit}`;
  const [result, setResult] = useState<ShopResult>({ key: '', shops: [], error: false });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchShops(key, { wifiOnly, tag, featuredLimit }).then((shops) => {
      if (active) setResult({ key, shops, error: false });
    }).catch((error) => {
      console.error('Could not load shops:', error);
      if (active) setResult({ key, shops: [], error: true });
    });
    return () => { active = false; };
  }, [featuredLimit, key, tag, wifiOnly]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const shops = await fetchShops(key, { wifiOnly, tag, featuredLimit }, true);
      setResult({ key, shops, error: false });
    } catch (error) {
      console.error('Could not refresh shops:', error);
      setResult((current) => ({ ...current, error: true }));
    } finally { setRefreshing(false); }
  }, [featuredLimit, key, tag, wifiOnly]);

  return { shops: result.key === key ? result.shops : [], loading: result.key !== key, refreshing, refresh, error: result.key === key && result.error };
}
