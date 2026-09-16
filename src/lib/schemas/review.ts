import { z } from 'zod';

export const reviewFormSchema = z.object({
  rating: z.number().int().min(1, 'Choose a star rating').max(5),
  text: z.string().trim().max(1_000, 'Keep your review under 1,000 characters'),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;
export type ReviewFormInput = z.input<typeof reviewFormSchema>;
