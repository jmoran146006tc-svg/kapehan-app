import { z } from 'zod';

export const emailSchema = z.string().trim().min(1, 'Email is required').email('Enter a valid email address.');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80, 'Keep your name under 80 characters.'),
  email: emailSchema,
  password: z.string().min(6, 'Use a password with at least 6 characters.').max(128, 'Password is too long.'),
  role: z.enum(['user', 'owner']),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
