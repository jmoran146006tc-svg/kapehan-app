import { Timestamp } from 'firebase/firestore';
import { REPORT_REASON_KEYS } from '@/constants/moderation';

export type ReportReason = (typeof REPORT_REASON_KEYS)[number];
export interface Report {
  id: string;
  targetType: 'review' | 'listing';
  shopId: string;
  shopName: string;
  reviewId?: string;
  targetUserId: string;
  reporterId: string;
  reason: ReportReason;
  details: string;
  excerpt: string;
  status: 'open' | 'dismissed' | 'actioned';
  createdAt: Timestamp | null;
  resolvedAt: Timestamp | null;
  resolvedBy: string;
  adminNote: string;
}

export function toReport(id: string, data: unknown): Report {
  const source: Record<string, unknown> = data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : {};
  const text = (key: string) => typeof source[key] === 'string' ? source[key] as string : '';
  return {
    id, targetType: source.targetType === 'review' ? 'review' : 'listing',
    shopId: text('shopId'), shopName: text('shopName'), reviewId: text('reviewId') || undefined,
    targetUserId: text('targetUserId'), reporterId: text('reporterId'),
    reason: REPORT_REASON_KEYS.includes(source.reason as ReportReason) ? source.reason as ReportReason : 'other',
    details: text('details'), excerpt: text('excerpt'),
    status: source.status === 'open' || source.status === 'actioned' ? source.status : 'dismissed',
    createdAt: source.createdAt instanceof Timestamp ? source.createdAt : null,
    resolvedAt: source.resolvedAt instanceof Timestamp ? source.resolvedAt : null,
    resolvedBy: text('resolvedBy'), adminNote: text('adminNote'),
  };
}
