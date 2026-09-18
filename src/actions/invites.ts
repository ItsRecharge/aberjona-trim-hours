"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, fullName } from "@/lib/current-user";
import { inviteSchema } from "@/lib/validation";
import { createInvite, revokeInvite } from "@/lib/services/invite-service";
import { getChapterSettings, getPublicBaseUrl } from "@/lib/services/chapter-service";
import { sendMail } from "@/lib/email/mailer";
import { inviteEmail } from "@/lib/email/templates";
import { recordAudit } from "@/lib/services/audit-service";
import { setFlash } from "@/lib/flash";
import { formatInviteCode, parseInviteEmails } from "@/lib/invite-code";

const INVITES_PATH = "/officer/invites";
const REVEAL_COOKIE = "trim_last_invite";

export async function createInviteAction(formData: FormData): Promise<void> {
  const officer = await requireUser("officer");
  const parsed = inviteSchema.safeParse({
    expiresInDays: formData.get("expiresInDays"),
    maxUses: formData.get("maxUses") || undefined,
    role: formData.get("role") || "member",
    kind: formData.get("kind") || "link",
  });
  if (!parsed.success) {
    await setFlash("danger", parsed.error.issues[0].message);
    redirect(INVITES_PATH);
  }
  const recipients = parseInviteEmails(String(formData.get("emails") ?? ""));
  if (recipients.error) {
    await setFlash("danger", recipients.error);
    redirect(INVITES_PATH);
  }
  const emails = recipients.emails ?? [];

  const baseUrl = await getPublicBaseUrl();

  if (emails.length > 0) {
    // Emailed invites: one single-use link per address; type and max uses are ignored.
    const chapterName = (await getChapterSettings()).chapterName;
    let sent = 0;
    for (const email of emails) {
      const { invite, rawToken } = await createInvite({
        createdById: officer.id,
        role: parsed.data.role,
        expiresInDays: parsed.data.expiresInDays,
        maxUses: 1,
        email,
      });
      const link = `${baseUrl}/signup?invite=${rawToken}`;
      try {
        await sendMail({
          to: email,
          ...inviteEmail(link, invite.expiresAt, fullName(officer), chapterName),
        });
        sent++;
      } catch (err) {
        console.error("[invites] email failed:", email, err);
      }
      await recordAudit({
        actor: officer,
        action: "invite.create",
        summary: `Created a ${parsed.data.role} invite for ${email}`,
        targetType: "invite",
        targetId: invite.id,
      });
    }
    const total = emails.length;
    if (sent === total) {
      await setFlash("success", `Emailed ${total} invite${total === 1 ? "" : "s"}.`);
    } else {
      await setFlash(
        "warning",
        `Emailed ${sent} of ${total} invites; the rest failed to send.`,
      );
    }
    revalidatePath(INVITES_PATH);
    redirect(INVITES_PATH);
  }

  const { invite, rawToken, code } = await createInvite({
    createdById: officer.id,
    role: parsed.data.role,
    expiresInDays: parsed.data.expiresInDays,
    maxUses: parsed.data.maxUses,
    kind: parsed.data.kind,
  });
  const reveal = code ? formatInviteCode(code) : `${baseUrl}/signup?invite=${rawToken}`;

  await recordAudit({
    actor: officer,
    action: "invite.create",
    summary: `Created a ${parsed.data.role} invite ${code ? "code" : "link"}`,
    targetType: "invite",
    targetId: invite.id,
  });
  await setFlash(
    "success",
    code
      ? "Invite code created — share it below."
      : "Invite link created — copy it below to share.",
  );

  // The raw link is shown once via a short-lived cookie, then cleared.
  const { cookies } = await import("next/headers");
  (await cookies()).set(REVEAL_COOKIE, reveal, {
    path: INVITES_PATH,
    maxAge: 120,
    sameSite: "lax",
  });

  revalidatePath(INVITES_PATH);
  redirect(INVITES_PATH);
}

export async function revokeInviteAction(formData: FormData): Promise<void> {
  const officer = await requireUser("officer");
  const inviteId = Number(formData.get("inviteId"));
  await revokeInvite(inviteId);
  await recordAudit({
    actor: officer,
    action: "invite.revoke",
    summary: `Revoked invite #${inviteId}`,
    targetType: "invite",
    targetId: inviteId,
  });
  await setFlash("info", "Invite revoked.");
  revalidatePath(INVITES_PATH);
  redirect(INVITES_PATH);
}
