import { useEffect, useState } from 'react';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { Image, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { Camera } from 'lucide-react-native';
import { db } from '@/lib/firebase';
import { blurActiveElement } from '@/lib/navigation';
import { toShop, type Shop } from '@/types/shop';
import { LogoutButton } from '@/components/logout-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserFriendlyError } from '@/lib/errors';
import { useToast } from '@/hooks/useToast';
import { cloudinaryImageUrl } from '@/lib/cloudinary';
import { ScreenHeader } from '@/components/screen-header';
import { UnderlineTabs } from '@/components/underline-tabs';

type OwnerTab = 'info' | 'menu' | 'reviews';

export function OwnerShopShell({ active, children }: { active: OwnerTab; children: (shop: Shop) => React.ReactNode }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'shops', id), (snapshot) => {
      setShop(snapshot.exists() ? toShop(snapshot.id, snapshot.data()) : null);
      setLoading(false);
    }, (error) => {
      const message = getUserFriendlyError(error, 'We could not load this shop. Please try again.');
      setLoadError(message);
      showToast({ type: 'error', message });
      setLoading(false);
    });
  }, [id, showToast]);

  if (loading) return <View className="flex-1 bg-background"><ScreenHeader title="Your coffee shop" fallbackHref="/(owner)" /><View className="gap-4 p-4"><Skeleton className="h-56 w-full" /><View className="flex-row gap-2"><Skeleton className="h-20 flex-1" /><Skeleton className="h-20 flex-1" /><Skeleton className="h-20 flex-1" /></View><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></View></View>;
  if (!shop) return <View className="flex-1 bg-background"><ScreenHeader title="Your coffee shop" fallbackHref="/(owner)" /><View className="flex-1 items-center justify-center p-4"><Text className="text-muted-foreground">{loadError ? 'This shop is unavailable right now.' : 'This shop is no longer available.'}</Text></View></View>;

  const go = (tab: OwnerTab) => {
    blurActiveElement();
    router.replace({ pathname: tab === 'info' ? '/(owner)/owner/shop/[id]' : `/(owner)/owner/shop/[id]/${tab}`, params: { id: shop.id } } as never);
  };
  return (
    <View className="flex-1 bg-background">
    <ScreenHeader title={shop.name} fallbackHref="/(owner)" right={<View className="flex-row items-center gap-1">
      {shop.status !== 'archived' ? <Button size="icon" variant="ghost" onPress={() => { blurActiveElement(); router.push({ pathname: '/(owner)/listing/[id]', params: { id: shop.id } }); }} accessibilityLabel="Edit listing"><Icon as={Camera} size={18} className="text-primary-foreground" /></Button> : null}
      <LogoutButton size="sm" variant="outline" />
    </View>} />
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="mx-auto w-full max-w-2xl pb-8">
      <View className="gap-4">
        <View className="relative h-48 overflow-hidden bg-secondary">
          {shop.photos[0] ? <Image source={{ uri: cloudinaryImageUrl(shop.photos[0], 1200) }} className="h-full w-full" resizeMode="cover" /> : <View className="h-full items-center justify-center"><Text className="font-display text-4xl text-primary/30">Kapehan</Text></View>}
        </View>
        <View className="gap-3 px-4">
          <View><Text className="text-xs font-bold uppercase tracking-widest text-accent">Your coffee shop</Text><Text className="mt-1 font-display text-3xl text-foreground">{shop.name}</Text><Text className="mt-1 text-sm capitalize text-muted-foreground">{shop.status} listing</Text></View>
          <View className="flex-row rounded-2xl bg-card py-3">
            {([{ label: 'Rating', value: shop.avgRating.toFixed(1) }, { label: 'Reviews', value: shop.reviewCount }, { label: 'Views', value: shop.viewCount ?? 0 }] as const).map((metric, index) => <View key={metric.label} className={index ? 'flex-1 items-center border-l border-border' : 'flex-1 items-center'}><Text className="font-display text-xl text-primary">{metric.value}</Text><Text className="text-xs text-muted-foreground">{metric.label}</Text></View>)}
          </View>
          {shop.status === 'archived' ? <View className="rounded-xl border border-border bg-secondary px-4 py-3"><Text className="font-semibold text-foreground">This listing has been archived.</Text><Text className="text-sm text-muted-foreground">Its details, menu, and replies are read only.</Text></View> : null}
        </View>
      </View>
      <View className="gap-4 pt-5">
        <UnderlineTabs tabs={[{ key: 'info', label: 'Shop Info' }, { key: 'menu', label: 'Menu' }, { key: 'reviews', label: 'Reviews' }]} value={active} onChange={(value) => go(value as OwnerTab)} animated={false} />
      </View>
      <Animated.View entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}>{children(shop)}</Animated.View>
    </ScrollView>
    </View>
  );
}
