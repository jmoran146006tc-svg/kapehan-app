import type { Timestamp } from 'firebase/firestore';

export type NotificationType = 'listing_approved' | 'listing_rejected' | 'review_received';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  shopId?: string;
  read: boolean;
  createdAt: Timestamp | null;
}
