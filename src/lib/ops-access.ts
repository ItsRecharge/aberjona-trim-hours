import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { getEnv } from "./env";
import { OPS_GRANT_COOKIE } from "./constants";
import { requireUser } from "./current-user";
import { verifyOpsGrant } from "./ops-grant";
import { isAdmin } from "./services/admin-service";

function adminEmails(): Set<string> {
  const raw = getEnv().OPS_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isOpsConsoleEnabled(): boolean {
  // On by default; only an explicit OPS_CONSOLE_ENABLED=false disables it.
  return getEnv().OPS_CONSOLE_ENABLED !== "false";
}

export function isSuperAdmin(user: Pick<User, "email" | "isAdmin">): boolean {
  return isAdmin(user) || adminEmails().has(user.email.toLowerCase());
}

export async function requireSuperAdmin(): Promise<User> {
  const user = await requireUser("officer");
  if (!isOpsConsoleEnabled()) redirect("/officer/admin");
  if (!isSuperAdmin(user)) redirect("/officer/admin");
  return user;
}

export async function hasValidOpsGrant(user: Pick<User, "id" | "email" | "isAdmin">): Promise<boolean> {
  const token = (await cookies()).get(OPS_GRANT_COOKIE)?.value;
  if (!token) return false;
  const grant = await verifyOpsGrant(token);
  return Boolean(
    grant &&
      grant.userId === user.id &&
      grant.email === user.email.toLowerCase() &&
      grant.admin === user.isAdmin,
  );
}

export async function requireOpsGrant(user: Pick<User, "id" | "email" | "isAdmin">): Promise<void> {
  if (!(await hasValidOpsGrant(user))) redirect("/officer/ops");
}