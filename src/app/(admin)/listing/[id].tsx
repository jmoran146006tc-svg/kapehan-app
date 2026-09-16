import { useEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, doc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatPriceRange } from '@/utils/price';
import { getListingStatusBadgeVariant } from '@/utils/listing';
import { getUserFriendlyError } from '@/lib/errors';

interface ShopDoc {
  name: string;
  address?: string;
  priceMin?: number;
  priceMax?: number;
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
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'shops', id), (snap) => {
      setShop(snap.exists() ? (snap.data() as ShopDoc) : null);
    });
  }, [id]);

  async function setStatus(status: 'approved' | 'rejected') {
    if (!id) return;
    setActionError(null);
    setUpdating(true);
    try {
      if (!shop?.ownerId) throw new Error('This listing has no owner to notify');

      // The decision and notification are one client-side atomic write; no trigger is needed.
      const batch = writeBatch(db);
      batch.update(doc(db, 'shops', id), { status });
      batch.set(doc(collection(db, 'users', shop.ownerId, 'notifications')), {
        type: status === 'approved' ? 'listing_approved' : 'listing_rejected',
        message: `${shop.name} was ${status}.`,
        shopId: id,
        read: false,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      router.back();
    } catch (error) {
      setActionError(getUserFriendlyError(error, 'We could not update this listing. Please try again.'));
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

  const badgeVariant = getListingStatusBadgeVariant(shop.status);

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
        {(shop.priceMin != null || shop.priceMax != null) ? <Text>Price: {formatPriceRange(shop.priceMin, shop.priceMax)}</Text> : null}
        {shop.noiseLevel ? <Text>Noise: {shop.noiseLevel}</Text> : null}
        {shop.ambianceTags?.length ? (
          <Text>Ambiance: {shop.ambianceTags.join(', ')}</Text>
        ) : null}
      </View>
      {actionError && <Text accessibilityRole="alert" className="text-destructive mb-4">{actionError}</Text>}

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
