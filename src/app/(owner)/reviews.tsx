import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { dayjs } from '@/lib/dayjs';
import type { Shop } from '@/types/shop';
import type { Review } from '@/types/review';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

export default function OwnerReviewsScreen() {
  const { user } = useAuth();
  const { shopId: requestedShopId } = useLocalSearchParams<{ shopId?: string }>();
  const [shops, setShops] = useState<Shop[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'shops'), where('ownerId', '==', user.uid)),
      (snap) => setShops(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Shop))
    );
  }, [user]);

  const shopId = useMemo(() => {
    const requested = Array.isArray(requestedShopId) ? requestedShopId[0] : requestedShopId;
    return shops.some((shop) => shop.id === requested) ? requested : shops[0]?.id;
  }, [requestedShopId, shops]);

  useEffect(() => {
    if (!shopId) return;
    return onSnapshot(
      query(collection(db, 'shops', shopId, 'reviews'), orderBy('createdAt', 'desc')),
      (snap) => setReviews(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Review))
    );
  }, [shopId]);

  return (
    <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="gap-3">
      <Text className="text-2xl font-bold">Customer Reviews</Text>
      {!shopId && <Text className="text-muted-foreground">Create a listing to start receiving reviews.</Text>}
      {(shopId ? reviews : []).map((review) => (
        <Card key={review.id}>
          <CardHeader>
            <View className="flex-row items-start justify-between gap-2">
              <CardTitle className="flex-1">{review.userName}</CardTitle>
              <Text>★ {review.rating}/5</Text>
            </View>
            <CardDescription>{review.text || 'No written comment.'}</CardDescription>
            <Text className="text-xs text-muted-foreground">
              {review.createdAt ? dayjs(review.createdAt.toDate()).fromNow() : 'Just now'}
            </Text>
          </CardHeader>
        </Card>
      ))}
      {shopId && reviews.length === 0 && <Text className="text-muted-foreground">No reviews yet.</Text>}
    </ScrollView>
  );
}
