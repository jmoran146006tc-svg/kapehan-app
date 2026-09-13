import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface ShopDoc {
  name: string;
  address?: string;
  priceRange?: string;
  noiseLevel?: string;
  ambianceTags?: string[];
  photos?: string[];
  status: 'pending' | 'approved' | 'rejected';
  ownerId?: string;
}

export default function AdminReviewListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState<ShopDoc | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'shops', id), (snap) => {
      setShop(snap.exists() ? (snap.data() as ShopDoc) : null);
    });
  }, [id]);

  async function setStatus(status: 'approved' | 'rejected') {
    if (!id) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'shops', id), { status });
      // TODO: once §11's in-app notifications exist, write a notification
      // doc to shop.ownerId here ("listing approved" / "listing rejected").
      router.back();
    } catch (e: any) {
      Alert.alert('Something went wrong', e.message);
      setUpdating(false);
    }
  }

  if (!shop) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading…</Text>
      </View>
    );
  }

  const badgeVariant =
    shop.status === 'approved' ? 'default' : shop.status === 'rejected' ? 'destructive' : 'secondary';

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="flex-row items-start justify-between gap-3 mb-2">
        <Text className="text-2xl font-bold flex-1">{shop.name}</Text>
        <Badge variant={badgeVariant}>
          <Text>{shop.status}</Text>
        </Badge>
      </View>

      {shop.address ? (
        <Text className="text-muted-foreground mb-4">{shop.address}</Text>
      ) : null}

      {shop.photos?.[0] ? (
        <Image source={{ uri: shop.photos[0] }} className="w-full h-48 rounded-xl mb-4" />
      ) : null}

      <View className="gap-2 mb-6">
        {shop.priceRange ? <Text>Price: {shop.priceRange}</Text> : null}
        {shop.noiseLevel ? <Text>Noise: {shop.noiseLevel}</Text> : null}
        {shop.ambianceTags?.length ? (
          <Text>Ambiance: {shop.ambianceTags.join(', ')}</Text>
        ) : null}
      </View>

      <SafeAreaView edges={['bottom']}>
        <View className="flex-row gap-3">
          <Button className="flex-1" disabled={updating} onPress={() => setStatus('approved')}>
            <Text>Approve</Text>
          </Button>
          <Button
            className="flex-1"
            variant="destructive"
            disabled={updating}
            onPress={() => setStatus('rejected')}
          >
            <Text>Reject</Text>
          </Button>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}