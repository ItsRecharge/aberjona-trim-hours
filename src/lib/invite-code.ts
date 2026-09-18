import crypto from "node:crypto";
import { z } from "zod";

/** Unambiguous alphabet: no 0/O, 1/I. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/** Random 8-character invite code in its stored (unformatted) form. */
export function generateInviteCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

/** Display form: XXXX-XXXX. */
export function formatInviteCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Turns whatever a person typed into the stored form, or null when it can't be
 * a code (so callers can fall back to treating the input as a link token).
 */
export function normalizeInviteCode(raw: string): string | null {
  const cleaned = raw.toUpperCase().replace(/[\s-]/g, "");
  return cleaned.length === CODE_LENGTH && /^[A-Z0-9]+$/.test(cleaned) ? cleaned : null;
}

const email = z.string().email();

/** Comma/whitespace-separated addresses → trimmed, lowercased, deduped list. */
export function parseInviteEmails(raw: string): { emails: string[]; error?: undefined } | { error: string; emails?: undefined } {
  const seen = new Set<string>();
  for (const part of raw.split(/[\s,]+/)) {
    const candidate = part.trim().toLowerCase();
    if (!candidate) continue;
    if (!email.safeParse(candidate).success) return { error: `Invalid email: ${part.trim()}` };
    seen.add(candidate);
  }
  return { emails: [...seen] };
}
