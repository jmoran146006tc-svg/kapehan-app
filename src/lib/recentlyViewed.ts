import { Timestamp, doc, getDoc, increment, setDoc, updateDoc } from 'firebase/firestore';
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

  await withTimeout(setDoc(userRef, { recentlyViewed, visitCount: increment(1) }, { merge: true }));

  // A legacy shop without a viewCount field can still reject this write. The
  // visit belongs to the user profile, so the optional counter must not undo it.
  try {
    await withTimeout(updateDoc(doc(db, 'shops', shopId), { viewCount: increment(1) }));
  } catch (error) {
    console.error('Failed to increment shop view count', error);
  }
}
