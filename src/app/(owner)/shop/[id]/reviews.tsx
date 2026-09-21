import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { dayjs } from '@/lib/dayjs';
import { saveOwnerReply } from '@/lib/review-replies';
import type { Review } from '@/types/review';
import type { Shop } from '@/types/shop';
import { OwnerShopShell } from '@/components/owner-shop-shell';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

export default function OwnerShopReviewsScreen() {
  return <OwnerShopShell active="reviews">{(shop) => <OwnerReviewsContent key={shop.id} shop={shop} />}</OwnerShopShell>;
}

function OwnerReviewsContent({ shop }: { shop: Shop }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onSnapshot(
    query(collection(db, 'shops', shop.id, 'reviews'), orderBy('createdAt', 'desc')),
    (snapshot) => setReviews(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Review)),
  ), [shop.id]);

  const counts = shop.ratingCounts ?? reviews.reduce<Record<'1' | '2' | '3' | '4' | '5', number>>(
    (result, review) => ({ ...result, [String(review.rating) as keyof typeof result]: result[String(review.rating) as keyof typeof result] + 1 }),
    { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
  );
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  async function reply(review: Review) {
    setError(null);
    setSubmitting(review.id);
    try {
      await saveOwnerReply(shop.id, review.id, drafts[review.id] ?? review.ownerReply?.text ?? '');
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : 'We could not send that reply.');
    } finally {
      setSubmitting(null);
    }
  }

  return <ScrollView className="flex-1 bg-background px-4" contentContainerClassName="gap-4 py-5 pb-8">
    <Card>
      <CardHeader className="flex-row gap-5">
        <View className="items-center justify-center">
          <Text className="text-4xl font-bold">{shop.avgRating.toFixed(1)}</Text>
          <Text className="text-accent">★★★★★</Text>
        </View>
        <View className="flex-1 gap-1">
          {[5, 4, 3, 2, 1].map((rating) => <View key={rating} className="flex-row items-center gap-2">
            <Text className="w-5 text-xs">{rating}★</Text>
            <View className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <View className="h-full bg-accent" style={{ width: `${total ? (counts[String(rating) as keyof typeof counts] / total) * 100 : 0}%` }} />
            </View>
            <Text className="w-8 text-right text-xs text-muted-foreground">{total ? Math.round((counts[String(rating) as keyof typeof counts] / total) * 100) : 0}%</Text>
          </View>)}
        </View>
      </CardHeader>
    </Card>
    {error ? <Text accessibilityRole="alert" className="text-destructive">{error}</Text> : null}
    {reviews.map((review) => <Card key={review.id}>
      <CardHeader className="gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1"><CardTitle>{review.userName}</CardTitle><Text className="text-xs text-muted-foreground">{review.createdAt ? dayjs(review.createdAt.toDate()).fromNow() : 'Just now'}</Text></View>
          <Text>★ {review.rating}/5</Text>
        </View>
        <CardDescription>{review.text || 'No written comment.'}</CardDescription>
        <Input multiline className="min-h-16 py-2" placeholder="Reply to this review…" value={drafts[review.id] ?? review.ownerReply?.text ?? ''} onChangeText={(text) => setDrafts((current) => ({ ...current, [review.id]: text }))} />
        <Button size="sm" className="self-start" loading={submitting === review.id} loadingLabel="Sending…" onPress={() => void reply(review)}><Text>{review.ownerReply ? 'Update reply' : 'Reply'}</Text></Button>
      </CardHeader>
    </Card>)}
    {reviews.length === 0 ? <Text className="text-muted-foreground">No customer reviews yet.</Text> : null}
  </ScrollView>;
}
