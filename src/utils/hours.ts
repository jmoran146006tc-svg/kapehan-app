import dayjs from 'dayjs';
import type { Shop } from '@/types/shop';

export function isOpenNow(hours: Shop['hours']): boolean {
  const now = dayjs();
  const today = hours[now.format('ddd').toLowerCase()];
  if (!today || today.closed) return false;
  const [oh, om] = today.open.split(':').map(Number);
  const [ch, cm] = today.close.split(':').map(Number);
  return now.isAfter(now.hour(oh).minute(om)) && now.isBefore(now.hour(ch).minute(cm));
}