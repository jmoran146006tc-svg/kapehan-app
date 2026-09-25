import { OwnerReplyLabel, ReviewTime } from '@/components/review-edit-markers';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Pencil, Star } from 'lucide-react-native';
import { db } from '@/lib/firebase';
import { getUserFriendlyError } from '@/lib/errors';
import { saveOwnerReply } from '@/lib/review-replies';
import { toReview, type Review } from '@/types/review';
import type { Shop } from '@/types/shop';
import { OwnerShopShell } from '@/components/owner-shop-shell';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useToast } from '@/hooks/useToast';

export default function OwnerShopReviewsScreen() {
  return <OwnerShopShell active="reviews">{(shop) => <OwnerReviewsContent key={shop.id} shop={shop} />}</OwnerShopShell>;
}

function OwnerReviewsContent({ shop }: { shop: Shop }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => onSnapshot(
    query(collection(db, 'shops', shop.id, 'reviews'), orderBy('createdAt', 'desc')),
    (snapshot) => setReviews(snapshot.docs.map((item) => toReview(item.id, item.data()))),
    (snapshotError) => setError(getUserFriendlyError(snapshotError, 'We could not load customer reviews. Please try again.')),
  ), [shop.id]);

  const counts = shop.ratingCounts ?? reviews.reduce<Record<'1' | '2' | '3' | '4' | '5', number>>(
    (result, review) => ({ ...result, [String(review.rating) as keyof typeof result]: result[String(review.rating) as keyof typeof result] + 1 }),
    { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
  );
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  function hasReply(review: Review) {
    return Boolean(review.ownerReply?.text.trim());
  }

  function beginEdit(review: Review) {
    setDrafts((current) => ({ ...current, [review.id]: review.ownerReply?.text ?? '' }));
    setEditing((current) => ({ ...current, [review.id]: true }));
  }

  function cancelEdit(reviewId: string) {
    setEditing((current) => ({ ...current, [reviewId]: false }));
    setDrafts((current) => {
      const next = { ...current };
      delete next[reviewId];
      return next;
    });
  }

  async function reply(review: Review) {
    const text = drafts[review.id] ?? '';
    setError(null);
    setSubmitting(review.id);
    try {
      await saveOwnerReply(shop.id, review.id, text);
      cancelEdit(review.id);
      showToast({ type: 'success', message: 'Reply sent' });
    } catch (replyError) {
      showToast({ type: 'error', message: getUserFriendlyError(replyError, replyError instanceof Error ? replyError.message : 'We could not send that reply.') });
    } finally {
      setSubmitting(null);
    }
  }

  return <View className="mx-auto w-full max-w-2xl gap-4 px-4 py-5 pb-8">
    <Card><CardHeader className="flex-row gap-5"><View className="items-center justify-center"><Text className="text-4xl font-bold">{shop.avgRating.toFixed(1)}</Text><Icon as={Star} size={20} fill="currentColor" className="text-accent" /></View><View className="flex-1 gap-1">{[5, 4, 3, 2, 1].map((rating) => <View key={rating} className="flex-row items-center gap-2"><View className="w-6 flex-row items-center gap-1"><Text className="text-xs">{rating}</Text><Icon as={Star} size={10} fill="currentColor" className="text-accent" /></View><View className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"><View className="h-full bg-accent" style={{ width: `${total ? (counts[String(rating) as keyof typeof counts] / total) * 100 : 0}%` }} /></View><Text className="w-8 text-right text-xs text-muted-foreground">{total ? Math.round((counts[String(rating) as keyof typeof counts] / total) * 100) : 0}%</Text></View>)}</View></CardHeader></Card>
    {error ? <Text accessibilityRole="alert" className="text-destructive">{error}</Text> : null}
    {reviews.map((review) => {
      const replyExists = hasReply(review);
      const isEditing = editing[review.id] === true;
      const draft = drafts[review.id] ?? '';
      return <Card key={review.id}><CardHeader className="gap-3"><View className="flex-row items-start justify-between gap-3"><View className="flex-1"><CardTitle>{review.userName}</CardTitle><ReviewTime review={review} /></View><View className="flex-row items-center gap-1"><Icon as={Star} size={14} fill="currentColor" className="text-accent" /><Text>{review.rating}/5</Text></View></View><CardDescription>{review.text || 'No written comment.'}</CardDescription>{replyExists && !isEditing ? <View className="gap-2 rounded-lg bg-secondary p-3"><OwnerReplyLabel edited={Boolean(review.ownerReply?.editedAt)} /><Text>{review.ownerReply?.text}</Text><Button size="sm" variant="outline" className="self-start" onPress={() => beginEdit(review)}><Icon as={Pencil} size={14} /><Text>Edit</Text></Button></View> : <View className="gap-2"><Input multiline className="min-h-16 py-2" placeholder="Reply to this review…" value={draft} onChangeText={(text) => setDrafts((current) => ({ ...current, [review.id]: text }))} /><View className="flex-row gap-2"><Button size="sm" loading={submitting === review.id} loadingLabel="Sending…" disabled={!draft.trim()} onPress={() => void reply(review)}><Text>{replyExists ? 'Update reply' : 'Post reply'}</Text></Button>{replyExists ? <Button size="sm" variant="outline" onPress={() => cancelEdit(review.id)}><Text>Cancel</Text></Button> : null}</View></View>}</CardHeader></Card>;
    })}
    {reviews.length === 0 ? <View className="items-center gap-2 py-8"><Icon as={Star} size={28} className="text-accent" /><Text className="text-center text-muted-foreground">Customer reviews will appear here.</Text></View> : null}
  </View>;
}
