import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ShopRatingData {
  ownerId: string;
  name: string;
  avgRating?: number;
  reviewCount?: number;
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

  await runTransaction(db, async (tx) => {
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
    tx.update(shopRef, { avgRating: nextAverage, reviewCount: nextCount });

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
  });
}
