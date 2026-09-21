import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/timeout';
import { OwnerShopShell } from '@/components/owner-shop-shell';
import { ShopForm } from '@/components/shop-form';
import type { ShopFormValues } from '@/lib/schemas/shop';
import { Text } from '@/components/ui/text';

export default function OwnerShopInfoScreen() {
  async function updateShop(id: string, values: ShopFormValues) {
    await withTimeout(updateDoc(doc(db, 'shops', id), { ...values, status: 'pending' }));
    router.replace({ pathname: '/(owner)/shop/[id]', params: { id } } as never);
  }
  return <OwnerShopShell active="info">{(shop) => <ScrollView className="flex-1 bg-background px-4" contentContainerClassName="gap-4 py-5 pb-8"><Text className="text-xl font-bold">Shop Info</Text><Text className="text-sm text-muted-foreground">Saving changes returns this listing to review.</Text><ShopForm defaultValues={{ name: shop.name, address: shop.address, lat: shop.lat, lng: shop.lng, priceMin: shop.priceMin, priceMax: shop.priceMax, hasWifi: shop.hasWifi, tags: shop.tags as ShopFormValues['tags'], description: shop.description ?? '', hours: shop.hours as ShopFormValues['hours'], photos: shop.photos }} submitLabel="Save shop changes" onSubmit={(values) => updateShop(shop.id, values)} /></ScrollView>}</OwnerShopShell>;
}
