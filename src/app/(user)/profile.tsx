import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Switch, View } from 'react-native';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, MapPin, Star } from 'lucide-react-native';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useShops } from '@/hooks/useShops';
import { useSavedShops } from '@/hooks/useSavedShops';
import { dayjs } from '@/lib/dayjs';
import type { AppUserDocument, RecentlyViewedEntry } from '@/types/user';
import { preferencesSchema, type PreferencesValues } from '@/lib/schemas/preferences';
import { getUserFriendlyError } from '@/lib/errors';
import { withTimeout } from '@/lib/timeout';
import { PRICE_BUCKET_LABELS, type PriceBucket } from '@/utils/price';
import { TAG_OPTIONS } from '@/constants/tags';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/filter-chip';
import { Icon } from '@/components/ui/icon';
import { LogoutButton } from '@/components/logout-button';
import { StatTile } from '@/components/stat-tile';
import { Text } from '@/components/ui/text';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { shops } = useShops();
  const { savedShopIds, savingShopId, toggleSavedShop, error: savedError } = useSavedShops();
  const [profile, setProfile] = useState<AppUserDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { control, handleSubmit, reset } = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { wifiOnly: false, tags: [], priceBuckets: [], openNowOnly: false },
  });

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      const nextProfile = snapshot.data() as AppUserDocument | undefined;
      setProfile(nextProfile ?? null);
      const preferences = nextProfile?.preferences;
      reset({ wifiOnly: preferences?.wifiOnly ?? false, tags: preferences?.tags ?? [], priceBuckets: preferences?.priceBuckets ?? [], openNowOnly: preferences?.openNowOnly ?? false });
    }, (error) => setLoadError(getUserFriendlyError(error, 'We could not load your profile. Please try again.')));
  }, [reset, user]);

  const savedShops = useMemo(() => shops.filter((shop) => savedShopIds.includes(shop.id)), [savedShopIds, shops]);
  const viewedEntries = [...(profile?.recentlyViewed ?? [])].sort((left, right) => timestampMs(right) - timestampMs(left));
  const viewedShops = viewedEntries.map((entry) => ({ entry, shop: shops.find((shop) => shop.id === entry.shopId) })).filter((item): item is { entry: RecentlyViewedEntry; shop: NonNullable<typeof item.shop> } => Boolean(item.shop));
  const initials = (profile?.name || user?.email || 'K').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  async function savePreferences(values: PreferencesValues) {
    if (!user) return setSaveError('Log in to save preferences.');
    setSaveError(null);
    setIsSaving(true);
    try {
      await withTimeout(updateDoc(doc(db, 'users', user.uid), { preferences: values }));
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'unknown';
      const message = error instanceof Error ? error.message : String(error);
      console.warn('Profile preference save failed', { code, message });
      setSaveError(getUserFriendlyError(error, 'We could not save your preferences. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  }

  return <ScrollView className="flex-1 bg-background" contentContainerClassName="mx-auto w-full max-w-2xl gap-5 pb-8">
    <View className="gap-4 bg-primary px-4 pb-6 pt-12"><View className="flex-row items-center justify-between"><Text className="text-2xl font-bold text-primary-foreground">My Profile</Text><LogoutButton size="sm" variant="ghost" /></View><View className="flex-row items-center gap-3"><View className="h-14 w-14 items-center justify-center rounded-full bg-accent"><Text className="text-xl font-bold text-white">{initials}</Text></View><View className="flex-1"><Text className="text-lg font-bold text-primary-foreground">{profile?.name || 'Kapehan guest'}</Text><Text className="text-sm text-primary-foreground/75">{profile?.email || user?.email}</Text><View className="mt-1 flex-row items-center gap-1"><Icon as={MapPin} size={13} className="text-primary-foreground/70" /><Text className="text-xs text-primary-foreground/70">Tagum City</Text></View></View></View><View className="flex-row gap-2"><StatTile value={profile?.visitCount ?? 0} label="Visits" tone="onDark" className="border-primary-foreground/10 bg-primary-foreground/10" /><StatTile value={profile?.reviewCount ?? 0} label="Reviews" tone="onDark" className="border-primary-foreground/10 bg-primary-foreground/10" /><StatTile value={savedShopIds.length} label="Favorites" tone="onDark" className="border-primary-foreground/10 bg-primary-foreground/10" /></View></View>
    <View className="gap-5 px-4">
      {loadError || savedError ? <Text accessibilityRole="alert" className="text-destructive">{loadError || savedError}</Text> : null}
      <View className="gap-3"><Text className="text-xl font-bold">Favorite Shops</Text>{savedShops.map((shop) => <View key={shop.id} className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3"><View className="h-12 w-12 overflow-hidden rounded-lg bg-secondary">{shop.photos[0] ? <Image source={{ uri: shop.photos[0] }} className="h-full w-full" /> : null}</View><View className="flex-1"><Text className="font-semibold">{shop.name}</Text><View className="flex-row items-center gap-1"><Icon as={Star} size={14} fill="currentColor" className="text-accent" /><Text className="text-sm text-muted-foreground">{shop.avgRating.toFixed(1)} · {shop.reviewCount} reviews</Text></View></View><Button size="icon" variant="ghost" loading={savingShopId === shop.id} loadingLabel="…" onPress={() => void toggleSavedShop(shop.id)}><Icon as={Heart} fill="currentColor" className="text-accent" /></Button></View>)}{savedShops.length === 0 ? <Text className="text-muted-foreground">Save shops you want to revisit.</Text> : null}</View>
      <View className="gap-3"><Text className="text-xl font-bold">Visit History</Text>{viewedShops.map(({ entry, shop }) => <View key={`${entry.shopId}-${timestampMs(entry)}`} className="rounded-xl border border-border bg-card p-3"><Text className="font-semibold">{shop.name}</Text><Text className="text-sm text-muted-foreground">{entry.viewedAt ? dayjs(entry.viewedAt.toDate()).format('MMM D, YYYY') : 'Recently viewed'}</Text></View>)}{viewedShops.length === 0 ? <Text className="text-muted-foreground">Shops you visit will appear here.</Text> : null}</View>
      <View className="gap-3"><Text className="text-xl font-bold">Search Preferences</Text><Controller control={control} name="wifiOnly" render={({ field }) => <View className="flex-row items-center justify-between rounded-xl border border-border bg-card p-4"><View className="flex-1 pr-4"><Text className="font-semibold">Only show shops with WiFi</Text><Text className="mt-1 text-sm text-muted-foreground">Filter your search to places with a WiFi connection.</Text></View><Switch value={field.value} onValueChange={field.onChange} trackColor={{ false: '#CBBEAE', true: '#D9722F' }} thumbColor="#FFF9F0" accessibilityLabel="Only show shops with WiFi" /></View>} /><Controller control={control} name="priceBuckets" render={({ field }) => <View className="gap-2"><Text className="font-semibold">Price tier</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">{(['budget', 'moderate', 'premium'] as PriceBucket[]).map((bucket) => <FilterChip key={bucket} label={PRICE_BUCKET_LABELS[bucket]} selected={field.value.includes(bucket)} onPress={() => field.onChange(field.value.includes(bucket) ? field.value.filter((value) => value !== bucket) : [...field.value, bucket])} />)}</ScrollView></View>} /><Controller control={control} name="tags" render={({ field }) => <View className="gap-2"><Text className="font-semibold">Favorite features</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">{TAG_OPTIONS.map((tag) => <FilterChip key={tag} label={tag} selected={field.value.includes(tag)} onPress={() => field.onChange(field.value.includes(tag) ? field.value.filter((value) => value !== tag) : [...field.value, tag])} />)}</ScrollView></View>} /><Controller control={control} name="openNowOnly" render={({ field }) => <Button variant={field.value ? 'default' : 'outline'} onPress={() => field.onChange(!field.value)}><Text>{field.value ? 'Open now only' : 'Include closed shops'}</Text></Button>} /><Button loading={isSaving} loadingLabel="Saving…" onPress={handleSubmit(savePreferences)}><Text>Save preferences</Text></Button>{saveError ? <Text accessibilityRole="alert" className="text-destructive">{saveError}</Text> : null}</View>
    </View>
  </ScrollView>;
}

function timestampMs(entry: RecentlyViewedEntry) {
  return entry.viewedAt?.toMillis?.() ?? 0;
}
