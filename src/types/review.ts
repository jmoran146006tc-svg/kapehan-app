import type { Timestamp } from 'firebase/firestore';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: Timestamp | null;
  ownerReply: { text: string; repliedAt: Timestamp | null } | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function toReview(id: string, data: unknown): Review {
  const source = asRecord(data);
  const reply = asRecord(source.ownerReply);

  return {
    id,
    userId: typeof source.userId === 'string' ? source.userId : '',
    userName: typeof source.userName === 'string' ? source.userName : 'Kapehan guest',
    rating: typeof source.rating === 'number' && Number.isFinite(source.rating) ? source.rating : 0,
    text: typeof source.text === 'string' ? source.text : '',
    createdAt: (source.createdAt as Timestamp | null | undefined) ?? null,
    ownerReply: typeof reply.text === 'string' && reply.text.trim()
      ? { text: reply.text, repliedAt: (reply.repliedAt as Timestamp | null | undefined) ?? null }
      : null,
  };
}
