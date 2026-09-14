import { useEffect, useState } from 'react';
import { ScrollView, Image, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useCompareStore } from '@/store/compareStore';
import { isOpenNow } from '@/utils/hours';
import { ShopLocationMap } from '@/components/shop-location-map';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Shop } from '@/types/shop';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const location = useUserLocation();
  const { ids, toggle } = useCompareStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'shops', id), (snap) => setShop(snap.exists() ? ({ id: snap.id, ...snap.data() } as Shop) : null));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), (snap) => setSaved((snap.data()?.savedShopIds ?? []).includes(id)));
  }, [user, id]);

  async function toggleSave() {
    if (!user || !id) return;
    await updateDoc(doc(db, 'users', user.uid), { savedShopIds: saved ? arrayRemove(id) : arrayUnion(id) });
  }

  if (!shop) return <Text className="p-4">Loading…</Text>;

  return (
    <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="gap-4">
      <View className="flex-row justify-between items-start">
        <Text className="text-2xl font-bold flex-1">{shop.name}</Text>
        <Badge variant={isOpenNow(shop.hours) ? 'default' : 'secondary'}>
          <Text>{isOpenNow(shop.hours) ? 'Open now' : 'Closed'}</Text>
        </Badge>
      </View>
      <Text className="text-muted-foreground">{shop.address}</Text>
      <Text>{shop.priceRange} · {shop.wifiRating} wifi</Text>

      {shop.photos.length > 0 && (
        <ScrollView horizontal className="gap-2">
          {shop.photos.map((url) => <Image key={url} source={{ uri: url }} className="w-40 h-40 rounded-xl mr-2" />)}
        </ScrollView>
      )}

      <ShopLocationMap shop={shop} userLocation={location} />

      <View className="flex-row gap-2">
        <Button className="flex-1" variant={saved ? 'default' : 'outline'} onPress={toggleSave}>
          <Text>{saved ? 'Saved' : 'Save'}</Text>
        </Button>
        <Button className="flex-1" variant={ids.includes(shop.id) ? 'default' : 'outline'} onPress={() => toggle(shop.id)}>
          <Text>{ids.includes(shop.id) ? 'Added to compare' : '+ Compare'}</Text>
        </Button>
      </View>

      {/* Reviews + "Kapehan Check" still need their own build — see below */}
    </ScrollView>
  );
}