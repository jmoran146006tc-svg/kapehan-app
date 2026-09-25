import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { NotificationType } from '@/types/notification';

// Each notification rule reads its recipient profile. Small batches stay below
// Firestore's cross-write rule document-access limit.
const NOTIFICATIONS_PER_BATCH = 15;

export async function notifyFavoriteShopUpdate(
  shopId: string,
  shopName: string,
  type: Extract<NotificationType, 'shop_hours_updated' | 'shop_menu_updated'>,
) {
  const followers = await getDocs(collection(db, 'shops', shopId, 'followers'));
  const message = type === 'shop_hours_updated'
    ? `${shopName} updated its opening hours.`
    : `${shopName} updated its menu.`;
  for (let index = 0; index < followers.size; index += NOTIFICATIONS_PER_BATCH) {
    const batch = writeBatch(db);
    for (const follower of followers.docs.slice(index, index + NOTIFICATIONS_PER_BATCH)) {
      batch.set(doc(collection(db, 'users', follower.id, 'notifications')), {
        type,
        message,
        shopId,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
}
