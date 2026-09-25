import { dayjs } from '@/lib/dayjs';
import type { Review } from '@/types/review';
import { Text } from '@/components/ui/text';

export function ReviewTime({ review }: { review: Review }) {
  return <Text className="text-xs text-muted-foreground">
    {review.createdAt ? dayjs(review.createdAt.toDate()).fromNow() : 'Just now'}
    {review.editedAt ? ' (edited)' : ''}
  </Text>;
}

export function OwnerReplyLabel({ edited }: { edited: boolean }) {
  return <Text className="text-xs font-semibold text-muted-foreground">Owner replied{edited ? ' (edited)' : ''}</Text>;
}
