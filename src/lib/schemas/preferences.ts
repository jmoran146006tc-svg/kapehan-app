import { z } from 'zod';

export const preferencesSchema = z.object({
  wifiRating: z.array(z.enum(['fast', 'moderate', 'none'])),
  priceBuckets: z.array(z.enum(['budget', 'moderate', 'premium'])),
  openNowOnly: z.boolean(),
});

export type PreferencesValues = z.infer<typeof preferencesSchema>;
