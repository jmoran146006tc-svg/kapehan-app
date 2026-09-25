import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/timeout';
import type { ShopFormValues } from '@/lib/schemas/shop';

export function ownerShopUpdate(values: ShopFormValues) {
  const { name, address, lat, lng, priceMin, priceMax, hasWifi, tags, description, photos, hours } = values;
  return { name, address, lat, lng, priceMin, priceMax, hasWifi, tags, description, photos, hours, status: 'pending' as const };
}

export function saveOwnerShopUpdate(shopId: string, values: ShopFormValues) {
  return withTimeout(updateDoc(doc(db, 'shops', shopId), ownerShopUpdate(values)));
}
