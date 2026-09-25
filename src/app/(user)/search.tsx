import { useEffect, useRef } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react-native';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useFilteredShops } from '@/hooks/useFilteredShops';
import { useFilterStore } from '@/store/filterStore';
import { useCompareStore } from '@/store/compareStore';
import { useSavedShops } from '@/hooks/useSavedShops';
import { goBack } from '@/lib/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DiscoveryFilterRow } from '@/components/discovery-filter-row';
import { ShopCard } from '@/components/shop-card';
import type { UserPreferences } from '@/types/user';

export default function SearchScreen() {
  const shops = useFilteredShops();
  const { user } = useAuth();
  const appliedPreferencesFor = useRef<string | null>(null);
  const { search, setFilter } = useFilterStore();
  const ids = useCompareStore((state) => state.ids);
  const toggle = useCompareStore((state) => state.toggle);
  const { savedShopIds, savingShopId, toggleSavedShop } = useSavedShops();
  useEffect(() => { if (!user || appliedPreferencesFor.current === user.uid) return; appliedPreferencesFor.current = user.uid; let active = true; void getDoc(doc(db, 'users', user.uid)).then((snap) => { if (!active) return; const preferences = snap.data()?.preferences as Partial<UserPreferences> | undefined; if (!preferences) return; setFilter('wifiOnly', preferences.wifiOnly ?? false); setFilter('tags', preferences.tags ?? []); setFilter('priceBuckets', preferences.priceBuckets ?? []); setFilter('openNowOnly', preferences.openNowOnly ?? false); }); return () => { active = false; }; }, [setFilter, user]);
  return <View className="flex-1 gap-3 bg-background p-4"><View className="mx-auto w-full max-w-2xl flex-row items-center gap-2"><Button size="icon" variant="ghost" onPress={() => goBack('/(user)')}><Icon as={ArrowLeft} /></Button><Input autoFocus className="flex-1" placeholder="Search coffee shops…" value={search} onChangeText={(value) => setFilter('search', value)} /></View><View className="mx-auto w-full max-w-2xl"><DiscoveryFilterRow /><Text className="mt-2 text-sm text-muted-foreground">{shops.length} coffee shop{shops.length === 1 ? '' : 's'} found</Text></View><FlatList data={shops} keyExtractor={(shop) => shop.id} contentContainerClassName="mx-auto w-full max-w-2xl gap-3 pb-4" renderItem={({ item }) => <ShopCard shop={item} onPress={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: item.id } })} saved={savedShopIds.includes(item.id)} saving={savingShopId === item.id} onToggleSaved={() => void toggleSavedShop(item.id)} compared={ids.includes(item.id)} onToggleCompare={() => toggle(item.id)} />} /></View>;
}
