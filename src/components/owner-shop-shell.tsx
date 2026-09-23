import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { db } from '@/lib/firebase';
import { goBack } from '@/lib/navigation';
import { toShop, type Shop } from '@/types/shop';
import { LogoutButton } from '@/components/logout-button';
import { StatTile } from '@/components/stat-tile';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type OwnerTab = 'info' | 'menu' | 'reviews';

export function OwnerShopShell({ active, children }: { active: OwnerTab; children: (shop: Shop) => React.ReactNode }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'shops', id), (snapshot) => setShop(snapshot.exists() ? toShop(snapshot.id, snapshot.data()) : null));
  }, [id]);

  if (!shop) return <View className="flex-1 items-center justify-center bg-background"><Text className="text-muted-foreground">Loading shop dashboard…</Text></View>;

  const go = (tab: OwnerTab) => router.replace({ pathname: tab === 'info' ? '/(owner)/shop/[id]' : `/(owner)/shop/[id]/${tab}`, params: { id: shop.id } } as never);
  const headerHeight = Math.max(240, insets.top + 188);

  return (
    <View className="flex-1 bg-background">
      <View className="relative">
        <View className="relative overflow-hidden bg-primary" style={{ height: headerHeight }}>
          {shop.photos[0] ? <Image source={{ uri: shop.photos[0] }} className="h-full w-full" /> : null}
          <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(0, 0, 0, 0.78)']} locations={[0.3, 1]} style={StyleSheet.absoluteFill} />
          <View className="absolute left-4 right-4 flex-row items-center justify-between" style={{ top: insets.top + 8 }}>
            <Button size="icon" variant="ghost" className="rounded-full bg-black/30" onPress={() => goBack('/(owner)')} accessibilityLabel="Back to owner dashboard"><Icon as={ArrowLeft} className="text-primary-foreground" /></Button>
            <View className="flex-row items-center gap-1">
              <Button size="icon" variant="ghost" className="rounded-full bg-black/30" onPress={() => router.push({ pathname: '/(owner)/listing/[id]', params: { id: shop.id } })} accessibilityLabel="Change cover photo"><Icon as={Camera} size={16} className="text-primary-foreground" /></Button>
              <LogoutButton size="sm" variant="ghost" className="rounded-full bg-black/30" />
            </View>
          </View>
          <View className="absolute bottom-5 left-4 right-4">
            <Text numberOfLines={2} className="text-2xl font-bold text-primary-foreground">{shop.name}</Text>
            <Text className="text-sm text-primary-foreground/70">Owner dashboard</Text>
          </View>
        </View>
        <View className="absolute bottom-0 left-4 right-4 flex-row gap-2 rounded-t-3xl bg-card p-4 shadow-lg shadow-black/15" style={{ transform: [{ translateY: 32 }] }}>
          <StatTile value={shop.avgRating.toFixed(1)} label="Rating" className="border-transparent bg-secondary/70" />
          <StatTile value={shop.reviewCount} label="Reviews" className="border-transparent bg-secondary/70" />
          <StatTile value={shop.viewCount ?? 0} label="Views" className="border-transparent bg-secondary/70" />
        </View>
      </View>
      <View className="gap-4 pt-16">
        <View className="flex-row border-b border-border px-4">{(['info', 'menu', 'reviews'] as OwnerTab[]).map((tab) => <Button key={tab} variant="ghost" className={active === tab ? 'flex-1 rounded-none border-b-2 border-accent' : 'flex-1 rounded-none'} onPress={() => go(tab)}><Text className={active === tab ? 'font-bold text-accent' : undefined}>{tab === 'info' ? 'Shop Info' : tab[0].toUpperCase() + tab.slice(1)}</Text></Button>)}</View>
      </View>
      <View className="flex-1">{children(shop)}</View>
    </View>
  );
}
