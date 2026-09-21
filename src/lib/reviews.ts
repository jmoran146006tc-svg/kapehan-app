import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/timeout';

interface ShopRatingData {
  ownerId: string;
  name: string;
  avgRating?: number;
  reviewCount?: number;
  ratingCounts?: Record<'1' | '2' | '3' | '4' | '5', number>;
}

function nextRatingCounts(
  counts: ShopRatingData['ratingCounts'],
  previousRating: number,
  rating: number,
): ShopRatingData['ratingCounts'] | undefined {
  if (!counts) return undefined;
  const next = { ...counts };
  if (previousRating >= 1 && previousRating <= 5) {
    const key = String(previousRating) as keyof typeof next;
    next[key] = Math.max(0, next[key] - 1);
  }
  const nextKey = String(rating) as keyof typeof next;
  next[nextKey] = (next[nextKey] ?? 0) + 1;
  return next;
}

export async function submitReview(
  shopId: string,
  userId: string,
  userName: string,
  rating: number,
  text: string
) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const shopRef = doc(db, 'shops', shopId);
  // A UID document ID lets the transaction safely choose between a first review and an edit.
  const reviewRef = doc(db, 'shops', shopId, 'reviews', userId);

  await withTimeout(runTransaction(db, async (tx) => {
    // Firestore requires all transaction reads before its writes.
    const shopSnap = await tx.get(shopRef);
    const reviewSnap = await tx.get(reviewRef);

    if (!shopSnap.exists()) throw new Error('This shop is no longer available');

    const shop = shopSnap.data() as ShopRatingData;
    const isNewReview = !reviewSnap.exists();
    const previousRating = isNewReview ? 0 : Number(reviewSnap.data().rating ?? 0);
    const previousCount = shop.reviewCount ?? 0;
    const nextCount = isNewReview ? previousCount + 1 : previousCount;
    const previousTotal = (shop.avgRating ?? 0) * previousCount;
    // Remove an edited rating before adding the replacement so edits never inflate the average.
    const nextAverage = (previousTotal - previousRating + rating) / nextCount;

    tx.set(reviewRef, { userId, userName, rating, text, createdAt: serverTimestamp() }, { merge: true });
    const ratingCounts = nextRatingCounts(shop.ratingCounts, previousRating, rating);
    tx.update(shopRef, {
      avgRating: nextAverage,
      reviewCount: nextCount,
      ...(ratingCounts ? { ratingCounts } : {}),
    });

    if (shop.ownerId !== userId) {
      const notificationRef = doc(collection(db, 'users', shop.ownerId, 'notifications'));
      tx.set(notificationRef, {
        type: 'review_received',
        message: `${userName} left a ${rating}-star review for ${shop.name}.`,
        shopId,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  }));
}
