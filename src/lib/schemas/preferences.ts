import { z } from 'zod';
import { TAG_OPTIONS } from '@/constants/tags';

export const preferencesSchema = z.object({
  wifiOnly: z.boolean(),
  tags: z.array(z.enum(TAG_OPTIONS)),
  priceBuckets: z.array(z.enum(['budget', 'moderate', 'premium'])),
  openNowOnly: z.boolean(),
});

export type PreferencesValues = z.infer<typeof preferencesSchema>;
