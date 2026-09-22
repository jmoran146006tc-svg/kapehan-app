import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { db } from '@/lib/firebase';
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

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'shops', id), (snapshot) => setShop(snapshot.exists() ? toShop(snapshot.id, snapshot.data()) : null));
  }, [id]);

  if (!shop) return <View className="flex-1 items-center justify-center bg-background"><Text className="text-muted-foreground">Loading shop dashboard…</Text></View>;

  const go = (tab: OwnerTab) => router.replace({ pathname: tab === 'info' ? '/(owner)/shop/[id]' : `/(owner)/shop/[id]/${tab}`, params: { id: shop.id } } as never);
  return <View className="flex-1 bg-background"><View className="relative h-52 bg-primary">{shop.photos[0] ? <Image source={{ uri: shop.photos[0] }} className="h-full w-full opacity-60" /> : null}<View className="absolute left-4 right-4 top-12 flex-row items-center justify-between"><Button size="icon" variant="ghost" className="bg-black/20" onPress={() => router.back()}><Icon as={ArrowLeft} className="text-primary-foreground" /></Button><LogoutButton size="sm" variant="ghost" /></View><View className="absolute bottom-4 left-4 right-24"><Text numberOfLines={2} className="text-2xl font-bold text-primary-foreground">{shop.name}</Text><Text className="text-sm text-primary-foreground/70">Owner dashboard</Text></View><Button size="icon" variant="secondary" className="absolute bottom-4 right-4 rounded-full bg-card/80" onPress={() => router.push({ pathname: '/(owner)/listing/[id]', params: { id: shop.id } })}><Icon as={Camera} size={16} /></Button></View><View className="-mt-5 gap-4"><View className="mx-4 flex-row gap-2"><StatTile value={shop.avgRating.toFixed(1)} label="Rating" /><StatTile value={shop.reviewCount} label="Reviews" /><StatTile value={shop.viewCount ?? 0} label="Views" /></View><View className="flex-row border-b border-border px-4">{(['info', 'menu', 'reviews'] as OwnerTab[]).map((tab) => <Button key={tab} variant="ghost" className={active === tab ? 'flex-1 rounded-none border-b-2 border-accent' : 'flex-1 rounded-none'} onPress={() => go(tab)}><Text className={active === tab ? 'font-bold text-accent' : undefined}>{tab === 'info' ? 'Shop Info' : tab[0].toUpperCase() + tab.slice(1)}</Text></Button>)}</View></View><View className="flex-1">{children(shop)}</View></View>;
}
