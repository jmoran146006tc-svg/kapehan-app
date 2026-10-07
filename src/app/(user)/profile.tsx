import { AnimatedView } from '@/components/ui/animated';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, Switch, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
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
import type { Shop } from '@/types/shop';
import { preferencesSchema, type PreferencesValues } from '@/lib/schemas/preferences';
import { getUserFriendlyError } from '@/lib/errors';
import { useAsyncToastAction } from '@/hooks/useAsyncToastAction';
import { withTimeout } from '@/lib/timeout';
import { cloudinaryImageUrl } from '@/lib/cloudinary';
import { PRICE_BUCKET_LABELS, type PriceBucket } from '@/utils/price';
import { TAG_OPTIONS } from '@/constants/tags';
import { DISTANCE_OPTIONS_KM } from '@/constants/distance';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { FilterChip } from '@/components/filter-chip';
import { Icon } from '@/components/ui/icon';
import { LogoutButton } from '@/components/logout-button';
import { Text } from '@/components/ui/text';
import { useToast } from '@/hooks/useToast';
import { GradientHeader } from '@/components/gradient-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { PALETTE } from '@/constants/theme';
import { enter } from '@/lib/motion';

type ProfileRow =
  | { kind: 'saved'; shop: Shop }
  | { kind: 'visit'; shop: Shop; entry: RecentlyViewedEntry }
  | { kind: 'heading' }
  | { kind: 'emptySaved' }
  | { kind: 'emptyVisit' };

export default function ProfileScreen() {
  const { user } = useAuth();
  const { shops } = useShops();
  const { savedShopIds, savingShopId, toggleSavedShop } = useSavedShops();
  const [profile, setProfile] = useState<AppUserDocument | null>(null);
  const { run: runToastAction, pending: isSaving } = useAsyncToastAction();
  const { showToast } = useToast();
  const { control, handleSubmit, reset } = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { wifiOnly: false, tags: [], priceBuckets: [], openNowOnly: false, maxDistanceKm: null },
  });

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      const nextProfile = snapshot.data() as AppUserDocument | undefined;
      setProfile(nextProfile ?? null);
      const preferences = nextProfile?.preferences;
      reset({ wifiOnly: preferences?.wifiOnly ?? false, tags: preferences?.tags ?? [], priceBuckets: preferences?.priceBuckets ?? [], openNowOnly: preferences?.openNowOnly ?? false, maxDistanceKm: preferences?.maxDistanceKm ?? null });
    }, (error) => showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not load your profile. Please try again.') }));
  }, [reset, showToast, user]);

  const rows = useMemo<ProfileRow[]>(() => {
    const shopById = new Map(shops.map((shop) => [shop.id, shop]));
    const saved = savedShopIds.map((id) => shopById.get(id)).filter((shop): shop is Shop => Boolean(shop));
    const visits = [...(profile?.recentlyViewed ?? [])]
      .sort((left, right) => timestampMs(right) - timestampMs(left))
      .map((entry) => ({ entry, shop: shopById.get(entry.shopId) }))
      .filter((item): item is { entry: RecentlyViewedEntry; shop: Shop } => Boolean(item.shop))
      .slice(0, 5);
    return [
      ...saved.map((shop): ProfileRow => ({ kind: 'saved', shop })),
      ...(!saved.length ? [{ kind: 'emptySaved' } as const] : []),
      { kind: 'heading' },
      ...visits.map(({ entry, shop }): ProfileRow => ({ kind: 'visit', entry, shop })),
      ...(!visits.length ? [{ kind: 'emptyVisit' } as const] : []),
    ];
  }, [profile?.recentlyViewed, savedShopIds, shops]);
  const initials = (profile?.name || user?.email || 'K').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  async function savePreferences(values: PreferencesValues) {
    if (!user) return showToast({ type: 'error', message: 'Log in to save preferences.' });
    await runToastAction(
      () => withTimeout(updateDoc(doc(db, 'users', user.uid), { preferences: values })),
      { success: 'Preferences saved', error: 'We could not save your preferences. Please try again.', onError: (error) => {
        const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'unknown';
        const message = error instanceof Error ? error.message : String(error);
        console.warn('Profile preference save failed', { code, message });
      } },
    );
  }

  return (
    <FlatList
      className="flex-1 bg-background"
      data={rows}
      keyExtractor={(row, index) => row.kind === 'saved' ? `saved-${row.shop.id}` : row.kind === 'visit' ? `visit-${row.entry.shopId}` : `${row.kind}-${index}`}
      initialNumToRender={8}
      windowSize={7}
      contentContainerClassName="mx-auto w-full max-w-2xl gap-3 pb-8"
      ListHeaderComponent={
        <View className="gap-5">
          <StatusBar style="light" />
          <GradientHeader className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-display text-2xl text-primary-foreground">My Profile</Text>
              <LogoutButton size="sm" variant="ghost" />
            </View>
            <View className="flex-row items-center gap-3">
              <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-gold bg-accent">
                <Text className="text-xl font-bold text-white">{initials}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-primary-foreground">{profile?.name || 'Kapehan guest'}</Text>
                <Text className="text-sm text-primary-foreground/75">{profile?.email || user?.email}</Text>
                <View className="mt-1 flex-row items-center gap-1">
                  <Icon as={MapPin} size={13} className="text-primary-foreground/70" />
                  <Text className="text-xs text-primary-foreground/70">Tagum City</Text>
                </View>
              </View>
            </View>
            <View className="flex-row justify-between border-t border-primary-foreground/20 pt-3">
              {[
                { label: 'Visits', value: profile?.visitCount ?? 0 },
                { label: 'Reviews', value: profile?.reviewCount ?? 0 },
                { label: 'Favorites', value: savedShopIds.length },
              ].map((metric) => (
                <View key={metric.label} className="items-center">
                  <CountUpNumber target={metric.value} />
                  <Text className="text-xs text-primary-foreground/70">{metric.label}</Text>
                </View>
              ))}
            </View>
          </GradientHeader>
          <Text className="px-4 font-display text-xl">Favorite Shops</Text>
        </View>
      }
      renderItem={({ item, index }) => (
        <AnimatedView entering={enter(index)} className="px-4">
          {item.kind === 'saved' ? (
            <PressableScale
              className="flex-row items-center gap-3 rounded-2xl bg-card p-3"
              scaleTo={0.98}
              onPress={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: item.shop.id } })}
              accessibilityLabel={`View ${item.shop.name}`}>
              <View className="h-12 w-12 overflow-hidden rounded-xl bg-secondary">
                {item.shop.photos[0] ? <Image source={{ uri: cloudinaryImageUrl(item.shop.photos[0], 160) }} className="h-full w-full" /> : null}
              </View>
              <View className="flex-1">
                <Text className="font-semibold">{item.shop.name}</Text>
                <View className="flex-row items-center gap-1">
                  <Icon as={Star} size={14} fill="currentColor" className="text-gold" />
                  <Text className="text-sm text-muted-foreground">{item.shop.avgRating.toFixed(1)} · {item.shop.reviewCount} reviews</Text>
                </View>
              </View>
              <Button
                size="icon"
                variant="ghost"
                loading={savingShopId === item.shop.id}
                loadingLabel="…"
                accessibilityLabel={`Remove ${item.shop.name} from saved shops`}
                onPress={() => void toggleSavedShop(item.shop.id)}>
                <Icon as={Heart} fill="currentColor" className="text-accent" />
              </Button>
            </PressableScale>
          ) : item.kind === 'visit' ? (
            <PressableScale
              className="flex-row items-center gap-3 rounded-2xl bg-card p-3"
              scaleTo={0.98}
              onPress={() => router.push({ pathname: '/(user)/shop/[id]', params: { id: item.shop.id } })}
              accessibilityLabel={`View ${item.shop.name}`}>
              <View className="h-12 w-12 overflow-hidden rounded-xl bg-secondary">
                {item.shop.photos[0] ? <Image source={{ uri: cloudinaryImageUrl(item.shop.photos[0], 160) }} className="h-full w-full" /> : null}
              </View>
              <View className="flex-1">
                <Text className="font-semibold">{item.shop.name}</Text>
                <Text className="text-sm text-muted-foreground">{item.entry.viewedAt ? dayjs(item.entry.viewedAt.toDate()).format('MMM D, YYYY') : 'Recently viewed'}</Text>
              </View>
            </PressableScale>
          ) : item.kind === 'heading' ? (
            <Text className="pt-3 font-display text-xl">Visit History</Text>
          ) : item.kind === 'emptySaved' ? (
            <EmptyState title="Your coffee trail starts here" description="Save a shop to keep it close for your next visit." />
          ) : (
            <Text className="text-muted-foreground">Shops you visit will appear here.</Text>
          )}
        </AnimatedView>
      )}
      ListFooterComponent={
        <View className="gap-3 px-4 pt-4">
          <Text className="font-display text-xl">Search Preferences</Text>
          <View className="gap-4 rounded-2xl bg-card p-4">
            <Controller control={control} name="wifiOnly" render={({ field }) => (
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="font-semibold">Only show shops with WiFi</Text>
                  <Text className="mt-1 text-sm text-muted-foreground">Filter your search to places with a WiFi connection.</Text>
                </View>
                <Switch value={field.value} onValueChange={field.onChange} trackColor={{ false: PALETTE.creamDeep, true: PALETTE.accent }} thumbColor={PALETTE.card} accessibilityLabel="Only show shops with WiFi" />
              </View>
            )} />
            <Controller control={control} name="maxDistanceKm" render={({ field }) => (
              <View className="gap-2">
                <Text className="font-semibold">Preferred distance</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
                  {DISTANCE_OPTIONS_KM.map((distance) => <FilterChip key={distance} label={`Within ${distance} km`} selected={field.value === distance} onPress={() => field.onChange(field.value === distance ? null : distance)} />)}
                </ScrollView>
              </View>
            )} />
            <Controller control={control} name="priceBuckets" render={({ field }) => (
              <View className="gap-2">
                <Text className="font-semibold">Price tier</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
                  {(['budget', 'moderate', 'premium'] as PriceBucket[]).map((bucket) => (
                    <FilterChip key={bucket} label={PRICE_BUCKET_LABELS[bucket]} selected={field.value.includes(bucket)} onPress={() => field.onChange(field.value.includes(bucket) ? field.value.filter((value) => value !== bucket) : [...field.value, bucket])} />
                  ))}
                </ScrollView>
              </View>
            )} />
            <Controller control={control} name="tags" render={({ field }) => (
              <View className="gap-2">
                <Text className="font-semibold">Favorite features</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
                  {TAG_OPTIONS.map((tag) => (
                    <FilterChip key={tag} label={tag} selected={field.value.includes(tag)} onPress={() => field.onChange(field.value.includes(tag) ? field.value.filter((value) => value !== tag) : [...field.value, tag])} />
                  ))}
                </ScrollView>
              </View>
            )} />
            <Controller control={control} name="openNowOnly" render={({ field }) => (
              <Button variant={field.value ? 'default' : 'outline'} onPress={() => field.onChange(!field.value)}>
                <Text>{field.value ? 'Open now only' : 'Include closed shops'}</Text>
              </Button>
            )} />
            <Button loading={isSaving} loadingLabel="Saving…" onPress={handleSubmit(savePreferences)}>
              <Text>Save preferences</Text>
            </Button>
          </View>
        </View>
      }
    />
  );
}

function CountUpNumber({ target }: { target: number }) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) {
      const timer = setTimeout(() => setValue(target), 0);
      return () => clearTimeout(timer);
    }
    const started = Date.now();
    const timer = setInterval(() => {
      const fraction = Math.min(1, (Date.now() - started) / 360);
      setValue(Math.round(target * fraction));
      if (fraction >= 1) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [reduced, target]);
  return <Text className="font-display text-xl text-primary-foreground">{value}</Text>;
}
function timestampMs(entry: RecentlyViewedEntry) {
  return entry.viewedAt?.toMillis?.() ?? 0;
}
