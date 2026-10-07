import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/timeout';
import { UserFacingError } from '@/lib/errors';
import { reportFormSchema, type ReportFormValues } from '@/lib/schemas/report';
import { MAX_REPORT_DETAILS, MAX_REPORT_SHOP_NAME } from '@/constants/moderation';
import type { Review } from '@/types/review';

export function reportDocId(reporterId: string, shopId: string, reviewId?: string) {
  return reviewId ? `${reporterId}__review__${shopId}__${reviewId}` : `${reporterId}__listing__${shopId}`;
}

export async function submitReport({ reporter, shop, review, reason, details }: ReportFormValues & {
  reporter: { uid: string };
  shop: { id: string; name: string; ownerId: string };
  review?: Review;
}) {
  const targetUserId = review?.userId ?? shop.ownerId;
  if (targetUserId === reporter.uid) throw new UserFacingError('You cannot report your own content.');
  const values = reportFormSchema.safeParse({ reason, details });
  if (!values.success) throw new UserFacingError('Choose a reason and keep details under 300 characters.');
  const ref = doc(db, 'reports', reportDocId(reporter.uid, shop.id, review?.id));
  if ((await withTimeout(getDoc(ref))).exists()) throw new UserFacingError('You already reported this.');
  try {
    await withTimeout(setDoc(ref, {
      targetType: review ? 'review' : 'listing', shopId: shop.id, shopName: shop.name.slice(0, MAX_REPORT_SHOP_NAME),
      targetUserId, reporterId: reporter.uid, reason: values.data.reason, status: 'open', createdAt: serverTimestamp(),
      ...(values.data.details ? { details: values.data.details } : {}),
      ...(review ? { reviewId: review.id, excerpt: review.text.trim().slice(0, MAX_REPORT_DETAILS) } : {}),
    }));
  } catch (error) {
    // A concurrent submission may win after our duplicate check.
    if (typeof error === 'object' && error && 'code' in error && String(error.code).includes('permission-denied')) {
      const existing = await withTimeout(getDoc(ref));
      if (existing.exists()) throw new UserFacingError('You already reported this.');
    }
    throw error;
  }
}
