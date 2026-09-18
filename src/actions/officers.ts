"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser, fullName } from "@/lib/current-user";
import { db } from "@/lib/db";
import { issueAuthToken } from "@/lib/services/token-service";
import { AdminProtectionError, setMemberActive } from "@/lib/services/roster-service";
import { setAdmin } from "@/lib/services/admin-service";
import { getPublicBaseUrl } from "@/lib/services/chapter-service";
import { recordAudit } from "@/lib/services/audit-service";
import { sendMail } from "@/lib/email/mailer";
import { passwordResetEmail } from "@/lib/email/templates";
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
    select: { id: true, firstName: true, lastName: true, email: true },
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

  // Optionally email the link straight to the person.
  const emailIt = formData.get("emailIt") != null;
  let emailed = false;
  if (emailIt) {
    try {
      await sendMail({
        to: target.email,
        ...passwordResetEmail(target.firstName, token, await getPublicBaseUrl()),
      });
      emailed = true;
    } catch (err) {
      console.error("[officer-reset] email failed:", err);
    }
  }

  await recordAudit({
    actor: officer,
    action: "officer.passwordResetLink",
    summary: `Generated a password reset link for ${fullName(target)}${emailed ? " and emailed it" : ""}`,
    targetType: "user",
    targetId: userId,
  });
  await setFlash(
    "success",
    emailIt
      ? emailed
        ? `Reset link generated and emailed to ${target.firstName}. Copy below too.`
        : `Reset link generated for ${target.firstName} (email failed — copy it below).`
      : `Reset link generated for ${target.firstName}. Copy it below.`,
  );
  revalidatePath(OFFICERS_PATH);
  redirect(OFFICERS_PATH);
}

/** Deactivate / reactivate an officer. Admins are protected until admin is revoked. */
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
    if (err instanceof AdminProtectionError) {
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

/** Admin-only: grant admin access to an active officer. */
export async function grantAdminAction(formData: FormData): Promise<void> {
  const me = await requireAdmin(OFFICERS_PATH);
  const userId = Number(formData.get("userId"));

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== "officer" || target.deactivatedAt || target.isAdmin) {
    await setFlash("warning", "Pick an active officer who isn't already an admin.");
    redirect(OFFICERS_PATH);
  }

  await setAdmin(target.id, true);

  await recordAudit({
    actor: me,
    action: "admin.grant",
    summary: `Made ${fullName(target)} an admin`,
    targetType: "user",
    targetId: target.id,
  });
  await setFlash("success", `${target.firstName} is now an admin.`);
  revalidatePath(OFFICERS_PATH);
  redirect(OFFICERS_PATH);
}

/** Admin-only: revoke another admin's access. You can't revoke your own. */
export async function revokeAdminAction(formData: FormData): Promise<void> {
  const me = await requireAdmin(OFFICERS_PATH);
  const userId = Number(formData.get("userId"));

  if (userId === me.id) {
    await setFlash("warning", "You can't revoke your own admin access.");
    redirect(OFFICERS_PATH);
  }

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || !target.isAdmin) {
    await setFlash("warning", "That user isn't an admin.");
    redirect(OFFICERS_PATH);
  }

  await setAdmin(target.id, false);

  await recordAudit({
    actor: me,
    action: "admin.revoke",
    summary: `Revoked admin access from ${fullName(target)}`,
    targetType: "user",
    targetId: target.id,
  });
  await setFlash("success", `${target.firstName} is no longer an admin.`);
  revalidatePath(OFFICERS_PATH);
  redirect(OFFICERS_PATH);
}
