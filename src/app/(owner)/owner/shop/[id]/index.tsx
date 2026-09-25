import { View } from 'react-native';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/timeout';
import { OwnerShopShell } from '@/components/owner-shop-shell';
import { ShopForm } from '@/components/shop-form';
import type { ShopFormValues } from '@/lib/schemas/shop';
import { Text } from '@/components/ui/text';
import { useToast } from '@/hooks/useToast';
import { notifyFavoriteShopUpdate } from '@/lib/favorite-shop-updates';
import type { Shop } from '@/types/shop';

export default function OwnerShopInfoScreen() {
  const { showToast } = useToast();
  async function updateShop(shop: Shop, values: ShopFormValues) {
    await withTimeout(updateDoc(doc(db, 'shops', shop.id), { ...values, status: 'pending' }));
    showToast({ type: 'success', message: 'Changes saved — your listing is back in review' });
    if (JSON.stringify(shop.hours) !== JSON.stringify(values.hours)) {
      try { await notifyFavoriteShopUpdate(shop.id, shop.name, 'shop_hours_updated'); }
      catch { showToast({ type: 'error', message: 'Changes saved, but followers could not be notified.' }); }
    }
    router.replace({ pathname: '/(owner)/owner/shop/[id]', params: { id: shop.id } } as never);
  }
  return <OwnerShopShell active="info">{(shop) => <View className="gap-4 px-4 py-5 pb-8"><Text className="text-xl font-bold">Shop Info</Text><Text className="text-sm text-muted-foreground">Saving changes returns this listing to review.</Text><ShopForm defaultValues={{ name: shop.name, address: shop.address, lat: shop.lat, lng: shop.lng, priceMin: shop.priceMin, priceMax: shop.priceMax, hasWifi: shop.hasWifi, tags: shop.tags as ShopFormValues['tags'], description: shop.description ?? '', hours: shop.hours as ShopFormValues['hours'], photos: shop.photos }} submitLabel="Save shop changes" onSubmit={(values) => updateShop(shop, values)} /></View>}</OwnerShopShell>;
}
