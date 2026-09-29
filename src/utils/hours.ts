import dayjs from 'dayjs';
import type { Shop } from '@/types/shop';

export function isOpenNow(hours: Shop['hours']): boolean {
  const now = dayjs();

  const isWithinWindow = (day: dayjs.Dayjs): boolean => {
    const schedule = hours[day.format('ddd').toLowerCase()];
    if (!schedule || schedule.closed) return false;

    const [openHour, openMinute] = schedule.open.split(':').map(Number);
    const [closeHour, closeMinute] = schedule.close.split(':').map(Number);
    const open = day.hour(openHour).minute(openMinute).second(0).millisecond(0);
    let close = day.hour(closeHour).minute(closeMinute).second(0).millisecond(0);

    // The seed represents a 24-hour day as 00:00-23:59.
    if (schedule.open === '00:00' && schedule.close === '23:59') {
      close = day.add(1, 'day').startOf('day');
    } else if (close.valueOf() <= open.valueOf()) {
      close = close.add(1, 'day');
    }

    return !now.isBefore(open) && now.isBefore(close);
  };

  return isWithinWindow(now) || isWithinWindow(now.subtract(1, 'day'));
}
