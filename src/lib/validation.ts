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

const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM (24-hour)");

export const timeslotSchema = z
  .object({
    date: dateOnly,
    startTime: timeOfDay,
    endTime: timeOfDay,
    hoursValue: z.coerce
      .number()
      .positive("Hours must be positive")
      .max(24, "Hours can be at most 24"),
    quota: z.coerce
      .number()
      .int("Quota must be a whole number")
      .min(1, "Quota must be at least 1")
      .max(1000),
  })
  .refine((s) => s.endTime > s.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type TimeslotInput = z.infer<typeof timeslotSchema>;

const baseEvent = {
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(200).optional(),
};

/** Officer event creation: one or more timeslots. */
export const eventSchema = z.object({
  ...baseEvent,
  slots: z.array(timeslotSchema).min(1, "Add at least one timeslot"),
});

/** Member event request: exactly one timeslot. */
export const eventRequestSchema = z.object({
  ...baseEvent,
  slots: z.array(timeslotSchema).length(1, "A request has a single timeslot"),
});

export const hourReportSchema = z.object({
  description: z.string().trim().min(1, "Describe what you did").max(200),
  notes: z.string().trim().max(500).optional(),
  date: dateOnly,
  hoursRequested: z.coerce
    .number()
    .min(0.5, "At least 0.5 hours")
    .max(24, "At most 24 hours"),
});

export const inviteSchema = z.object({
  expiresInDays: z.coerce.number().int().min(1).max(365),
  maxUses: z.coerce.number().int().positive().max(1000).optional(),
  role: z.enum(ROLES).default("member"),
});
