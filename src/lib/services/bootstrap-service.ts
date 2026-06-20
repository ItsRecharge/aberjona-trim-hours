import type { User } from "@prisma/client";

export const BOOTSTRAP_PROTECTION_YEARS = 1;

export function bootstrapProtectionEndsAt(user: Pick<User, "isBootstrapOfficer" | "createdAt">): Date | null {
  if (!user.isBootstrapOfficer) return null;
  const end = new Date(user.createdAt);
  end.setUTCFullYear(end.getUTCFullYear() + BOOTSTRAP_PROTECTION_YEARS);
  return end;
}

export function isBootstrapProtected(
  user: Pick<User, "isBootstrapOfficer" | "createdAt">,
  now = new Date(),
): boolean {
  const end = bootstrapProtectionEndsAt(user);
  return end !== null && now < end;
}
