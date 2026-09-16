import { useEffect, useState } from 'react';
import { ScrollView, Image, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useCompareStore } from '@/store/compareStore';
import { isOpenNow } from '@/utils/hours';
import { ShopLocationMap } from '@/components/shop-location-map';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Shop } from '@/types/shop';
import { formatPriceRange } from '@/utils/price';
import { dayjs } from '@/lib/dayjs';
import { reviewFormSchema, type ReviewFormInput, type ReviewFormValues } from '@/lib/schemas/review';
import { submitReview } from '@/lib/reviews';
import { logShopView } from '@/lib/recentlyViewed';
import type { Review } from '@/types/review';
import type { AppUserDocument } from '@/types/user';
import { getUserFriendlyError } from '@/lib/errors';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const location = useUserLocation();
  const { ids, toggle } = useCompareStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [saved, setSaved] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ReviewFormInput, any, ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { rating: 5, text: '' },
  });

  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      doc(db, 'shops', id),
      (snap) => {
        setLoadError(snap.exists() ? null : 'This shop is no longer available.');
        setShop(snap.exists() ? ({ id: snap.id, ...snap.data() } as Shop) : null);
      },
      (error) => setLoadError(getUserFriendlyError(error, 'We could not load this shop. Please try again.')),
    );
  }, [id]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const profile = snap.data() as AppUserDocument | undefined;
        setSaved((profile?.savedShopIds ?? []).includes(id));
        setProfileName(profile?.name?.trim() || null);
      },
      (error) => setActionError(getUserFriendlyError(error, 'We could not load your saved shops. Please try again.')),
    );
  }, [user, id]);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      query(collection(db, 'shops', id, 'reviews'), orderBy('createdAt', 'desc')),
      (snap) => setReviews(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Review)),
      (error) => setLoadError(getUserFriendlyError(error, 'We could not load reviews. Please try again.')),
    );
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    void logShopView(user.uid, id).catch(() => {
      // Viewing a shop remains available if the optional history update is offline.
    });
  }, [id, user]);

  useEffect(() => {
    const ownReview = reviews.find((review) => review.userId === user?.uid);
    reset(ownReview ? { rating: ownReview.rating, text: ownReview.text } : { rating: 5, text: '' });
  }, [reset, reviews, user]);

  async function toggleSave() {
    if (!user) {
      setActionError('Log in to save shops.');
      return;
    }
    if (!id) return;
    setActionError(null);
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { savedShopIds: saved ? arrayRemove(id) : arrayUnion(id) });
    } catch (error) {
      setActionError(getUserFriendlyError(error, 'We could not update your saved shops. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReviewSubmit(values: ReviewFormValues) {
    if (!user) {
      setActionError('Log in to leave a review.');
      return;
    }
    if (!id) return;
    setActionError(null);
    setIsSubmittingReview(true);
    try {
      await submitReview(id, user.uid, profileName ?? user.email ?? 'Kapehan guest', values.rating, values.text);
    } catch (error) {
      setActionError(getUserFriendlyError(error, 'We could not post your review. Please try again.'));
    } finally {
      setIsSubmittingReview(false);
    }
  }

  if (!shop) return <Text className="p-4 text-destructive">{loadError ?? 'Loading…'}</Text>;

  return (
    <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="gap-4">
      <View className="flex-row justify-between items-start">
        <Text className="text-2xl font-bold flex-1">{shop.name}</Text>
        <Badge variant={isOpenNow(shop.hours) ? 'default' : 'secondary'}>
          <Text>{isOpenNow(shop.hours) ? 'Open now' : 'Closed'}</Text>
        </Badge>
      </View>
      <Text className="text-muted-foreground">{shop.address}</Text>
      <Text>{formatPriceRange(shop.priceMin, shop.priceMax)} · {shop.wifiRating} wifi</Text>

      {shop.photos.length > 0 && (
        <ScrollView horizontal className="gap-2">
          {shop.photos.map((url) => <Image key={url} source={{ uri: url }} className="w-40 h-40 rounded-xl mr-2" />)}
        </ScrollView>
      )}

      <ShopLocationMap shop={shop} userLocation={location} />

      <View className="flex-row gap-2">
        <Button className="flex-1" variant={saved ? 'default' : 'outline'} loading={isSaving} loadingLabel="Saving…" onPress={toggleSave}>
          <Text>{saved ? 'Saved' : 'Save'}</Text>
        </Button>
        <Button className="flex-1" variant={ids.includes(shop.id) ? 'default' : 'outline'} onPress={() => toggle(shop.id)}>
          <Text>{ids.includes(shop.id) ? 'Added to compare' : '+ Compare'}</Text>
        </Button>
      </View>
      {actionError && <Text accessibilityRole="alert" className="text-destructive">{actionError}</Text>}
      {loadError && <Text accessibilityRole="alert" className="text-destructive">{loadError}</Text>}

      <View className="gap-3">
        <Text className="text-xl font-semibold">Reviews</Text>
        {user ? (
          <Card>
            <CardHeader className="gap-3">
              <CardTitle>Your review</CardTitle>
              <Controller control={control} name="rating" render={({ field }) => (
                <View className="flex-row gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button key={star} size="icon" variant={star <= field.value ? 'default' : 'outline'} onPress={() => field.onChange(star)}>
                      <Text>{star <= field.value ? '★' : '☆'}</Text>
                    </Button>
                  ))}
                </View>
              )} />
              {errors.rating && <Text className="text-destructive">{errors.rating.message}</Text>}
              <Controller control={control} name="text" render={({ field }) => (
                <Input className="min-h-24 py-3" multiline maxLength={1000} placeholder="Share your experience (optional)" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} />
              )} />
              {errors.text && <Text className="text-destructive">{errors.text.message}</Text>}
              <Button loading={isSubmittingReview} loadingLabel="Posting review…" onPress={handleSubmit(handleReviewSubmit)}>
                <Text>{reviews.some((review) => review.userId === user.uid) ? 'Update review' : 'Post review'}</Text>
              </Button>
            </CardHeader>
          </Card>
        ) : (
          <Text className="text-muted-foreground">Log in to leave a review.</Text>
        )}

        {reviews.map((review) => (
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
        {reviews.length === 0 && <Text className="text-muted-foreground">No reviews yet. Be the first to share one.</Text>}
      </View>
    </ScrollView>
  );
}
