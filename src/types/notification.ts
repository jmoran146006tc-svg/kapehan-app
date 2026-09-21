import type { Timestamp } from 'firebase/firestore';

export type NotificationType = 'listing_approved' | 'listing_rejected' | 'review_received' | 'review_reply';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  shopId?: string;
  read: boolean;
  createdAt: Timestamp | null;
}
