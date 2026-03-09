import { z } from 'zod';

export const emailSchema = z.string().trim().email('Enter a valid email');
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const otpSchema = z.object({
  email: emailSchema,
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, 'Token is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

