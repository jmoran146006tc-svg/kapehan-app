import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useShops } from '@/hooks/useShops';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatPriceRange } from '@/utils/price';
import type { RecentlyViewedEntry } from '@/types/user';

export default function HomeScreen() {
  const { shops } = useShops();
  const { user } = useAuth();
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedEntry[]>([]);
  const topPicks = [...shops].sort((a, b) => b.avgRating - a.avgRating).slice(0, 5);
  const recentlyViewedShops = useMemo(() => {
    const shopsById = new Map(shops.map((shop) => [shop.id, shop]));
    return recentlyViewed.map((entry) => shopsById.get(entry.shopId)).filter(Boolean);
  }, [recentlyViewed, shops]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), (snap) => setRecentlyViewed(snap.data()?.recentlyViewed ?? []));
  }, [user]);

  return (
    <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="gap-4">
      <Text className="text-2xl font-bold">Home</Text>
      <Text className="font-semibold text-lg">Top picks</Text>
      <View className="gap-3">
        {topPicks.map((shop) => (
          <Card key={shop.id}>
            <CardHeader>
              <CardTitle>{shop.name}</CardTitle>
              <CardDescription>{formatPriceRange(shop.priceMin, shop.priceMax)} · ⭐ {shop.avgRating.toFixed(1)} ({shop.reviewCount})</CardDescription>
            </CardHeader>
          </Card>
        ))}
        {topPicks.length === 0 && <Text className="text-muted-foreground">No shops yet — check back soon.</Text>}
      </View>
      <Text className="font-semibold text-lg">Recently viewed</Text>
      <View className="gap-3">
        {recentlyViewedShops.map((shop) => shop && (
          <Pressable key={shop.id} onPress={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: shop.id } })}>
            <Card>
              <CardHeader>
                <CardTitle>{shop.name}</CardTitle>
                <CardDescription>{formatPriceRange(shop.priceMin, shop.priceMax)} · {shop.wifiRating} wifi</CardDescription>
              </CardHeader>
            </Card>
          </Pressable>
        ))}
        {recentlyViewedShops.length === 0 && <Text className="text-muted-foreground">Shops you open will appear here.</Text>}
      </View>
    </ScrollView>
  );
}
