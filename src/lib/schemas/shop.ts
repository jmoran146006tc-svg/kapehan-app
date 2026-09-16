import { z } from 'zod';

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour time, for example 07:00.');

const dayHoursSchema = z.object({
  open: z.string(),
  close: z.string(),
  closed: z.boolean(),
}).superRefine((hours, context) => {
  // A closed day does not need hours. This also lets existing listings with
  // blank hours for closed days be edited without forcing made-up times.
  if (hours.closed) return;
  if (!timeOfDay.safeParse(hours.open).success) {
    context.addIssue({ code: 'custom', path: ['open'], message: 'Use 24-hour time, for example 07:00.' });
  }
  if (!timeOfDay.safeParse(hours.close).success) {
    context.addIssue({ code: 'custom', path: ['close'], message: 'Use 24-hour time, for example 07:00.' });
  }
});

// Coercing an empty string directly turns it into 0, which can make a missing
// coordinate look valid. Convert blanks to NaN first so the form can flag it.
function requiredNumber(label: string, min: number, max: number) {
  return z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? Number.NaN : value,
    z.coerce.number({ error: `${label} is required.` }).finite(`${label} must be a number.`).min(min, `${label} is too low.`).max(max, `${label} is too high.`),
  );
}

export const shopFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter a shop name.').max(120, 'Keep the shop name under 120 characters.'),
  address: z.string().trim().min(5, 'Enter the shop address.').max(300, 'Keep the address under 300 characters.'),
  lat: requiredNumber('Latitude', -90, 90),
  lng: requiredNumber('Longitude', -180, 180),
  priceMin: requiredNumber('Typical minimum price', 0, 100_000),
  priceMax: requiredNumber('Typical maximum price', 0, 100_000),
  wifiRating: z.enum(['fast', 'moderate', 'none']),
  hours: z.object({
    mon: dayHoursSchema, tue: dayHoursSchema, wed: dayHoursSchema, thu: dayHoursSchema,
    fri: dayHoursSchema, sat: dayHoursSchema, sun: dayHoursSchema,
  }),
  photos: z.array(z.string().url()).default([]),
}).refine((values) => values.priceMax >= values.priceMin, {
  message: 'Typical maximum price must be greater than or equal to the minimum price',
  path: ['priceMax'],
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
