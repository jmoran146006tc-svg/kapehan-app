import { useEffect, useRef } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useFilteredShops } from '@/hooks/useFilteredShops';
import { useFilterStore } from '@/store/filterStore';
import { useCompareStore } from '@/store/compareStore';
import { useSavedShops } from '@/hooks/useSavedShops';
import { ScreenHeader } from '@/components/screen-header';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { DiscoveryFilterRow } from '@/components/discovery-filter-row';
import { ShopCard } from '@/components/shop-card';
import { ShopCardSkeleton } from '@/components/shop-card-skeleton';
import type { UserPreferences } from '@/types/user';

export default function SearchScreen() {
  const { shops, loading, refreshing, refresh, error } = useFilteredShops();
  const { user } = useAuth();
  const appliedPreferencesFor = useRef<string | null>(null);
  const { search, setFilter } = useFilterStore();
  const ids = useCompareStore((state) => state.ids);
  const toggle = useCompareStore((state) => state.toggle);
  const { savedShopIds, savingShopId, toggleSavedShop } = useSavedShops();
  useEffect(() => { if (!user || appliedPreferencesFor.current === user.uid) return; appliedPreferencesFor.current = user.uid; let active = true; void getDoc(doc(db, 'users', user.uid)).then((snap) => { if (!active) return; const preferences = snap.data()?.preferences as Partial<UserPreferences> | undefined; if (!preferences) return; setFilter('wifiOnly', preferences.wifiOnly ?? false); setFilter('tags', preferences.tags ?? []); setFilter('priceBuckets', preferences.priceBuckets ?? []); setFilter('openNowOnly', preferences.openNowOnly ?? false); }); return () => { active = false; }; }, [setFilter, user]);
  return <View className="flex-1 bg-background"><ScreenHeader title="Search" fallbackHref="/(user)" /><View className="mx-auto w-full max-w-2xl flex-1 gap-3 px-4 pt-4" style={{ minHeight: 0 }}><Input autoFocus placeholder="Search coffee shops…" value={search} onChangeText={(value) => setFilter('search', value)} /><View><DiscoveryFilterRow /><Text className="mt-2 text-sm text-muted-foreground">{loading ? 'Loading coffee shops…' : `${shops.length} coffee shop${shops.length === 1 ? '' : 's'} found`}</Text></View>{loading ? <View className="gap-3"><ShopCardSkeleton /><ShopCardSkeleton /><ShopCardSkeleton /></View> : <FlatList data={shops} keyExtractor={(shop) => shop.id} refreshing={refreshing} onRefresh={() => void refresh()} initialNumToRender={8} windowSize={7} contentContainerClassName="gap-3 pb-4" ListEmptyComponent={<Text className="py-8 text-center text-muted-foreground">{error ? 'Coffee shops are unavailable. Pull down to retry.' : 'No approved coffee shops match these filters yet.'}</Text>} renderItem={({ item, index }) => <ShopCard index={index} shop={item} onPress={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: item.id } })} saved={savedShopIds.includes(item.id)} saving={savingShopId === item.id} onToggleSaved={() => void toggleSavedShop(item.id)} compared={ids.includes(item.id)} onToggleCompare={() => toggle(item.id)} />} />}</View></View>;
}
