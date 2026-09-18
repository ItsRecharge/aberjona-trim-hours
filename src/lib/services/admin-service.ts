import type { User } from "@prisma/client";
import { db } from "../db";

/**
 * Admins are officers with the isAdmin flag. Several may exist at once, only
 * admins can grant or revoke it, and admins are protected from demotion and
 * deactivation until the flag is revoked.
 */
export function isAdmin(user: Pick<User, "isAdmin">): boolean {
  return user.isAdmin;
}

export async function setAdmin(userId: number, admin: boolean): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { isAdmin: admin } });
}
