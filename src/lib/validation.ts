import { z } from "zod";
import { ROLES } from "./constants";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().max(50).default(""),
  email: emailSchema,
  password: passwordSchema,
  inviteToken: z.string().min(1, "Invite token is missing"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .transform((s) => new Date(`${s}T00:00:00.000Z`))
  .refine((d) => !Number.isNaN(d.getTime()), "Invalid date");

export const eventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(2000).optional(),
  date: dateOnly,
  location: z.string().trim().max(200).optional(),
  hoursValue: z.coerce
    .number()
    .positive("Hours must be positive")
    .max(24, "Hours can be at most 24"),
});

export const inviteSchema = z.object({
  expiresInDays: z.coerce.number().int().min(1).max(365),
  maxUses: z.coerce.number().int().positive().max(1000).optional(),
  role: z.enum(ROLES).default("member"),
});
