"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, fullName } from "@/lib/current-user";
import { db } from "@/lib/db";
import { issueAuthToken } from "@/lib/services/token-service";
import {
  BootstrapOfficerProtectionError,
  setMemberActive,
} from "@/lib/services/roster-service";
import { getPublicBaseUrl } from "@/lib/services/chapter-service";
import { recordAudit } from "@/lib/services/audit-service";
import { setFlash } from "@/lib/flash";

const OFFICERS_PATH = "/officer/officers";
const RESET_LINK_COOKIE = "trim_last_reset_link";

async function targetName(userId: number): Promise<string> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });
  return u ? fullName(u) : `user #${userId}`;
}

/**
 * Generates a one-time password-reset link for another user and reveals it via a
 * short-lived cookie (the master admin resets their own password from Settings).
 */
export async function sendPasswordResetForUserAction(formData: FormData): Promise<void> {
  const officer = await requireUser("officer");
  const userId = Number(formData.get("userId"));

  if (userId === officer.id) {
    await setFlash("info", "Reset your own password from Settings.");
    redirect(OFFICERS_PATH);
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!target) {
    await setFlash("danger", "That account no longer exists.");
    redirect(OFFICERS_PATH);
  }

  const token = await issueAuthToken(userId, "password_reset");
  const link = `${await getPublicBaseUrl()}/reset-password?token=${token}`;

  (await cookies()).set(RESET_LINK_COOKIE, link, {
    path: OFFICERS_PATH,
    maxAge: 300,
    sameSite: "lax",
  });

  await recordAudit({
    actor: officer,
    action: "officer.passwordResetLink",
    summary: `Generated a password reset link for ${fullName(target)}`,
    targetType: "user",
    targetId: userId,
  });
  await setFlash("success", `Reset link generated for ${target.firstName}. Copy it below.`);
  revalidatePath(OFFICERS_PATH);
  redirect(OFFICERS_PATH);
}

/** Deactivate / reactivate an officer. Bootstrap officer is protected for year one. */
export async function setOfficerActiveAction(formData: FormData): Promise<void> {
  const officer = await requireUser("officer");
  const userId = Number(formData.get("userId"));
  const active = formData.get("active") === "true";

  if (userId === officer.id) {
    await setFlash("warning", "You can't deactivate your own account.");
    redirect(OFFICERS_PATH);
  }

  try {
    await setMemberActive(userId, active);
  } catch (err) {
    if (err instanceof BootstrapOfficerProtectionError) {
      await setFlash("warning", err.message);
      redirect(OFFICERS_PATH);
    }
    throw err;
  }

  await recordAudit({
    actor: officer,
    action: active ? "officer.reactivate" : "officer.deactivate",
    summary: `${active ? "Reactivated" : "Deactivated"} ${await targetName(userId)}`,
    targetType: "user",
    targetId: userId,
  });
  await setFlash("info", active ? "Officer reactivated." : "Officer deactivated.");
  revalidatePath(OFFICERS_PATH);
  redirect(OFFICERS_PATH);
}
