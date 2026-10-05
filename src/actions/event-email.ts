"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { eventEmailSchema } from "@/lib/validation";
import { resolveEmailRecipients } from "@/lib/services/event-email-service";
import { emailEventSignups } from "@/lib/email/notify";
import { recordAudit } from "@/lib/services/audit-service";
import { setFlash } from "@/lib/flash";

/** Officer emails the checked signups of one event. Sends synchronously so the flash can report the outcome. */
export async function emailSignupsAction(formData: FormData): Promise<void> {
  const officer = await requireUser("officer");
  const eventId = Number(formData.get("eventId"));
  const backTo = `/officer/events/${eventId}/email`;

  const parsed = eventEmailSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    signupIds: formData.getAll("signupId"),
  });
  if (!parsed.success) {
    await setFlash("danger", parsed.error.issues[0]?.message ?? "Check the form.");
    redirect(backTo);
  }

  const recipients = await resolveEmailRecipients(eventId, parsed.data.signupIds);
  if (!recipients) {
    await setFlash("danger", "Those recipients aren't signed up for this event.");
    redirect("/officer/events");
  }
  if (recipients.emails.length === 0) {
    await setFlash(
      "warning",
      "None of the selected members has a verified, active email address.",
    );
    redirect(backTo);
  }

  const { unconfigured, sent } = await emailEventSignups({
    emails: recipients.emails,
    subject: parsed.data.subject,
    body: parsed.data.body,
    officer,
  });
  if (unconfigured) {
    await setFlash("warning", "Email isn't configured yet — set it up under Integrations.");
    redirect("/officer/events");
  }
  if (sent === 0) {
    await setFlash("danger", "Sending failed — check the email configuration.");
    redirect(backTo);
  }

  const total = recipients.emails.length;
  await recordAudit({
    actor: officer,
    action: "event.email",
    summary: `Emailed ${sent} signup(s) for "${recipients.eventTitle}": "${parsed.data.subject}"`,
    targetType: "event",
    targetId: eventId,
  });
  await setFlash(
    sent === total ? "success" : "warning",
    sent === total
      ? `Emailed ${total} member${total === 1 ? "" : "s"} about "${recipients.eventTitle}".`
      : `Emailed ${sent} of ${total} members about "${recipients.eventTitle}"; the rest failed to send.`,
  );
  redirect("/officer/events");
}
