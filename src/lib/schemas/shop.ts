import { z } from 'zod';

const dayHoursSchema = z.object({ open: z.string(), close: z.string(), closed: z.boolean() });

export const shopFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  address: z.string().min(5, 'Address is required'),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  priceRange: z.enum(['₱', '₱₱', '₱₱₱']),
  wifiRating: z.enum(['fast', 'moderate', 'none']),
  hours: z.object({
    mon: dayHoursSchema, tue: dayHoursSchema, wed: dayHoursSchema, thu: dayHoursSchema,
    fri: dayHoursSchema, sat: dayHoursSchema, sun: dayHoursSchema,
  }),
  photos: z.array(z.string().url()).default([]),
});

export type ShopFormValues = z.infer<typeof shopFormSchema>;
export type ShopFormInput = z.input<typeof shopFormSchema>;

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export const DEFAULT_HOURS: ShopFormValues['hours'] = {
  mon: { open: '07:00', close: '21:00', closed: false },
  tue: { open: '07:00', close: '21:00', closed: false },
  wed: { open: '07:00', close: '21:00', closed: false },
  thu: { open: '07:00', close: '21:00', closed: false },
  fri: { open: '07:00', close: '21:00', closed: false },
  sat: { open: '07:00', close: '21:00', closed: false },
  sun: { open: '07:00', close: '21:00', closed: false },
};
