import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Star } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { toShop, type Shop } from '@/types/shop';
import { getListingStatusBadgeVariant } from '@/utils/listing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoutButton } from '@/components/logout-button';
import { OwnerNotificationButton } from '@/components/owner-notification-button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, 'shops'), where('ownerId', '==', user.uid)), (snapshot) => setShops(snapshot.docs.map((item) => toShop(item.id, item.data()))));
  }, [user]);
  return <SafeAreaView edges={['top']} className="flex-1 bg-background"><ScrollView className="flex-1" contentContainerClassName="gap-4 pb-8"><View className="flex-row items-center justify-between bg-primary px-4 pb-5 pt-4"><View><Text className="text-2xl font-bold text-primary-foreground">Your Coffee Shops</Text><Text className="text-sm text-primary-foreground/70">Manage listings, menu, and reviews</Text></View><View className="flex-row items-center gap-2"><OwnerNotificationButton /><LogoutButton size="sm" variant="ghost" /></View></View><View className="mx-auto w-full max-w-2xl gap-3 px-4">{shops.length === 0 ? <View className="gap-3 rounded-xl border border-border bg-card p-5"><Text className="font-semibold">Create your first listing</Text><Text className="text-muted-foreground">Submit your coffee shop for approval, then add its menu and respond to guests.</Text><Button onPress={() => router.push('/(owner)/listing/create')}><Text>Create listing</Text></Button></View> : shops.map((shop) => <Pressable key={shop.id} onPress={() => router.push({ pathname: '/(owner)/owner/shop/[id]', params: { id: shop.id } } as never)}><Card><CardHeader className="gap-3"><View className="flex-row items-start justify-between gap-2"><CardTitle className="flex-1">{shop.name}</CardTitle><Badge variant={getListingStatusBadgeVariant(shop.status)}><Text className="capitalize">{shop.status}</Text></Badge></View><Text className="text-sm text-muted-foreground">{shop.description || shop.address}</Text><View className="flex-row items-center gap-1"><Icon as={Star} size={14} fill="currentColor" className="text-accent" /><Text className="text-sm text-muted-foreground">{shop.avgRating.toFixed(1)} · {shop.reviewCount} reviews</Text></View></CardHeader></Card></Pressable>)}<Button variant="outline" onPress={() => router.push('/(owner)/listing/create')}><Text>Add another listing</Text></Button></View></ScrollView></SafeAreaView>;
}
