import { useEffect, useRef } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useFilteredShops } from '@/hooks/useFilteredShops';
import { useFilterStore } from '@/store/filterStore';
import { useCompareStore } from '@/store/compareStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BottomTabInset } from '@/constants/theme';
import { PRICE_BUCKET_LABELS, formatPriceRange, type PriceBucket } from '@/utils/price';
import type { UserPreferences } from '@/types/user';

export default function SearchScreen() {
  const shops = useFilteredShops();
  const { user } = useAuth();
  const appliedPreferencesFor = useRef<string | null>(null);
  const { search, priceBuckets, wifiRating, openNowOnly, setFilter, toggleArrayFilter, reset } = useFilterStore();
  const { ids, toggle } = useCompareStore();

  useEffect(() => {
    if (!user || appliedPreferencesFor.current === user.uid) return;
    appliedPreferencesFor.current = user.uid;
    let active = true;

    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (!active) return;
      const preferences = snap.data()?.preferences as Partial<UserPreferences> | undefined;
      if (!preferences) return;
      setFilter('wifiRating', preferences.wifiRating ?? []);
      setFilter('priceBuckets', preferences.priceBuckets ?? []);
      setFilter('openNowOnly', preferences.openNowOnly ?? false);
    });

    return () => { active = false; };
  }, [setFilter, user]);

  return (
    <View className="flex-1 bg-background p-4 gap-3">
      <Text className="text-2xl font-bold">Search</Text>

      <View className="flex-row gap-2">
        <Input className="flex-1" placeholder="Search coffee shops…" value={search}
          onChangeText={(t) => setFilter('search', t)} />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline"><Text>Filters</Text></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Filter shops</DialogTitle></DialogHeader>

            <Text className="font-semibold">Price</Text>
            <View className="flex-row gap-2">
              {(['budget', 'moderate', 'premium'] as PriceBucket[]).map((bucket) => (
                <Button key={bucket} size="sm" variant={priceBuckets.includes(bucket) ? 'default' : 'outline'}
                  onPress={() => toggleArrayFilter('priceBuckets', bucket)}>
                  <Text>{PRICE_BUCKET_LABELS[bucket]}</Text>
                </Button>
              ))}
            </View>

            <Text className="font-semibold">WiFi</Text>
            <View className="flex-row gap-2">
              {(['fast', 'moderate', 'none'] as const).map((w) => (
                <Button key={w} size="sm" variant={wifiRating.includes(w) ? 'default' : 'outline'}
                  onPress={() => toggleArrayFilter('wifiRating', w)}>
                  <Text className="capitalize">{w}</Text>
                </Button>
              ))}
            </View>

            <Button variant={openNowOnly ? 'default' : 'outline'} onPress={() => setFilter('openNowOnly', !openNowOnly)}>
              <Text>Open now</Text>
            </Button>
            <Button variant="ghost" onPress={reset}><Text>Clear filters</Text></Button>
          </DialogContent>
        </Dialog>
      </View>

      <FlatList
        data={shops}
        keyExtractor={(s) => s.id}
        contentContainerClassName="gap-3 pb-4"
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: item.id } })}>
            <Card>
              <CardHeader>
                <View className="flex-row justify-between items-start">
                  <CardTitle className="flex-1">{item.name}</CardTitle>
                  <Badge variant={item.openNow ? 'default' : 'secondary'}>
                    <Text>{item.openNow ? 'Open now' : 'Closed'}</Text>
                  </Badge>
                </View>
                <CardDescription>
                  {formatPriceRange(item.priceMin, item.priceMax)} · {item.wifiRating} wifi
                  {item.distanceKm != null ? ` · ${item.distanceKm.toFixed(1)} km` : ''}
                </CardDescription>
              </CardHeader>
              <Button size="sm" variant={ids.includes(item.id) ? 'default' : 'outline'} className="mx-6"
                onPress={() => toggle(item.id)}>
                <Text>{ids.includes(item.id) ? 'Added to compare' : '+ Compare'}</Text>
              </Button>
            </Card>
          </Pressable>
        )}
      />
      {ids.length >= 2 && (
        <Button className="absolute right-4 shadow-lg" style={{ bottom: BottomTabInset + 16 }} onPress={() => router.push('/(user)/compare')}>
          <Text>Compare ({ids.length}) →</Text>
        </Button>
      )}
    </View>
  );
}
