import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

interface PendingShop {
  id: string;
  name: string;
  address?: string;
}

export default function AdminPendingQueueScreen() {
  const [shops, setShops] = useState<PendingShop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'shops'), where('status', '==', 'pending'));
    return onSnapshot(q, (snap) => {
      setShops(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PendingShop));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold mb-4">Pending Listings</Text>

      {shops.length === 0 && (
        <Text className="text-muted-foreground">
          Nothing waiting on approval right now.
        </Text>
      )}

      <View className="gap-3">
        {shops.map((shop) => (
          <Pressable
            key={shop.id}
            onPress={() =>
              router.push({ pathname: '/(admin)/listing/[id]', params: { id: shop.id } })
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>{shop.name}</CardTitle>
                {shop.address ? <CardDescription>{shop.address}</CardDescription> : null}
              </CardHeader>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}