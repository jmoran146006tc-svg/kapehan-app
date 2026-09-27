import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useShops } from '@/hooks/useShops';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatPriceRange } from '@/utils/price';
import { ShopCardSkeleton } from '@/components/shop-card-skeleton';
import { useToast } from '@/hooks/useToast';

export default function SavedScreen() {
  const { user } = useAuth();
  const { shops, loading: shopsLoading } = useShops();
  const [savedSnapshot, setSavedSnapshot] = useState<{ userId: string; ids: string[] } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setSavedSnapshot({ userId: user.uid, ids: snap.data()?.savedShopIds ?? [] });
      setLoadError(false);
    }, () => { setLoadError(true); showToast({ type: 'error', message: 'We could not load your saved shops. Please try again.' }); });
  }, [showToast, user]);

  const loading = shopsLoading || (Boolean(user) && savedSnapshot?.userId !== user?.uid && !loadError);
  const savedIds = savedSnapshot?.userId === user?.uid ? (savedSnapshot?.ids ?? []) : [];
  const saved = shops.filter((s) => savedIds.includes(s.id));

  return (
    <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="gap-3">
      <Text className="text-2xl font-bold">Saved</Text>
      {loadError ? <Text className="text-muted-foreground">Saved shops are unavailable right now.</Text> : null}
      {loading ? [0, 1, 2].map((index) => <ShopCardSkeleton key={index} />) : saved.map((shop) => (
        <Card key={shop.id}>
          <CardHeader>
            <CardTitle>{shop.name}</CardTitle>
            <CardDescription>{formatPriceRange(shop.priceMin, shop.priceMax)} · {shop.hasWifi ? 'WiFi' : 'No WiFi'}</CardDescription>
          </CardHeader>
        </Card>
      ))}
      {!loading && !loadError && saved.length === 0 && <Text className="text-muted-foreground">Nothing saved yet.</Text>}
    </ScrollView>
  );
}
