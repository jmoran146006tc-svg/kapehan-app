import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useShops } from '@/hooks/useShops';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

export default function SavedScreen() {
  const { user } = useAuth();
  const { shops } = useShops();
  const [savedShopIds, setSavedShopIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), (snap) => setSavedShopIds(snap.data()?.savedShopIds ?? []));
  }, [user]);

  const saved = shops.filter((s) => savedShopIds.includes(s.id));

  return (
    <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="gap-3">
      <Text className="text-2xl font-bold">Saved</Text>
      {saved.map((shop) => (
        <Card key={shop.id}>
          <CardHeader>
            <CardTitle>{shop.name}</CardTitle>
            <CardDescription>{shop.priceRange} · {shop.wifiRating} wifi</CardDescription>
          </CardHeader>
        </Card>
      ))}
      {saved.length === 0 && <Text className="text-muted-foreground">Nothing saved yet.</Text>}
    </ScrollView>
  );
}