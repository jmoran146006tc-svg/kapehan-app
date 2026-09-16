import { Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { RecentlyViewedEntry } from '@/types/user';

const MAX_RECENTLY_VIEWED = 20;

export async function logShopView(uid: string, shopId: string) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const current = (userSnap.data()?.recentlyViewed ?? []) as RecentlyViewedEntry[];

  // Re-viewing a shop promotes its existing entry instead of consuming another slot.
  const recentlyViewed = [
    { shopId, viewedAt: Timestamp.now() },
    ...current.filter((entry) => entry.shopId !== shopId),
  ].slice(0, MAX_RECENTLY_VIEWED);

  await updateDoc(userRef, { recentlyViewed });
}
