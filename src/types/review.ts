import type { Timestamp } from 'firebase/firestore';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: Timestamp | null;
  ownerReply?: { text: string; repliedAt: Timestamp } | null;
}
