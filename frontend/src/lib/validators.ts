import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  preferred_language: z.string().default('en'),
  large_text: z.boolean().optional().default(false),
  high_contrast: z.boolean().optional().default(false),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  preferred_language: z.string(),
  font_size: z.enum(['normal', 'large', 'xlarge']),
  high_contrast: z.boolean(),
  reduced_motion: z.boolean(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

export const customPhraseSchema = z.object({
  text: z.string().min(1, 'Phrase cannot be empty').max(120, 'Phrase must be under 120 characters'),
  category: z.enum(['Basic', 'Needs', 'Emergency', 'Feelings', 'Social', 'Personal']),
});

export type CustomPhraseFormData = z.infer<typeof customPhraseSchema>;
