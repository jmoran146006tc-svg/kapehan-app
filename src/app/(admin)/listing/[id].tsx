import { useEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, doc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPriceRange } from '@/utils/price';
import { getListingStatusBadgeVariant } from '@/utils/listing';
import { getUserFriendlyError } from '@/lib/errors';

interface ShopDoc {
  name: string;
  address?: string;
  priceMin?: number;
  priceMax?: number;
  hasWifi?: boolean;
  tags?: string[];
  description?: string;
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
    } catch (actionError) {
      const code = typeof actionError === 'object' && actionError !== null && 'code' in actionError ? String(actionError.code) : 'unknown';
      const message = actionError instanceof Error ? actionError.message : String(actionError);
      console.warn('Admin shop status update failed', { shopId: id, status, code, message });
      setActionError(getUserFriendlyError(actionError, 'We could not update this listing. Please try again.'));
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
    <ScrollView className="flex-1 bg-background px-4" contentContainerClassName="mx-auto w-full max-w-2xl gap-4 py-4 pb-8">
      <Card>
        <CardHeader className="gap-4">
          <View className="flex-row items-start justify-between gap-3">
            <CardTitle className="flex-1 text-2xl">{shop.name}</CardTitle>
            <Badge variant={badgeVariant}><Text>{shop.status}</Text></Badge>
          </View>
          {shop.address ? <Text className="text-muted-foreground">{shop.address}</Text> : null}
          {shop.description ? <Text className="text-muted-foreground">{shop.description}</Text> : null}
          {shop.photos?.[0] ? <Image source={{ uri: shop.photos[0] }} className="h-48 w-full rounded-xl" resizeMode="cover" /> : <View className="h-48 w-full items-center justify-center rounded-xl bg-secondary"><Text className="text-muted-foreground">No photo yet</Text></View>}
          <View className="gap-2">
            {(shop.priceMin != null || shop.priceMax != null) ? <Text>Price: {formatPriceRange(shop.priceMin, shop.priceMax)}</Text> : null}
            {shop.hasWifi != null ? <Text>{shop.hasWifi ? 'WiFi available' : 'No WiFi'}</Text> : null}
            {shop.tags?.length ? <Text>Features: {shop.tags.join(', ')}</Text> : null}
          </View>
        </CardHeader>
      </Card>
      {actionError && <Text accessibilityRole="alert" className="text-destructive mb-4">{actionError}</Text>}

      <SafeAreaView edges={['bottom']}>
        {shop.status === 'pending' ? (
          <View className="flex-row gap-3">
            <Button className="flex-1 bg-green-700" disabled={updating} onPress={() => setStatus('approved')}>
              <Icon as={Check} size={16} className="text-white" />
              <Text>Approve Listing</Text>
            </Button>
            <Button className="flex-1 border-destructive" variant="outline" disabled={updating} onPress={() => setStatus('rejected')}>
              <Icon as={X} size={16} className="text-destructive" />
              <Text className="text-destructive">Reject</Text>
            </Button>
          </View>
        ) : null}
        {shop.status === 'approved' ? <Button variant="outline" className="border-destructive" disabled={updating} onPress={() => setStatus('rejected')}><Icon as={X} size={16} className="text-destructive" /><Text className="text-destructive">Revoke Listing</Text></Button> : null}
        {shop.status === 'rejected' ? <Button className="bg-green-700" disabled={updating} onPress={() => setStatus('approved')}><Icon as={Check} size={16} className="text-white" /><Text>Re-enlist Listing</Text></Button> : null}
      </SafeAreaView>
    </ScrollView>
  );
}
