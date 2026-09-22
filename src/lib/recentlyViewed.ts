import { Timestamp, doc, getDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/timeout';
import type { RecentlyViewedEntry } from '@/types/user';

const MAX_RECENTLY_VIEWED = 20;

export async function logShopView(uid: string, shopId: string) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await withTimeout(getDoc(userRef));
  const current = (userSnap.data()?.recentlyViewed ?? []) as RecentlyViewedEntry[];

  // Re-viewing a shop promotes its existing entry instead of consuming another slot.
  const recentlyViewed = [
    { shopId, viewedAt: Timestamp.now() },
    ...current.filter((entry) => entry.shopId !== shopId),
  ].slice(0, MAX_RECENTLY_VIEWED);

  const batch = writeBatch(db);
  batch.set(userRef, { recentlyViewed, visitCount: increment(1) }, { merge: true });
  // The dashboard's view tile intentionally tracks signed-in detail opens.
  // The matching rule permits exactly one increment and no other shop change.
  batch.update(doc(db, 'shops', shopId), { viewCount: increment(1) });
  await withTimeout(batch.commit());
}
