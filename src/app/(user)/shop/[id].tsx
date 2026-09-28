import { OwnerReplyLabel, ReviewTime } from '@/components/review-edit-markers';
import { useEffect, useMemo, useState } from 'react';
import { Image, Platform, ScrollView, View } from 'react-native';
import { RemoteImage } from '@/components/ui/remote-image';
import { useLocalSearchParams } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, MapPin, Star, Tag, Wifi, type LucideIcon } from 'lucide-react-native';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useCompareStore } from '@/store/compareStore';
import { useSavedShops } from '@/hooks/useSavedShops';
import { haversineKm } from '@/utils/distance';
import { isOpenNow } from '@/utils/hours';
import { formatPriceRange, getPriceBucket } from '@/utils/price';
import { PRODUCT_CATEGORIES } from '@/constants/products';
import { logShopView } from '@/lib/recentlyViewed';
import { submitReview } from '@/lib/reviews';
import { reviewFormSchema, type ReviewFormInput, type ReviewFormValues } from '@/lib/schemas/review';
import { getUserFriendlyError } from '@/lib/errors';
import { toastFormErrors } from '@/lib/form-errors';
import { ScreenHeader } from '@/components/screen-header';
import { sortProducts, toProduct, type Product } from '@/types/product';
import { toReview, type Review } from '@/types/review';
import { toShop, type Shop } from '@/types/shop';
import { ShopLocationMap } from '@/components/shop-location-map';
import { ShopGallery } from '@/components/shop-gallery';
import { EmptyState } from '@/components/empty-state';
import { cloudinaryImageUrl } from '@/lib/cloudinary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useToast } from '@/hooks/useToast';

type ShopTab = 'info' | 'menu' | 'reviews';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useUserLocation();
  const ids = useCompareStore((state) => state.ids);
  const toggle = useCompareStore((state) => state.toggle);
  const { savedShopIds, savingShopId, toggleSavedShop } = useSavedShops();
  const [shop, setShop] = useState<Shop | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<ShopTab>('info');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const { control, handleSubmit, reset } = useForm<ReviewFormInput, any, ReviewFormValues>({ resolver: zodResolver(reviewFormSchema), defaultValues: { rating: 0, text: '' } });

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'shops', id), (snapshot) => {
      setShop(snapshot.exists() ? toShop(snapshot.id, snapshot.data()) : null);
      setLoadError(snapshot.exists() ? null : 'This shop is no longer available.');
    }, (error) => { const message = getUserFriendlyError(error, 'We could not load this shop. Please try again.'); setLoadError(message); showToast({ type: 'error', message }); });
  }, [id, showToast]);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(query(collection(db, 'shops', id, 'reviews'), orderBy('createdAt', 'desc')), (snapshot) => setReviews(snapshot.docs.map((item) => toReview(item.id, item.data()))), (error) => showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not load reviews. Please try again.') }));
  }, [id, showToast]);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      collection(db, 'shops', id, 'products'),
      (snapshot) => setProducts(sortProducts(snapshot.docs.map((item) => toProduct(item.id, item.data())))),
      (error) => { setProducts([]); showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not load this menu. Please try again.') }); },
    );
  }, [id, showToast]);

  useEffect(() => {
    if (!user || !id) return;
    void logShopView(user.uid, id).catch((error) => console.error('Failed to log shop view', error));
  }, [id, user]);

  useEffect(() => {
    const ownReview = reviews.find((review) => review.userId === user?.uid);
    reset(ownReview ? { rating: ownReview.rating, text: ownReview.text } : { rating: 0, text: '' });
  }, [reset, reviews, user]);

  const distanceKm = shop && location ? haversineKm(location.lat, location.lng, shop.lat, shop.lng) : null;
  const ratingCounts = useMemo(() => shop?.ratingCounts ?? reviews.reduce<Record<'1' | '2' | '3' | '4' | '5', number>>((counts, review) => ({ ...counts, [String(review.rating) as keyof typeof counts]: counts[String(review.rating) as keyof typeof counts] + 1 }), { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }), [reviews, shop?.ratingCounts]);

  async function handleReviewSubmit(values: ReviewFormValues) {
    if (!user || !id) return showToast({ type: 'error', message: 'Log in to leave a review.' });
    setIsSubmittingReview(true);
    try {
      await submitReview(id, user.uid, user.displayName || user.email || 'Kapehan guest', values.rating, values.text);
      showToast({ type: 'success', message: reviews.some((review) => review.userId === user.uid) ? 'Review updated' : 'Review posted' });
    } catch (error) {
      showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not post your review. Please try again.') });
    } finally {
      setIsSubmittingReview(false);
    }
  }

  if (!shop) return <View className="flex-1 bg-background"><ScreenHeader title="Shop details" fallbackHref="/(user)" /><View className="flex-1 items-center justify-center p-4"><Text className="text-muted-foreground">{loadError ? 'This shop is unavailable right now.' : 'Loading…'}</Text></View></View>;

  const saved = savedShopIds.includes(shop.id);
  const openNow = isOpenNow(shop.hours);
  const priceChip = getPriceBucket(shop.priceMin) === 'budget' ? 'Affordable' : getPriceBucket(shop.priceMin) === 'moderate' ? 'Moderate' : 'Premium';
  const ownReview = reviews.some((review) => review.userId === user?.uid);

  return <View className="flex-1 bg-background"><ScreenHeader title={shop.name} fallbackHref="/(user)" /><ScrollView className="flex-1" contentContainerClassName="mx-auto w-full max-w-2xl gap-4 pb-8">
    <View className="relative h-64 bg-secondary">
      {shop.photos[0] ? <RemoteImage source={{ uri: cloudinaryImageUrl(shop.photos[0], 1200) }} className="h-full w-full" contentFit="cover" transition={250} /> : <View className="h-full w-full items-center justify-center"><Text className="font-display text-4xl text-primary/30">Kapehan</Text></View>}
    </View>
    <View className="gap-4 px-4"><View><Text className="font-display text-3xl">{shop.name}</Text><Text className="mt-1 text-muted-foreground">{shop.description || shop.address}</Text></View><View className="flex-row flex-wrap items-center gap-2"><Badge variant="secondary"><Text>{priceChip}</Text></Badge><Badge className={openNow ? 'border-transparent bg-success' : undefined} variant="secondary"><Text className={openNow ? 'text-success-foreground' : undefined}>{openNow ? 'Open now' : 'Closed'}</Text></Badge>{(shop.tags ?? []).map((tag) => <Text key={tag} className="text-xs text-muted-foreground">· {tag}</Text>)}</View><View className="flex-row gap-2"><Metric icon={Star} value={shop.avgRating.toFixed(1)} label={`${shop.reviewCount} reviews`} /><Metric icon={MapPin} value={distanceKm == null ? '—' : `${distanceKm.toFixed(1)} km`} label="from you" /><Metric icon={Tag} value={formatPriceRange(shop.priceMin, shop.priceMax)} label="price range" /></View></View>
    <View className="flex-row border-b border-border px-4">{(['info', 'menu', 'reviews'] as ShopTab[]).map((item) => <Button key={item} variant="ghost" className={tab === item ? `flex-1 border-b-2 border-accent rounded-none ${Platform.select({ web: 'hover:bg-transparent dark:hover:bg-transparent' }) ?? ''}` : 'flex-1 rounded-none'} onPress={() => setTab(item)}><Text className={tab === item ? 'font-bold text-accent' : undefined}>{item === 'reviews' ? `Reviews (${shop.reviewCount})` : item[0].toUpperCase() + item.slice(1)}</Text></Button>)}</View>
    <View className="px-4">{tab === 'info' ? <InfoTab shop={shop} location={location} saved={saved} saving={savingShopId === shop.id} compared={ids.includes(shop.id)} onSave={() => void toggleSavedShop(shop.id)} onCompare={() => { toggle(shop.id); showToast({ type: 'success', message: ids.includes(shop.id) ? 'Removed from comparison' : 'Added to comparison' }); }} /> : null}{tab === 'menu' ? <MenuTab products={products} /> : null}{tab === 'reviews' ? <ReviewsTab reviews={reviews} ratingCounts={ratingCounts} user={user ? { uid: user.uid } : null} control={control} isSubmitting={isSubmittingReview} onSubmit={handleSubmit(handleReviewSubmit, (errors) => toastFormErrors(errors, showToast))} hasOwnReview={ownReview} /> : null}</View>
  </ScrollView></View>;
}

function Metric({ icon, value, label }: { icon?: LucideIcon; value: string; label: string }) {
  return (
    <View className="flex-1 items-center gap-1 rounded-xl bg-secondary px-2 py-3">
      <View className="h-4 items-center justify-center">
        {icon ? <Icon as={icon} size={15} fill="currentColor" className="text-accent" /> : null}
      </View>
      <Text className="text-center font-bold">{value}</Text>
      <Text className="text-center text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}

function InfoTab({ shop, location, saved, saving, compared, onSave, onCompare }: { shop: Shop; location: { lat: number; lng: number } | null; saved: boolean; saving: boolean; compared: boolean; onSave: () => void; onCompare: () => void }) {
  return <View className="gap-4"><View className="gap-2"><Text className="text-xl font-bold">Location reference</Text><ShopLocationMap shop={shop} userLocation={location} /></View><ShopGallery photos={shop.photos} shopName={shop.name} /><View className="flex-row gap-2"><Button className="flex-1" variant={saved ? 'default' : 'outline'} loading={saving} loadingLabel="Saving…" onPress={onSave}><Text>{saved ? 'Saved' : 'Save shop'}</Text></Button><Button className="flex-1" variant={compared ? 'secondary' : 'default'} onPress={onCompare}><Text>{compared ? 'In comparison' : 'Add to compare'}</Text></Button></View><Card><CardHeader className="gap-3"><CardTitle>Amenities</CardTitle><View className="gap-3"><Amenity icon={<Icon as={Wifi} size={16} className={shop.hasWifi ? 'text-success-foreground' : 'text-muted-foreground'} />} label={shop.hasWifi ? 'Free WiFi' : 'No WiFi'} /><Amenity icon={<Icon as={MapPin} size={16} className="text-primary" />} label={openAmenityLabel(shop)} />{(shop.tags ?? []).map((tag) => <Amenity key={tag} icon={<Icon as={Check} size={16} className="text-accent" />} label={tag} />)}</View></CardHeader></Card></View>;
}

function openAmenityLabel(shop: Shop) { return isOpenNow(shop.hours) ? 'Open now' : 'Currently closed'; }
function Amenity({ icon, label }: { icon: React.ReactNode; label: string }) { return <View className="flex-row items-center gap-2">{icon}<Text className="text-sm">{label}</Text></View>; }

function MenuTab({ products }: { products: Product[] }) {
  return <View className="gap-5">{products.length === 0 ? <EmptyState title="Menu coming soon" description="This shop has not added its drinks and bites yet." /> : null}{PRODUCT_CATEGORIES.map((category) => { const items = products.filter((product) => product.category === category); if (!items.length) return null; return <View key={category} className="gap-2"><Text className="text-sm font-bold tracking-wider text-muted-foreground">{category.toUpperCase()}</Text>{items.map((product) => <Card key={product.id} className="py-3"><CardHeader className="min-w-0"><View className="w-full min-w-0 flex-row items-center gap-3"><View className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">{product.photoUrl ? <Image source={{ uri: cloudinaryImageUrl(product.photoUrl, 160) }} className="h-full w-full" resizeMode="cover" /> : null}</View><View className="flex-1 min-w-0 shrink flex-row justify-between gap-3"><View className="flex-1 min-w-0 shrink"><CardTitle numberOfLines={1} ellipsizeMode="tail" className="min-w-0 shrink">{product.name}{!product.available ? ' · Unavailable' : ''}</CardTitle>{product.description ? <CardDescription numberOfLines={2} ellipsizeMode="tail" className="min-w-0 shrink">{product.description}</CardDescription> : null}</View><Text numberOfLines={1} ellipsizeMode="tail" className="min-w-0 shrink font-bold">PHP {product.price}</Text></View></View></CardHeader></Card>)}</View>; })}</View>;
}

function ReviewsTab({ reviews, ratingCounts, user, control, isSubmitting, onSubmit, hasOwnReview }: { reviews: Review[]; ratingCounts: Record<'1' | '2' | '3' | '4' | '5', number>; user: { uid: string } | null; control: ReturnType<typeof useForm<ReviewFormInput, any, ReviewFormValues>>['control']; isSubmitting: boolean; onSubmit: () => void; hasOwnReview: boolean }) {
  const total = Object.values(ratingCounts).reduce((sum, count) => sum + count, 0);
  return <View className="gap-4"><Card className="py-4"><CardHeader className="gap-2"><CardTitle>Ratings overview</CardTitle>{[5, 4, 3, 2, 1].map((rating) => <View key={rating} className="flex-row items-center gap-2"><View className="w-8 flex-row items-center gap-1"><Text className="text-sm">{rating}</Text><Icon as={Star} size={12} fill="currentColor" className="text-accent" /></View><View className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"><View className="h-full bg-accent" style={{ width: `${total ? ((ratingCounts[String(rating) as keyof typeof ratingCounts] / total) * 100) : 0}%` }} /></View><Text className="w-10 text-right text-xs text-muted-foreground">{total ? Math.round((ratingCounts[String(rating) as keyof typeof ratingCounts] / total) * 100) : 0}%</Text></View>)}</CardHeader></Card>{user ? <Card><CardHeader className="gap-3"><CardTitle>Your review</CardTitle><Controller control={control} name="rating" render={({ field }) => <View className="flex-row gap-1">{[1, 2, 3, 4, 5].map((star) => <Button key={star} size="icon" variant={star <= field.value ? 'default' : 'outline'} onPress={() => field.onChange(star)}><Icon as={Star} fill={star <= field.value ? 'currentColor' : 'none'} className={star <= field.value ? 'text-accent-foreground' : 'text-accent'} /></Button>)}</View>} /><Controller control={control} name="text" render={({ field }) => <Input className="min-h-24 py-3" multiline maxLength={1000} placeholder="Share your experience (optional)" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} />} /><Button loading={isSubmitting} loadingLabel="Posting review…" onPress={onSubmit}><Text>{hasOwnReview ? 'Update review' : 'Post review'}</Text></Button></CardHeader></Card> : <Text className="text-muted-foreground">Log in to leave a review.</Text>}{reviews.map((review) => <Card key={review.id}><CardHeader><View className="flex-row justify-between gap-2"><CardTitle className="flex-1">{review.userName}</CardTitle><View className="flex-row items-center gap-1"><Icon as={Star} size={14} fill="currentColor" className="text-accent" /><Text>{review.rating}/5</Text></View></View><CardDescription>{review.text || 'No written comment.'}</CardDescription><ReviewTime review={review} />{review.ownerReply?.text ? <View className="mt-2 rounded-lg bg-secondary p-3"><OwnerReplyLabel edited={Boolean(review.ownerReply?.editedAt)} /><Text className="mt-1 text-sm">{review.ownerReply.text}</Text></View> : null}</CardHeader></Card>)}{reviews.length === 0 ? <View className="items-center gap-2 py-6"><Icon as={Star} size={28} className="text-accent" /><Text className="text-center text-muted-foreground">No reviews yet. Be the first to share one.</Text></View> : null}</View>;
}
