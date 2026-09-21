import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/timeout';

export async function saveOwnerReply(shopId: string, reviewId: string, text: string) {
  const reply = text.trim();
  if (!reply) throw new Error('Write a reply before sending it.');

  const shopRef = doc(db, 'shops', shopId);
  const reviewRef = doc(db, 'shops', shopId, 'reviews', reviewId);
  await withTimeout(runTransaction(db, async (transaction) => {
    const [shopSnapshot, reviewSnapshot] = await Promise.all([transaction.get(shopRef), transaction.get(reviewRef)]);
    if (!shopSnapshot.exists() || !reviewSnapshot.exists()) throw new Error('This review is no longer available.');
    const review = reviewSnapshot.data();
    const isFirstReply = !review.ownerReply;

    transaction.update(reviewRef, { ownerReply: { text: reply, repliedAt: serverTimestamp() } });
    if (isFirstReply) {
      transaction.set(doc(collection(db, 'users', review.userId, 'notifications')), {
        type: 'review_reply',
        message: `${shopSnapshot.data().name} replied to your review.`,
        shopId,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  }));
}
