import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { db } from "./db";
import { getSession } from "./session";
import type { Role } from "./constants";

/**
 * Resolve the logged-in user from the session cookie, re-checking the DB so a
 * deleted or demoted user can't keep acting on a stale JWT.
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({ where: { id: session.userId } });
}

export async function requireUser(role?: Role): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) {
    redirect(user.role === "officer" ? "/officer/dashboard" : "/member/dashboard");
  }
  return user;
}

export function fullName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`.trim();
}
