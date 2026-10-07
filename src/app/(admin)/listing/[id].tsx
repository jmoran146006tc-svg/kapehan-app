import { useEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore';
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
import { blurActiveElement, goBack } from '@/lib/navigation';
import { DAYS } from '@/lib/schemas/shop';
import { sortProducts, toProduct, type Product } from '@/types/product';
import { useToast } from '@/hooks/useToast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScreenHeader } from '@/components/screen-header';
import { LinearGradient } from '@/components/ui/linear-gradient';
import { PALETTE } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { toReview, type Review } from '@/types/review';
import { ReviewPhotoStrip } from '@/components/review-photo-strip';
import { ReviewTime } from '@/components/review-edit-markers';
import { RemoveReviewDialog } from '@/components/remove-review-dialog';
import { removeReviewAsAdmin, resolveOpenReportsForReview } from '@/lib/moderation';
import { EmptyState } from '@/components/empty-state';

interface ShopDoc {
  name: string;
  address?: string;
  priceMin?: number;
  priceMax?: number;
  hasWifi?: boolean;
  tags?: string[];
  description?: string;
  photos?: string[];
  hours?: Partial<Record<(typeof DAYS)[number], { open: string; close: string; closed: boolean }>>;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  removalRequest?: { reason: string } | null;
  ownerId?: string;
}

export default function AdminReviewListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const { user: admin, role } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsFailed, setReviewsFailed] = useState(false);
  const [removingReview, setRemovingReview] = useState<Review | null>(null);
  const [shop, setShop] = useState<ShopDoc | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id || role !== 'admin') return;
    return onSnapshot(query(collection(db, 'shops', id, 'reviews'), orderBy('createdAt', 'desc')), (snapshot) => {
      setReviews(snapshot.docs.map((item) => toReview(item.id, item.data())));
      setReviewsLoading(false); setReviewsFailed(false);
    }, (error) => {
      setReviewsLoading(false); setReviewsFailed(true);
      showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not load reviews. Please try again.') });
    });
  }, [id, role, showToast]);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'shops', id), (snap) => {
      setShop(snap.exists() ? (snap.data() as ShopDoc) : null);
    });
  }, [id]);
  useEffect(() => {
    if (!id) return;
    return onSnapshot(collection(db, 'shops', id, 'products'), (snap) => {
      setProducts(sortProducts(snap.docs.map((item) => toProduct(item.id, item.data()))));
    });
  }, [id]);

  async function setStatus(status: 'approved' | 'rejected') {
    if (!id) return;
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
      showToast({ type: 'success', message: status === 'approved' ? 'Listing approved' : 'Listing rejected' });
      goBack('/(admin)');
    } catch (actionError) {
      showToast({ type: 'error', message: getUserFriendlyError(actionError, 'We could not update this listing. Please try again.') });
      setUpdating(false);
    }
  }

  if (!shop) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Review Listing" fallbackHref="/(admin)" />
        <View className="flex-1 items-center justify-center"><View className="w-full max-w-2xl gap-4 p-4"><Skeleton className="h-12 w-2/3" /><Skeleton className="h-48 w-full" /><Skeleton className="h-32 w-full" /></View></View>
      </View>
    );
  }

  const badgeVariant = getListingStatusBadgeVariant(shop.status);

  return (
    <View className="flex-1 bg-background">
    <ScreenHeader title="Review Listing" fallbackHref="/(admin)" />
    <ScrollView className="flex-1 px-4" contentContainerClassName="mx-auto w-full max-w-2xl gap-4 py-4 pb-8">
      <Card>
        <CardHeader className="gap-4">
          <View className="flex-row items-start justify-between gap-3">
            <CardTitle className="flex-1 text-2xl">{shop.name}</CardTitle>
            <Badge variant={badgeVariant}><Text>{shop.status}</Text></Badge>
          </View>
          {shop.address ? <Text className="text-muted-foreground">{shop.address}</Text> : null}
          {shop.description ? <Text className="text-muted-foreground">{shop.description}</Text> : null}
          {shop.removalRequest ? <Text className="rounded-lg bg-pending/60 p-3 text-pending-foreground">Removal requested: {shop.removalRequest.reason}. Review this request from the Owners list.</Text> : null}
          {shop.photos?.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">{shop.photos.map((photo, index) => <Image key={`${photo}-${index}`} source={{ uri: photo }} className="h-48 w-60 rounded-2xl" resizeMode="cover" />)}</ScrollView> : <LinearGradient colors={[PALETTE.accentSoft, PALETTE.accent]} className="h-48 w-full items-center justify-center rounded-2xl"><Text className="font-display text-6xl text-primary/50">{shop.name.slice(0, 1).toUpperCase()}</Text></LinearGradient>}
          <View className="gap-2">
            {(shop.priceMin != null || shop.priceMax != null) ? <Text>Price: {formatPriceRange(shop.priceMin, shop.priceMax)}</Text> : null}
            {shop.hasWifi != null ? <Text>{shop.hasWifi ? 'WiFi available' : 'No WiFi'}</Text> : null}
            {shop.tags?.length ? <Text>Features: {shop.tags.join(', ')}</Text> : null}
          </View>
        </CardHeader>
      </Card>
      <Card><CardHeader className="gap-3"><CardTitle>Opening hours</CardTitle>
        {DAYS.map((day) => <View key={day} className="flex-row justify-between"><Text className="uppercase text-muted-foreground">{day}</Text><Text>{shop.hours?.[day] && !shop.hours[day]?.closed ? `${shop.hours[day]?.open}–${shop.hours[day]?.close}` : 'Closed'}</Text></View>)}
      </CardHeader></Card>
      <Card><CardHeader className="gap-3"><CardTitle>Menu</CardTitle>
        {products.map((product) => <View key={product.id} className="flex-row justify-between gap-3 border-b border-border py-2"><View className="flex-1"><Text className="font-semibold">{product.name}</Text><Text className="text-xs text-muted-foreground">{product.category} · {product.available ? 'Available' : 'Unavailable'}</Text></View><Text>₱{product.price.toLocaleString()}</Text></View>)}
        {products.length === 0 ? <Text className="text-muted-foreground">No menu items yet.</Text> : null}
      </CardHeader></Card>

      <Card><CardHeader className="gap-4">
        <CardTitle>Reviews ({reviews.length})</CardTitle>
        {reviewsLoading ? <Skeleton className="h-28 w-full" /> : reviewsFailed ? <Text className="text-muted-foreground">Reviews are unavailable right now.</Text> : !reviews.length ? <EmptyState title="No reviews yet" description="Customer reviews will appear here." /> : null}
        {reviews.map((review) => <View key={review.id} className="gap-2 border-b border-border pb-4">
          <View className="flex-row justify-between gap-3"><Text className="flex-1 font-semibold">{review.userName}</Text><Text>{review.rating}/5</Text></View>
          <Text>{review.text || 'No written comment.'}</Text>
          <ReviewPhotoStrip photos={review.photos} />
          <ReviewTime review={review} />
          <Button className="min-h-11 self-start border-destructive" variant="outline" disabled={updating} onPress={() => { blurActiveElement(); setRemovingReview(review); }}><Text className="text-destructive">Remove</Text></Button>
        </View>)}
      </CardHeader></Card>

      <SafeAreaView edges={['bottom']}>
        {shop.status === 'pending' ? (
          <View className="flex-row gap-3">
            <Button className="flex-1 bg-success-foreground" disabled={updating} onPress={() => setStatus('approved')}>
              <Icon as={Check} size={16} className="text-white" />
              <Text>Approve Listing</Text>
            </Button>
            <Button className="flex-1 border-destructive" variant="outline" disabled={updating} onPress={() => setStatus('rejected')}>
              <Icon as={X} size={16} className="text-destructive" />
              <Text className="text-destructive">Reject</Text>
            </Button>
          </View>
        ) : null}
        {shop.status === 'approved' && !shop.removalRequest ? <Button variant="outline" className="border-destructive" disabled={updating} onPress={() => setStatus('rejected')}><Icon as={X} size={16} className="text-destructive" /><Text className="text-destructive">Revoke Listing</Text></Button> : null}
        {shop.status === 'rejected' ? <Button className="bg-success-foreground" disabled={updating} onPress={() => setStatus('approved')}><Icon as={Check} size={16} className="text-white" /><Text>Re-enlist Listing</Text></Button> : null}
      </SafeAreaView>
    </ScrollView>
    <RemoveReviewDialog open={removingReview !== null} reviewerName={removingReview?.userName ?? ''} onOpenChange={(open) => { if (!open) { blurActiveElement(); setRemovingReview(null); } }} onConfirm={async (reasonLabel) => {
      if (!admin || !removingReview) return;
      setUpdating(true);
      try {
        const result = await removeReviewAsAdmin({ shopId: id, reviewId: removingReview.id, reasonLabel });
        showToast({ type: 'success', message: result.notified ? 'Review removed and reviewer notified.' : 'Review removed. The reviewer no longer has an account to notify.' });
        if (!await resolveOpenReportsForReview({ shopId: id, reviewId: removingReview.id, adminUid: admin.uid })) showToast({ type: 'info', message: 'Review removed, but some reports still need to be marked actioned.' });
      } finally { setUpdating(false); }
    }} />
    </View>
  );
}
