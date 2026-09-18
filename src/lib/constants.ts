// SQLite (via Prisma) has no native enums, so these const unions are the
// source of truth for the String columns in prisma/schema.prisma.

export const ROLES = ["member", "officer"] as const;
export type Role = (typeof ROLES)[number];

export const EVENT_STATUSES = [
  "active",
  "completed",
  "pending_approval",
  "cancelled",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const TOKEN_TYPES = [
  "email_verification",
  "password_reset",
  "email_change",
] as const;
export type TokenType = (typeof TOKEN_TYPES)[number];

export const SIGNUP_STATUSES = ["confirmed", "waitlisted"] as const;
export type SignupStatus = (typeof SIGNUP_STATUSES)[number];

export const REPORT_STATUSES = ["pending", "approved", "denied"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

// Disciplinary strikes: reaching this many removes (deactivates) a member.
export const MAX_STRIKES = 3;

// "link" invites are shared as a URL; "code" invites as a short typed code.
export const INVITE_KINDS = ["link", "code"] as const;
export type InviteKind = (typeof INVITE_KINDS)[number];

// Member signups (invites with role "member") must use a school email. Officer
// invites, login, password reset, email change, and admin edits are not restricted.
export const ALLOWED_SIGNUP_EMAIL_DOMAIN = "wpsstudent.com";

/** True when the address is on the allowed signup domain (exact match, no subdomains). */
export function isAllowedSignupEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  return email.slice(at + 1).trim().toLowerCase() === ALLOWED_SIGNUP_EMAIL_DOMAIN;
}

export const SESSION_COOKIE = "trim_session";
export const FLASH_COOKIE = "trim_flash";
export const OPS_GRANT_COOKIE = "trim_ops_grant";
// Holds the admin's own session token while they impersonate someone,
// so "stop impersonating" can restore it.
export const IMPERSONATOR_COOKIE = "trim_impersonator";

export const VERIFICATION_TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48h
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
export const OPS_GRANT_TTL_SECONDS = 10 * 60; // 10 min
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
