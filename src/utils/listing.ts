import type { BadgeProps } from '@/components/ui/badge';
import type { Shop } from '@/types/shop';

export function getListingStatusBadgeVariant(status: Shop['status']): NonNullable<BadgeProps['variant']> {
  if (status === 'approved') return 'default';
  if (status === 'rejected') return 'destructive';
  return 'secondary';
}
