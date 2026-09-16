import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { Shop } from '@/types/shop';
import { getListingStatusBadgeVariant } from '@/utils/listing';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'shops'), where('ownerId', '==', user.uid)),
      (snap) => setShops(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Shop))
    );
  }, [user]);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut(auth);
      // Sign-out completion is authoritative; route immediately rather than wait for the root listener.
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert('Could not log out', error.message ?? 'Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']}>
      <View className="flex-1 bg-background p-4 gap-3">
        <Text className="text-2xl font-bold">Owner Dashboard</Text>
        {shops.length === 0 ? (
          <>
            <Text className="text-muted-foreground">Create your first listing to submit it for review.</Text>
            <Button onPress={() => router.push('/(owner)/listing/create')}>
              <Text>Create listing</Text>
            </Button>
          </>
        ) : (
          <>
            {shops.map((shop) => (
              <Card key={shop.id}>
                <CardHeader className="gap-3">
                  <View className="flex-row items-start justify-between gap-2">
                    <CardTitle className="flex-1">{shop.name}</CardTitle>
                    <Badge variant={getListingStatusBadgeVariant(shop.status)}>
                      <Text>{shop.status}</Text>
                    </Badge>
                  </View>
                  <View className="flex-row gap-2">
                    <Button className="flex-1" size="sm" onPress={() => router.push({ pathname: '/(owner)/listing/[id]', params: { id: shop.id } })}>
                      <Text>Edit</Text>
                    </Button>
                    <Button className="flex-1" size="sm" variant="outline" onPress={() => router.push({ pathname: '/(owner)/reviews', params: { shopId: shop.id } })}>
                      <Text>View reviews</Text>
                    </Button>
                  </View>
                </CardHeader>
              </Card>
            ))}
            <Button variant="outline" onPress={() => router.push('/(owner)/listing/create')}>
              <Text>+ Add another listing</Text>
            </Button>
          </>
        )}
        <Button variant="ghost" loading={isSigningOut} loadingLabel="Logging out…" onPress={handleSignOut}>
          <Text>Log out</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
