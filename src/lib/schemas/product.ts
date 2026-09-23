import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '@/constants/products';

function requiredPrice(value: unknown) {
  return typeof value === 'string' && value.trim() === '' ? Number.NaN : value;
}

export const productFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter an item name.').max(80, 'Keep the item name under 80 characters.'),
  description: z.string().trim().max(300, 'Keep the description under 300 characters.').optional().or(z.literal('')),
  price: z.preprocess(
    requiredPrice,
    z.coerce.number({ error: 'Price is required.' }).finite('Price must be a number.').min(0, 'Price cannot be negative.').max(1_000_000, 'Keep the price under ₱1,000,000.'),
  ),
  category: z.enum(PRODUCT_CATEGORIES),
  photoUrl: z.string().url('Enter a valid image URL.').optional().or(z.literal('')),
  available: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductFormInput = z.input<typeof productFormSchema>;
