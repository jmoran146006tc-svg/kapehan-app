import { useEffect, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Clock, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '@/lib/firebase';
import { blurActiveElement, goBack } from '@/lib/navigation';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { MIN_SEARCH_LENGTH } from '@/utils/search';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useFilteredShops } from '@/hooks/useFilteredShops';
import { useFilterStore } from '@/store/filterStore';
import { useCompareStore } from '@/store/compareStore';
import { useSavedShops } from '@/hooks/useSavedShops';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { DiscoveryFilterRow } from '@/components/discovery-filter-row';
import { EmptyState } from '@/components/empty-state';
import { ShopCard } from '@/components/shop-card';
import { ShopCardSkeleton } from '@/components/shop-card-skeleton';
import type { UserPreferences } from '@/types/user';
import { LinearGradient } from '@/components/ui/linear-gradient';
import { PALETTE } from '@/constants/theme';
import { useToast } from '@/hooks/useToast';
import { getUserFriendlyError } from '@/lib/errors';

export default function SearchScreen() {
  const { shops, loading, refreshing, refresh, error, distanceFilterWaiting } = useFilteredShops();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { searches, record, remove, clear } = useSearchHistory();
  const insets = useSafeAreaInsets();
  const appliedPreferencesFor = useRef<string | null>(null);
  const { search, setFilter } = useFilterStore();
  const ids = useCompareStore((state) => state.ids);
  const toggle = useCompareStore((state) => state.toggle);
  const { savedShopIds, savingShopId, toggleSavedShop } = useSavedShops();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!user || appliedPreferencesFor.current === user.uid) return;
    appliedPreferencesFor.current = user.uid;
    let active = true;
    void getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (!active) return;
      const preferences = snap.data()?.preferences as Partial<UserPreferences> | undefined;
      if (!preferences) return;
      setFilter('wifiOnly', preferences.wifiOnly ?? false);
      setFilter('tags', preferences.tags ?? []);
      setFilter('priceBuckets', preferences.priceBuckets ?? []);
      setFilter('openNowOnly', preferences.openNowOnly ?? false);
      setFilter('maxDistanceKm', preferences.maxDistanceKm ?? null);
    }).catch((error) => { if (active) showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not load your search preferences.') }); });
    return () => { active = false; };
  }, [setFilter, showToast, user]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="mx-auto w-full max-w-2xl flex-1 gap-3 px-4 pt-4" style={{ minHeight: 0 }}>
        <View className="flex-row items-center gap-3">
          <PressableScale className="h-11 w-11 items-center justify-center rounded-full bg-card" onPress={() => goBack('/(user)')} accessibilityLabel="Back">
            <Icon as={ArrowLeft} size={20} className="text-primary" />
          </PressableScale>
          <View className="h-12 min-w-0 flex-1 flex-row items-center gap-2 rounded-xl border border-border/60 bg-card px-3">
            <Icon as={Search} size={18} className="text-muted-foreground" />
            <Input autoFocus placeholder="Search by shop name or area…" returnKeyType="search" onSubmitEditing={() => record(search)} value={search} onChangeText={(value) => setFilter('search', value)} className="h-11 min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none" />
            {search ? (
              <PressableScale className="h-11 w-11 items-center justify-center" onPress={() => setFilter('search', '')} accessibilityLabel="Clear search">
                <Icon as={X} size={18} className="text-muted-foreground" />
              </PressableScale>
            ) : null}
          </View>
        </View>
        <DiscoveryFilterRow />
        {!search.trim() && searches.length > 0 ? (
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold">Recent searches</Text>
              <Button variant="ghost" className="min-h-11" onPress={clear}><Text>Clear all</Text></Button>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {searches.map((query) => (
                <View key={query} className="max-w-full flex-row items-center rounded-full border border-border bg-card">
                  <PressableScale className="min-h-11 max-w-[70%] flex-row items-center gap-2 pl-3 pr-1" onPress={() => { setFilter('search', query); record(query); }} accessibilityLabel={`Search for ${query}`}>
                    <Icon as={Clock} size={16} className="text-muted-foreground" />
                    <Text numberOfLines={1} className="shrink text-sm">{query}</Text>
                  </PressableScale>
                  <PressableScale className="h-11 w-11 items-center justify-center" onPress={() => remove(query)} accessibilityLabel={`Remove ${query} from search history`}><Icon as={X} size={16} /></PressableScale>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {distanceFilterWaiting ? <Text className="text-sm text-muted-foreground">Waiting for your location — showing all shops for now.</Text> : null}
        <Text className="text-sm text-muted-foreground">{loading ? 'Loading coffee shops…' : `${shops.length} coffee shop${shops.length === 1 ? '' : 's'} found`}</Text>
        {loading ? (
          <View className="gap-3"><ShopCardSkeleton /><ShopCardSkeleton /><ShopCardSkeleton /></View>
        ) : (
          <View className="relative flex-1" style={{ minHeight: 0 }}>
            <FlatList
              data={shops}
              keyExtractor={(shop) => shop.id}
              refreshing={refreshing}
              onRefresh={() => void refresh()}
              onScroll={(event) => setScrolled(event.nativeEvent.contentOffset.y > 4)}
              scrollEventThrottle={16}
              initialNumToRender={8}
              windowSize={7}
              contentContainerClassName="gap-3 pb-4"
              ListEmptyComponent={
                <EmptyState title={error ? 'Coffee shops are unavailable. Pull down to retry.' : search.trim() ? `No coffee shops match "${search.trim()}" yet.` : 'No approved coffee shops match these filters yet.'} description={!error && search.trim() ? 'Try a street, barangay, or landmark.' : ''} />
              }
              renderItem={({ item, index }) => (
                <ShopCard
                  index={index}
                  shop={item}
                  onPress={() => { if (search.trim().length >= MIN_SEARCH_LENGTH) record(search); blurActiveElement(); router.push({ pathname: '/(user)/shop/[id]', params: { id: item.id } }); }}
                  saved={savedShopIds.includes(item.id)}
                  saving={savingShopId === item.id}
                  onToggleSaved={() => void toggleSavedShop(item.id)}
                  compared={ids.includes(item.id)}
                  onToggleCompare={() => toggle(item.id)}
                />
              )}
            />
            {scrolled ? (
              <LinearGradient
                pointerEvents="none"
                colors={[PALETTE.background, `${PALETTE.background}00`]}
                className="absolute left-0 right-0 top-0 h-5"
              />
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}
