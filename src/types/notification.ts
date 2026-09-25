import type { Timestamp } from 'firebase/firestore';

export type NotificationType = 'listing_approved' | 'listing_rejected' | 'review_received' | 'review_reply' | 'shop_hours_updated' | 'shop_menu_updated';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  shopId?: string;
  read: boolean;
  createdAt: Timestamp | null;
}
