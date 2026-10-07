import { collection, doc, getDocs, query, runTransaction, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/timeout';
import { UserFacingError } from '@/lib/errors';
import { REPORT_RESOLUTION_BATCH_SIZE } from '@/constants/moderation';

export async function removeReviewAsAdmin({ shopId, reviewId, reasonLabel }: { shopId: string; reviewId: string; reasonLabel: string }) {
  return withTimeout(runTransaction(db, async (tx) => {
    const shopRef = doc(db, 'shops', shopId);
    const reviewRef = doc(db, 'shops', shopId, 'reviews', reviewId);
    const userRef = doc(db, 'users', reviewId);
    const shopSnapshot = await tx.get(shopRef);
    const reviewSnapshot = await tx.get(reviewRef);
    const userSnapshot = await tx.get(userRef);
    if (!shopSnapshot.exists()) throw new UserFacingError('This listing is no longer available.');
    if (!reviewSnapshot.exists()) throw new UserFacingError('This review has already been removed.');
    const shop = shopSnapshot.data();
    if (!shop.ratingCounts) throw new UserFacingError("This listing's rating data needs repair before a review can be removed.");
    const rating = Number(reviewSnapshot.data().rating);
    const bucket = String(rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !Number.isInteger(shop.reviewCount) || shop.reviewCount < 1 || !Number.isFinite(shop.avgRating) || !Number.isInteger(shop.ratingCounts[bucket]) || shop.ratingCounts[bucket] < 1) {
      throw new UserFacingError("This listing's rating data needs repair before a review can be removed.");
    }
    const reviewCount = shop.reviewCount - 1;
    const ratingCounts = { ...shop.ratingCounts, [bucket]: Math.max(0, shop.ratingCounts[bucket] - 1) };
    const avgRating = reviewCount === 0 ? 0 : (shop.avgRating * shop.reviewCount - rating) / reviewCount;
    tx.delete(reviewRef);
    tx.update(shopRef, { avgRating, reviewCount, ratingCounts });
    if (userSnapshot.exists()) {
      const count = userSnapshot.data().reviewCount;
      if (typeof count === 'number' && count >= 1) tx.update(userRef, { reviewCount: count - 1 });
      tx.set(doc(collection(db, 'users', reviewId, 'notifications')), {
        type: 'review_removed', message: `Your review of ${shop.name} was removed by an administrator (${reasonLabel}).`,
        shopId, read: false, createdAt: serverTimestamp(),
      });
    }
    return { notified: userSnapshot.exists() };
  }));
}

export async function resolveOpenReportsForReview({ shopId, reviewId, adminUid }: { shopId: string; reviewId: string; adminUid: string }): Promise<boolean> {
  try {
    const snapshot = await withTimeout(getDocs(query(collection(db, 'reports'), where('targetType', '==', 'review'), where('shopId', '==', shopId), where('reviewId', '==', reviewId), where('status', '==', 'open'))));
    for (let index = 0; index < snapshot.docs.length; index += REPORT_RESOLUTION_BATCH_SIZE) {
      const batch = writeBatch(db);
      snapshot.docs.slice(index, index + REPORT_RESOLUTION_BATCH_SIZE).forEach((report) => batch.update(report.ref, { status: 'actioned', resolvedAt: serverTimestamp(), resolvedBy: adminUid }));
      await withTimeout(batch.commit());
    }
    return true;
  } catch (error) {
    console.warn('Review removed, but some reports could not be resolved', error);
    return false;
  }
}

export async function resolveReport({ reportId, adminUid, status, adminNote }: { reportId: string; adminUid: string; status: 'dismissed' | 'actioned'; adminNote?: string }) {
  await withTimeout(updateDoc(doc(db, 'reports', reportId), { status, resolvedAt: serverTimestamp(), resolvedBy: adminUid, ...(adminNote?.trim() ? { adminNote: adminNote.trim() } : {}) }));
}

export async function setUserStatus(uid: string, status: 'active' | 'suspended') {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid), { status });
  await withTimeout(batch.commit());
}
