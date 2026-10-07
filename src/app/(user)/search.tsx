import { useEffect, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '@/lib/firebase';
import { goBack } from '@/lib/navigation';
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

export default function SearchScreen() {
  const { shops, loading, refreshing, refresh, error } = useFilteredShops();
  const { user } = useAuth();
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
    });
    return () => { active = false; };
  }, [setFilter, user]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="mx-auto w-full max-w-2xl flex-1 gap-3 px-4 pt-4" style={{ minHeight: 0 }}>
        <View className="flex-row items-center gap-3">
          <PressableScale className="h-11 w-11 items-center justify-center rounded-full bg-card" onPress={() => goBack('/(user)')} accessibilityLabel="Back">
            <Icon as={ArrowLeft} size={20} className="text-primary" />
          </PressableScale>
          <View className="h-12 min-w-0 flex-1 flex-row items-center gap-2 rounded-xl border border-border/60 bg-card px-3">
            <Icon as={Search} size={18} className="text-muted-foreground" />
            <Input autoFocus placeholder="Search by shop name or area…" returnKeyType="search" value={search} onChangeText={(value) => setFilter('search', value)} className="h-11 min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none" />
            {search ? (
              <PressableScale className="h-11 w-11 items-center justify-center" onPress={() => setFilter('search', '')} accessibilityLabel="Clear search">
                <Icon as={X} size={18} className="text-muted-foreground" />
              </PressableScale>
            ) : null}
          </View>
        </View>
        <DiscoveryFilterRow />
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
                  onPress={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: item.id } })}
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
