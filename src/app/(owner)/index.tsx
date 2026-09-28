import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Star } from 'lucide-react-native';
import Animated from 'react-native-reanimated';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { toShop, type Shop } from '@/types/shop';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { GradientHeader } from '@/components/gradient-header';
import { LogoutButton } from '@/components/logout-button';
import { OwnerNotificationButton } from '@/components/owner-notification-button';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { ShopCardSkeleton } from '@/components/shop-card-skeleton';
import { enter } from '@/lib/motion';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, 'shops'), where('ownerId', '==', user.uid)), (snapshot) => {
      setShops(snapshot.docs.map((item) => toShop(item.id, item.data())));
      setLoading(false);
    }, () => setLoading(false));
  }, [user]);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <ScrollView className="flex-1" contentContainerClassName="gap-4 pb-8">
        <GradientHeader>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-display text-2xl text-primary-foreground">Your Coffee Shops</Text>
              <Text className="text-sm text-primary-foreground/70">Manage listings, menu, and reviews</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <OwnerNotificationButton />
              <LogoutButton size="sm" variant="ghost" />
            </View>
          </View>
        </GradientHeader>
        <View className="mx-auto w-full max-w-2xl gap-3 px-4">
          {loading ? (
            <><ShopCardSkeleton /><ShopCardSkeleton /></>
          ) : shops.length === 0 ? (
            <View className="gap-3 rounded-2xl bg-card p-5">
              <Text className="font-display text-lg">Create your first listing</Text>
              <Text className="text-muted-foreground">Submit your coffee shop for approval, then add its menu and respond to guests.</Text>
              <Button onPress={() => router.push('/(owner)/listing/create')}><Text>Create listing</Text></Button>
            </View>
          ) : shops.map((shop, index) => (
            <Animated.View key={shop.id} entering={enter(index)}>
              <PressableScale onPress={() => router.push({ pathname: '/(owner)/owner/shop/[id]', params: { id: shop.id } } as never)} scaleTo={0.98} accessibilityLabel={`View ${shop.name}`}>
                <Card>
                  <CardHeader className="gap-3">
                    <View className="flex-row items-start justify-between gap-2">
                      <CardTitle className="flex-1 font-display text-lg">{shop.name}</CardTitle>
                      <Badge variant="secondary" className={shop.status === 'approved' ? 'border-transparent bg-success' : shop.status === 'pending' ? 'border-transparent bg-pending' : shop.status === 'rejected' ? 'border-transparent bg-destructive/15' : 'border-transparent bg-secondary'}>
                        <Text className={shop.status === 'approved' ? 'capitalize text-success-foreground' : shop.status === 'pending' ? 'capitalize text-pending-foreground' : shop.status === 'rejected' ? 'capitalize text-destructive' : 'capitalize text-muted-foreground'}>{shop.status}</Text>
                      </Badge>
                    </View>
                    <Text className="text-sm text-muted-foreground">{shop.description || shop.address}</Text>
                    <View className="flex-row items-center gap-1">
                      <Icon as={Star} size={14} fill="currentColor" className="text-gold" />
                      <Text className="text-sm text-muted-foreground">{shop.avgRating.toFixed(1)} · {shop.reviewCount} reviews</Text>
                    </View>
                  </CardHeader>
                </Card>
              </PressableScale>
            </Animated.View>
          ))}
          {!loading ? <Button variant="outline" onPress={() => router.push('/(owner)/listing/create')}><Text>Add another listing</Text></Button> : null}
        </View>
      </ScrollView>
    </View>
  );
}
